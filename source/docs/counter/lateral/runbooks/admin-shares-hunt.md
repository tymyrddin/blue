# Admin share access from workstations

Hypothesis: an attacker is using pass-the-hash to access administrative shares on servers
from a workstation.

Admin share access (`admin$`, `C$`) from a standard user workstation to a server is unusual. Legitimate uses are IT support sessions from known admin workstations
and management platforms like SCCM. A user workstation accessing `admin$` on a server tier
host via NTLM, particularly one that has not done so before, is a pass-the-hash indicator.
It frequently precedes PSExec execution, so correlating with `Event ID 7045` (service
installation) on the same target within a short window narrows the finding further.

Data sources: Security event log on server hosts (`Event ID 5140`); requires audit policy
"Audit File Share" set to Success.

```powershell
$startTime = (Get-Date).AddDays(-7)

# run against each server, or collect via SIEM query equivalent
# example for a single server:
$events = Get-WinEvent -ComputerName SERVER_NAME -FilterHashtable @{
    LogName   = 'Security'
    Id        = 5140
    StartTime = $startTime
} | Where-Object {
    # filter for admin shares; Properties[7] = ShareName
    $_.Properties[7].Value -match '^\\\\[^\\]+\\(admin|c|d|e|ipc)\$'
}

$events | ForEach-Object {
    [PSCustomObject]@{
        Time       = $_.TimeCreated
        Account    = $_.Properties[1].Value
        Domain     = $_.Properties[2].Value
        SourceIP   = $_.Properties[5].Value
        ShareName  = $_.Properties[7].Value
    }
} |
    Where-Object {
        # flag workstation IPs (adjust range for the environment)
        $_.SourceIP -match '^10\.1\.' -and $_.ShareName -match 'admin\$'
    } |
    Sort-Object Time
```

Build a list of known-legitimate sources (IT admin workstations, SCCM servers,
vulnerability scanners) and filter them out. Remaining access from user workstations to
server admin shares warrants individual review.
Last updated: 26 May 2026
