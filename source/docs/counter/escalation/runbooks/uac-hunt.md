# UAC bypass detection

Two hunts: registry writes to known auto-elevation keys correlated with subsequent process
spawns, and integrity level analysis to find high-integrity processes descending from
medium-integrity parents without an intervening consent dialog.

## Registry write to auto-elevation keys

Hypothesis: an attacker is staging a UAC bypass by writing to a user-writable HKCU
registry path that an auto-elevated binary will read on launch.

Data sources: `Sysmon Event ID 13` (RegistryEvent, registry value set); requires Sysmon
with registry monitoring enabled for HKCU\Software\Classes.

The key paths associated with the three most commonly observed bypass patterns:
- `HKCU\Software\Classes\ms-settings\shell\open\command` (fodhelper.exe)
- `HKCU\Software\Classes\Folder\shell\open\command` (sdclt.exe)
- `HKCU\Software\Classes\mscfile\shell\open\command` (eventvwr.exe)

```powershell
$startTime = (Get-Date).AddHours(-24)
$bypassPaths = @(
    'ms-settings\\shell\\open\\command',
    'Folder\\shell\\open\\command',
    'mscfile\\shell\\open\\command'
)

$pattern = ($bypassPaths | ForEach-Object { [regex]::Escape($_) }) -join '|'

Get-WinEvent -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = 13
    StartTime = $startTime
} | ForEach-Object {
    $xml     = [xml]$_.ToXml()
    $data    = $xml.Event.EventData.Data
    $keyPath = ($data | Where-Object Name -eq 'TargetObject').'#text'
    $details = ($data | Where-Object Name -eq 'Details').'#text'
    $process = ($data | Where-Object Name -eq 'Image').'#text'

    if ($keyPath -match $pattern) {
        [PSCustomObject]@{
            Time    = $_.TimeCreated
            KeyPath = $keyPath
            Value   = $details
            Writer  = $process
        }
    }
} | Sort-Object Time
```

The correlation of interest is a registry write by process A, followed within a short
time window (typically seconds) by an auto-elevated binary starting from the same session.
The second query flags the launch side:

```powershell
$autoelevated = @('fodhelper.exe', 'sdclt.exe', 'eventvwr.exe')

Get-WinEvent -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = 1
    StartTime = $startTime
} | ForEach-Object {
    $xml       = [xml]$_.ToXml()
    $data      = $xml.Event.EventData.Data
    $image     = ($data | Where-Object Name -eq 'Image').'#text'
    $parent    = ($data | Where-Object Name -eq 'ParentImage').'#text'
    $integrity = ($data | Where-Object Name -eq 'IntegrityLevel').'#text'

    $imageName = Split-Path $image -Leaf
    if ($autoelevated -contains $imageName -and $integrity -eq 'High') {
        [PSCustomObject]@{
            Time      = $_.TimeCreated
            Process   = $image
            Parent    = $parent
            Integrity = $integrity
        }
    }
} | Sort-Object Time
```

Joining events from both queries by session and time window, with registry write preceding
auto-elevated binary launch, is the bypass indicator. Fodhelper.exe launching from an
explorer.exe parent at High integrity with a recent HKCU write to ms-settings is the
canonical case.

## High-integrity process from medium-integrity parent

Hypothesis: a UAC bypass has succeeded, producing a high-integrity child process from a
medium-integrity parent without a UAC consent dialog.

Data sources: `Sysmon Event ID 1` (ProcessCreate) with IntegrityLevel field; requires
Sysmon 6.0 or later.

```powershell
$startTime = (Get-Date).AddHours(-24)

$events = Get-WinEvent -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = 1
    StartTime = $startTime
} | ForEach-Object {
    $xml  = [xml]$_.ToXml()
    $data = $xml.Event.EventData.Data

    [PSCustomObject]@{
        Time        = $_.TimeCreated
        ProcessId   = ($data | Where-Object Name -eq 'ProcessId').'#text'
        Image       = ($data | Where-Object Name -eq 'Image').'#text'
        Integrity   = ($data | Where-Object Name -eq 'IntegrityLevel').'#text'
        ParentId    = ($data | Where-Object Name -eq 'ParentProcessId').'#text'
        ParentImage = ($data | Where-Object Name -eq 'ParentImage').'#text'
    }
}

$byPid = @{}
foreach ($e in $events) { $byPid[$e.ProcessId] = $e }

$events | Where-Object {
    $_.Integrity -eq 'High' -and
    $byPid.ContainsKey($_.ParentId) -and
    $byPid[$_.ParentId].Integrity -eq 'Medium'
} | Select-Object Time, Image, Integrity, ParentImage |
    Sort-Object Time
```

Legitimate elevation produces a High-integrity process with a consent.exe or dllhost.exe
(COM elevation) parent, or with a SYSTEM-level process as the direct creator. A
High-integrity process descending from a Medium-integrity scripting host, terminal
emulator, or explorer.exe instance warrants investigation.
Last updated: 26 May 2026
