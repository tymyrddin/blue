# Detecting BYOVD attacks

A Bring Your Own Vulnerable Driver attack loads a legitimate but exploitable kernel
driver to disable endpoint protections. Detection focuses on driver load events,
service creation, and the subsequent loss of EDR telemetry.

## Monitor driver load events

Every driver load is logged. Suspicious load events:

Windows System Event Log:
- Event ID 7045: New service installed. Contains service name, image path, and type.
  A kernel driver service (Type: 1) installed from an unusual path is suspicious.
- Event ID 7036: Service state change (start/stop). Combined with 7045 for the same
  service name, shows a driver was loaded and then removed.

Sysmon:
- Event ID 6: Driver loaded. Includes the image path and whether the driver is signed.

```powershell
# search for recently installed kernel driver services
Get-WinEvent -LogName System |
  Where-Object { $_.Id -eq 7045 } |
  Where-Object { $_.Message -match 'kernel' } |
  Select-Object TimeCreated,
    @{n='ServiceName';e={$_.Properties[0].Value}},
    @{n='ImagePath';e={$_.Properties[1].Value}},
    @{n='ServiceType';e={$_.Properties[2].Value}} |
  Format-List

# flag kernel drivers loaded from unusual paths
# legitimate drivers are typically in C:\Windows\System32\drivers\
# a kernel driver loaded from C:\ProgramData\, C:\Users\, or a temp directory is suspicious
```

Sigma rule for unusual driver load:

```yaml
title: Kernel Driver Loaded from Unusual Path
status: stable
logsource:
  product: windows
  service: system
detection:
  selection:
    EventID: 7045
    ServiceType: 'kernel mode driver'
  filter_legitimate:
    ImagePath|startswith:
      - 'C:\Windows\System32\drivers\'
      - 'C:\Windows\SysWOW64\'
      - 'C:\Program Files\'
      - 'C:\Program Files (x86)\'
  condition: selection and not filter_legitimate
falsepositives:
  - Legitimate third-party driver installation from non-standard paths
level: high
```

## Hash-based detection of known vulnerable drivers

The LOLDrivers project maintains SHA256 hashes of known vulnerable drivers. Compare
loaded drivers against this list:

```powershell
# get hashes of all currently loaded drivers
$drivers = Get-WmiObject Win32_SystemDriver | Where-Object { $_.State -eq 'Running' }
foreach ($driver in $drivers) {
    if (Test-Path $driver.PathName) {
        $hash = (Get-FileHash $driver.PathName -Algorithm SHA256).Hash
        Write-Output "$($driver.Name): $hash ($($driver.PathName))"
    }
}
# compare against loldrivers.io hash list
# or use a downloaded copy of the loldrivers.csv
```

Automate this check on a schedule and alert on any match:

```powershell
# download loldrivers list and check running drivers
$lolDrivers = (Invoke-WebRequest 'https://www.loldrivers.io/api/drivers.json').Content | ConvertFrom-Json

$runningHashes = Get-WmiObject Win32_SystemDriver |
  Where-Object { $_.State -eq 'Running' -and (Test-Path $_.PathName) } |
  ForEach-Object { (Get-FileHash $_.PathName -Algorithm SHA256).Hash }

foreach ($hash in $runningHashes) {
    $match = $lolDrivers | Where-Object { $_.KnownVulnerableSamples.SHA256 -contains $hash }
    if ($match) {
        Write-Warning "VULNERABLE DRIVER LOADED: $($match.Tags -join ', ')"
    }
}
```

## Detect loss of EDR kernel telemetry

A BYOVD attack that successfully removes kernel callbacks causes the EDR to stop
receiving telemetry events. This is detectable as an absence:

If a host suddenly stops generating process creation events (Sysmon Event ID 1) while
the Sysmon service is still running, kernel callbacks may have been removed.

```powershell
# SIEM query: host had events in the last hour but has none in the last 10 minutes
# while the Sysmon service heartbeat is still present
# (exact implementation depends on SIEM platform)
# flag: host with Sysmon service up but no process_creation events for > 5 minutes
```

Some EDR products generate a self-monitoring heartbeat event. Configure alerting on
the absence of this heartbeat from enrolled hosts.

## Detect EDR process termination

If the BYOVD attack uses process termination (e.g. procexp152.sys) rather than
callback removal:

```powershell
# monitor for unexpected termination of known EDR processes
# create a scheduled task or watchdog that checks EDR process health
$edrProcesses = @('MsMpEng', 'SentinelAgent', 'CSFalconService', 'cb', 'xagt')
foreach ($proc in $edrProcesses) {
    if (-not (Get-Process $proc -ErrorAction SilentlyContinue)) {
        # EDR process not running: generate alert
        Write-Warning "EDR process $proc not found"
    }
}
```

Windows Event ID 4689 (Process exit) combined with the process name of the EDR
product is a direct indicator if the termination was not a scheduled stop.

## Investigate a BYOVD incident

When a suspicious driver load is confirmed:

```powershell
# collect evidence
$serviceName = 'SuspiciousService'

# service details
Get-WmiObject Win32_SystemDriver -Filter "Name = '$serviceName'" |
  Select-Object Name, State, PathName, ServiceType

# driver file details
$driverPath = (Get-WmiObject Win32_SystemDriver -Filter "Name = '$serviceName'").PathName
Get-FileHash $driverPath -Algorithm SHA256
Get-AuthenticodeSignature $driverPath | Select-Object Status, SignerCertificate

# check LOLDrivers
# if the hash matches a known entry, record the CVE and known capabilities

# check what happened before and after the driver load
# (process creation, network connections, registry changes)
Get-WinEvent -LogName System | Where-Object {
    $_.TimeCreated -gt (Get-Date).AddMinutes(-30) -and $_.Id -in @(7045, 7036)
}
```

Stop the service and remove the driver file only after evidence is preserved:

```powershell
# preserve evidence first
Copy-Item $driverPath C:\Evidence\driver_evidence.sys
Get-FileHash $driverPath | Out-File C:\Evidence\driver_hash.txt

# then stop and remove
sc.exe stop $serviceName
sc.exe delete $serviceName
```
