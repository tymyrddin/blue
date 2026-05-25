# Detecting LoLbin abuse

Living-off-the-land attacks use signed system binaries for malicious purposes.
Detection relies on process ancestry, command line analysis, network behaviour, and
deviation from established baselines.

## High-priority LoLbins to monitor

These produce the highest attacker value and the clearest detection signal:

| Binary | Suspicious behaviour |
|--------|---------------------|
| certutil.exe | outbound network connections, `-urlcache`, `-decode` of downloaded files |
| mshta.exe | any execution in an enterprise environment; any network connection |
| regsvr32.exe | loading remote SCT files, network connections |
| wmic.exe | process creation (`call create`), remote execution |
| rundll32.exe | JavaScript execution, unusual DLL paths |
| bitsadmin.exe | download jobs to external IPs |
| msiexec.exe | install from remote URL, install without user context |
| cmstp.exe | loading remote INF files |
| installutil.exe | executing unsigned assemblies |

## Sysmon configuration for LoLbin detection

```xml
<!-- Sysmon configuration: flag high-risk LoLbins -->
<EventFiltering>

  <!-- Network connections from LoLbins (Event ID 3) -->
  <NetworkConnect onmatch="include">
    <Image condition="end with">certutil.exe</Image>
    <Image condition="end with">mshta.exe</Image>
    <Image condition="end with">regsvr32.exe</Image>
    <Image condition="end with">bitsadmin.exe</Image>
    <Image condition="end with">msiexec.exe</Image>
    <Image condition="end with">wmic.exe</Image>
  </NetworkConnect>

  <!-- Process creation: suspicious parent-child chains (Event ID 1) -->
  <ProcessCreate onmatch="include">
    <!-- Office apps spawning shells -->
    <ParentImage condition="end with">WINWORD.EXE</ParentImage>
    <ParentImage condition="end with">EXCEL.EXE</ParentImage>
    <ParentImage condition="end with">OUTLOOK.EXE</ParentImage>
    <ParentImage condition="end with">POWERPNT.EXE</ParentImage>
    <!-- mshta spawning anything -->
    <ParentImage condition="end with">mshta.exe</ParentImage>
    <!-- wmic spawning process -->
    <ParentImage condition="end with">wmic.exe</ParentImage>
  </ProcessCreate>

  <!-- PowerShell with encoded command or download indicators (Event ID 1) -->
  <ProcessCreate onmatch="include">
    <Image condition="end with">powershell.exe</Image>
    <CommandLine condition="contains"> -enc </CommandLine>
    <CommandLine condition="contains">DownloadString</CommandLine>
    <CommandLine condition="contains">DownloadData</CommandLine>
    <CommandLine condition="contains">IEX</CommandLine>
    <CommandLine condition="contains">Invoke-Expression</CommandLine>
    <CommandLine condition="contains">-nop</CommandLine>
  </ProcessCreate>

</EventFiltering>
```

## Sigma rules for SIEM detection

```yaml
# certutil network activity
title: Certutil Network Connection
status: stable
logsource:
  product: windows
  category: network_connection
detection:
  selection:
    Image|endswith: '\certutil.exe'
    Initiated: 'true'
  condition: selection
falsepositives:
  - Legitimate certificate retrieval (rare; verify destination)
level: high

---

# mshta execution (any instance is suspicious in many environments)
title: MSHTA Execution
status: stable
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    Image|endswith: '\mshta.exe'
  condition: selection
falsepositives:
  - Legacy applications using HTA
level: medium

---

# encoded PowerShell from non-admin user
title: Encoded PowerShell from Standard User
status: stable
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    Image|endswith: '\powershell.exe'
    CommandLine|contains: ' -enc '
  filter_admins:
    User|contains:
      - 'Administrator'
      - 'SYSTEM'
  condition: selection and not filter_admins
falsepositives:
  - Legitimate automation scripts (document and whitelist)
level: high
```

## Investigating a LoLbin alert

When a LoLbin alert fires, gather context before making a determination:

```powershell
# PowerShell investigation script
param([int]$pid)

$proc = Get-CimInstance Win32_Process -Filter "ProcessId = $pid"
Write-Output "Process: $($proc.Name) (PID: $pid)"
Write-Output "Command line: $($proc.CommandLine)"
Write-Output "Parent PID: $($proc.ParentProcessId)"

$parent = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.ParentProcessId)"
Write-Output "Parent: $($parent.Name) - $($parent.CommandLine)"

# check network connections from this process
$netConns = Get-NetTCPConnection | Where-Object { $_.OwningProcess -eq $pid }
foreach ($conn in $netConns) {
    Write-Output "Network: $($conn.LocalAddress):$($conn.LocalPort) -> $($conn.RemoteAddress):$($conn.RemotePort) [$($conn.State)]"
}

# check child processes
Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $pid } |
  Select-Object ProcessId, Name, CommandLine
```

Questions to answer:

1. What is the full parent-child process chain back to the session root?
2. Does the command line contain encoded data, download URLs, or suspicious parameters?
3. Did the process make outbound network connections? To what destinations?
4. What files did the process create or modify?
5. Is the user who ran it expected to run this tool?

## Baselining LoLbin usage

Alerts on LoLbins without a baseline generate too many false positives for managed
environments. Establish what is normal first:

```powershell
# collect 30 days of process creation events for key LoLbins
# from Windows Event Log or SIEM
Get-WinEvent -FilterHashtable @{
    LogName = 'Microsoft-Windows-Sysmon/Operational'
    Id = 1
} | Where-Object {
    $_.Properties[4].Value -match 'certutil|mshta|regsvr32|bitsadmin'
} | Select-Object TimeCreated,
    @{n='Image';e={$_.Properties[4].Value}},
    @{n='CommandLine';e={$_.Properties[10].Value}},
    @{n='User';e={$_.Properties[12].Value}} |
    Export-Csv lolbin_baseline.csv -NoTypeInformation
```

Document every legitimate use. Write suppression rules for those specific patterns.
Alert on everything else.
