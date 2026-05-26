# WMI remote execution

Hypothesis: an attacker is executing processes on servers remotely via WMI.

WMI remote execution spawns a process on the target host with `WmiPrvSE.exe` as the parent.
That parent relationship is normal for legitimate management tooling, so the signal is in
the child process: management tools produce consistent, known command lines at scheduled
intervals. A process under `WmiPrvSE.exe` with an encoded command line, a download pattern,
or a temporary directory path, appearing once on one host, is a different class of event.

Data sources: `Sysmon Event ID 1` (process creation) on server hosts; requires Sysmon
deployed with a configuration capturing `ParentImage`.

```powershell
$startTime = (Get-Date).AddDays(-7)

$events = Get-WinEvent -ComputerName SERVER_NAME -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = 1
    StartTime = $startTime
} | Where-Object {
    $_.Properties[20].Value -match 'WmiPrvSE\.exe'
}

$events | ForEach-Object {
    [PSCustomObject]@{
        Time        = $_.TimeCreated
        ProcessName = $_.Properties[4].Value
        CommandLine = $_.Properties[10].Value
        User        = $_.Properties[12].Value
        ParentImage = $_.Properties[20].Value
    }
} |
    Where-Object {
        # flag suspicious child process command lines
        $_.CommandLine -match '-enc|-EncodedCommand|DownloadString|IEX|Invoke-Expression|cmd\.exe|powershell|certutil|%TEMP%'
    } |
    Sort-Object Time
```

`WmiPrvSE.exe` legitimately spawns child processes for SCCM, monitoring agents, and backup
software. Known-legitimate processes appear consistently across multiple hosts and at
scheduled intervals. Low-frequency command lines appearing once, on one host, are the
priority.
