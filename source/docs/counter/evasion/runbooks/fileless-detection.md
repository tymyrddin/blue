# Detecting fileless and in-memory execution

Fileless payloads leave no file on disk. Detection relies on script block logging,
ETW telemetry, memory scanning, and behavioural indicators.

## Enable script block logging

Script block logging captures the decoded content of every PowerShell script block
before execution, including content downloaded from the network and decoded from
base64. This is the primary control for PowerShell-based fileless attacks.

```powershell
# enable via registry (applies to current machine)
$sbPath = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging'
if (-not (Test-Path $sbPath)) { New-Item $sbPath -Force }
Set-ItemProperty $sbPath -Name EnableScriptBlockLogging -Value 1
Set-ItemProperty $sbPath -Name EnableScriptBlockInvocationLogging -Value 1

# verify
Get-ItemProperty $sbPath
```

Script block logging fires Event ID 4104 in `Microsoft-Windows-PowerShell/Operational`.
Collect this log centrally: it can be very high volume on busy systems.

```powershell
# search script block logs for suspicious content
Get-WinEvent -LogName 'Microsoft-Windows-PowerShell/Operational' |
  Where-Object { $_.Id -eq 4104 } |
  Where-Object {
    $_.Message -match 'DownloadString|DownloadData|IEX|Invoke-Expression|AmsiUtils|amsiContext|reflection\.assembly'
  } |
  Select-Object TimeCreated, @{n='Content';e={$_.Message}} |
  Format-List
```

## Detect in-memory .NET assembly loads

The CLR ETW provider logs assembly loads including those from byte arrays. Events
appear in `Microsoft-Windows-DotNETRuntime` ETW session.

```powershell
# search Windows event logs for anonymous assembly loads
# (assemblies loaded from memory have no file path)
# note: CLR assembly load events are primarily accessible via ETW tracing tools
# (PerfView, dotnet-trace); the DotNETRuntime/Operational Windows Event Log channel
# has limited population in default configurations
Get-WinEvent -LogName 'Microsoft-Windows-DotNETRuntime/Operational' -ErrorAction SilentlyContinue |
  Where-Object { $_.Message -notmatch 'file:///' } |
  Select-Object TimeCreated, Id, Message
```

Sysmon Event ID 7 (ImageLoad) logs DLL loads. An executable image loaded from memory
without an associated file path is suspicious:

```xml
<!-- Sysmon: flag in-memory image loads (no file path) -->
<ImageLoad onmatch="include">
  <ImageLoaded condition="contains">FromMemory</ImageLoaded>
</ImageLoad>
```

## Detect WMI event subscription persistence

Fileless persistence via WMI subscriptions is detectable in WMI event logs and via
active query:

```powershell
# list all WMI event subscriptions
Get-WMIObject -Namespace root\subscription -Class __EventFilter |
  Select-Object Name, Query, QueryLanguage

Get-WMIObject -Namespace root\subscription -Class CommandLineEventConsumer |
  Select-Object Name, CommandLineTemplate

Get-WMIObject -Namespace root\subscription -Class __FilterToConsumerBinding |
  Select-Object Filter, Consumer
```

Any subscription with a command line containing PowerShell, cmd.exe, base64, or
download functions warrants investigation. Legitimate WMI subscriptions are rare
in many environments; document all known-good ones and alert on the rest.

```powershell
# WMI activity log: Event ID 5859, 5860, 5861 in Microsoft-Windows-WMI-Activity/Operational
Get-WinEvent -LogName 'Microsoft-Windows-WMI-Activity/Operational' |
  Where-Object { $_.Id -in @(5859, 5860, 5861) } |
  Where-Object { $_.Message -match 'powershell|cmd|encode|download' } |
  Select-Object TimeCreated, Message | Format-List
```

## Memory scanning for injected code

For live systems where injection is suspected:

```powershell
# check all running processes for anonymous executable memory regions
$processes = Get-Process
foreach ($proc in $processes) {
    try {
        $modules = $proc.Modules
        # if process has fewer modules than expected, possible injection target
    } catch { }
}

# use Get-InjectedThread (PowerShell script by Jared Atkinson)
# detects threads starting in unbacked memory regions
# https://gist.github.com/jaredcatkinson/23905d34537ce4b5b1818c3e6405c1d2
```

For offline or post-incident analysis, Volatility:

```text
# detect injected code: executable memory not backed by a file on disk
vol -f memory.raw windows.malfind              # all processes
vol -f memory.raw windows.malfind --pid TARGET_PID

# look for:
# - VAD regions marked executable with no file path
# - PE headers in anonymous memory (DWORD 0x4d5a = "MZ")
# - High-entropy executable regions (potential encoded payload)
```

## Detect direct syscall usage

Direct syscall usage bypasses userland API hooks but still generates kernel-level
events. The thread call stack at the time of the syscall does not pass through ntdll,
which is detectable:

EDR products with kernel stack inspection flag threads that enter the kernel without
the expected ntdll call frames. This is a specialised capability; check whether the
deployed EDR includes it.

At the SIEM level, flag processes that perform sensitive operations (VirtualAllocEx,
WriteProcessMemory equivalents) without corresponding API calls visible in userland
hooks. The absence of the expected hook telemetry alongside kernel-level events is
the signal.

## Detecting AMSI bypass attempts

AMSI bypass attempts are often themselves detectable:

```powershell
# search script block logs for known AMSI bypass patterns
Get-WinEvent -LogName 'Microsoft-Windows-PowerShell/Operational' |
  Where-Object { $_.Id -eq 4104 } |
  Where-Object {
    $_.Message -match 'amsiUtils|amsiContext|amsiInitFailed|AmsiScanBuffer|amsi\.dll'
  } |
  Select-Object TimeCreated, @{n='ScriptBlock';e={$_.Message[0..500] -join ''}}
```

Note: a successful AMSI bypass means subsequent script blocks are not scanned and
may not be logged. The bypass attempt itself is logged (before AMSI is disabled);
subsequent activity may not be. Treat any AMSI bypass detection as a high-priority
incident.

## Correlating across telemetry sources

Fileless attacks rarely leave a single detectable event. Correlation is required:

1. Script block log showing encoded PowerShell download
2. DNS log showing query to attacker domain
3. Network log showing HTTPS connection to cloud storage
4. WMI activity log showing subscription creation
5. No file creation events (absence of expected events is itself a signal)

A SIEM correlation rule that fires when a host shows script block logging activity
AND network connections to new domains AND WMI subscription changes within a 10-minute
window is far more reliable than any single indicator.
Last updated: 10 July 2026
