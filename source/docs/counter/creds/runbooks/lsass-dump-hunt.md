# LSASS and OS credential store hunting

Four hunts for credential dumping activity: unexpected process access to LSASS memory, dump
techniques using living-off-the-land binaries, shadow copy and NTDS.dit extraction, and SAM
and SYSTEM registry hive access.

Data source: Windows Security Event Log and Sysmon operational log (if deployed). Queries for
LSASS and SAM run on member machines; NTDS.dit queries run on the domain controller.

## Unexpected LSASS process access

Hypothesis: a process is reading LSASS memory to extract in-memory credentials. Legitimate access
to lsass.exe is limited to a small set of system components, antivirus, and EDR sensors. Any other
caller is worth examining.

```powershell
# Sysmon Event 10: process access targeting lsass.exe
# Requires Sysmon deployed with a ProcessAccess rule covering lsass.exe
$xpath = '*[System[EventID=10] and EventData[Data[@Name="TargetImage"]="C:\Windows\System32\lsass.exe"]]'

Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' -FilterXPath $xpath -ErrorAction SilentlyContinue |
  ForEach-Object {
    [xml]$xml = $_.ToXml()
    $d = @{}
    $xml.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [PSCustomObject]@{
      Time          = $_.TimeCreated
      SourceImage   = $d['SourceImage']
      GrantedAccess = $d['GrantedAccess']
      CallTrace     = $d['CallTrace']
    }
  } |
  Where-Object { $_.SourceImage -notmatch 'MsMpEng|SenseIR|csrss|werfault|AV' } |
  Sort-Object Time -Descending | Select-Object -First 30
```

GrantedAccess values common in credential dumping tooling: `0x1010`, `0x1038`, `0x143a`,
`0x1fffff`. Legitimate callers typically request narrower masks. The CallTrace field shows the
DLL call chain; an unrecognised or unsigned DLL appearing alongside lsass.exe access is a
stronger indicator than the access mask alone.

## Dump techniques via LOL binaries

Hypothesis: an attacker is using a system-supplied binary to create a memory dump of LSASS,
avoiding third-party tooling that security sensors recognise by name.

```powershell
# Sysmon Event 1: process creation with dump-related command lines
# Covers: comsvcs.dll MiniDump, ProcDump against lsass, out-minidump
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' -FilterXPath '*[System[EventID=1]]' -ErrorAction SilentlyContinue |
  ForEach-Object {
    [xml]$xml = $_.ToXml()
    $d = @{}
    $xml.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [PSCustomObject]@{
      Time        = $_.TimeCreated
      Image       = $d['Image']
      CommandLine = $d['CommandLine']
      ParentImage = $d['ParentImage']
      User        = $d['User']
    }
  } |
  Where-Object {
    $_.CommandLine -match 'comsvcs|MiniDump|procdump.*lsass|out-minidump'
  } |
  Sort-Object Time -Descending | Select-Object -First 20
```

The comsvcs.dll technique invokes MiniDump via `rundll32.exe C:\Windows\System32\comsvcs.dll,
MiniDump <pid> <outfile> full`. ProcDump with `-ma lsass.exe` is the Sysinternals equivalent.
Both are legitimate tools in some contexts; the context is the indicator.

## Shadow copy and NTDS.dit extraction

Hypothesis: an attacker is creating a volume shadow copy to reach NTDS.dit while it is locked
by the running directory service, or is using ntdsutil to produce an offline copy directly.

```powershell
# Process creation events for shadow copy and AD database extraction
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' -FilterXPath '*[System[EventID=1]]' -ErrorAction SilentlyContinue |
  ForEach-Object {
    [xml]$xml = $_.ToXml()
    $d = @{}
    $xml.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [PSCustomObject]@{
      Time        = $_.TimeCreated
      Image       = $d['Image']
      CommandLine = $d['CommandLine']
      User        = $d['User']
    }
  } |
  Where-Object {
    $_.CommandLine -match 'vssadmin.*create|shadowcopy.*create|ntdsutil|wbadmin.*start.*backup|esentutl.*ntds'
  } |
  Sort-Object Time -Descending | Select-Object -First 20

# File access to ntds.dit from unexpected processes
# Requires object access auditing enabled on %SystemRoot%\NTDS\
$xpath = '*[System[EventID=4663] and EventData[Data[@Name="ObjectType"]="File"]]'
Get-WinEvent -LogName Security -FilterXPath $xpath -ErrorAction SilentlyContinue |
  ForEach-Object {
    [xml]$xml = $_.ToXml()
    $d = @{}
    $xml.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [PSCustomObject]@{
      Time        = $_.TimeCreated
      SubjectUser = $d['SubjectUserName']
      ObjectName  = $d['ObjectName']
      ProcessName = $d['ProcessName']
    }
  } |
  Where-Object { $_.ObjectName -match 'ntds\.dit' -and $_.ProcessName -notmatch 'lsass' } |
  Sort-Object Time -Descending
```

NTDS.dit access from any process other than lsass.exe is unusual. The file is locked during
normal domain controller operation; reaching it requires either a VSS snapshot or an offline
copy. ntdsutil with `activate instance ntds` followed by `ifm create full` is the built-in
extraction path used by both legitimate backup tooling and attackers.

## SAM and SYSTEM hive access

Hypothesis: an attacker is exporting the SAM registry hive to extract local account credential
hashes for offline cracking or relay.

```powershell
# Registry object access on SAM and SECURITY hives
# Requires registry audit policy enabled on HKLM\SAM
$xpath = '*[System[EventID=4663] and EventData[Data[@Name="ObjectType"]="Key"]]'
Get-WinEvent -LogName Security -FilterXPath $xpath -ErrorAction SilentlyContinue |
  ForEach-Object {
    [xml]$xml = $_.ToXml()
    $d = @{}
    $xml.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [PSCustomObject]@{
      Time        = $_.TimeCreated
      SubjectUser = $d['SubjectUserName']
      ObjectName  = $d['ObjectName']
      ProcessName = $d['ProcessName']
    }
  } |
  Where-Object {
    $_.ObjectName -match '\\SAM\\|\\SECURITY\\' -and
    $_.ProcessName -notmatch 'lsass|svchost|services'
  } |
  Sort-Object Time -Descending | Select-Object -First 20
```

The SAM and SYSTEM hives together contain enough material to derive and crack local account
hashes. `reg save HKLM\SAM` and `reg save HKLM\SYSTEM` are the common extraction commands;
the resulting files can be parsed offline with tools such as impacket's `secretsdump`.
