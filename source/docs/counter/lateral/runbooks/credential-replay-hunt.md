# Authentication source anomalies

Hypothesis: stolen credentials are being used to authenticate from hosts the account does
not normally use.

Pass-the-hash and pass-the-ticket movement produces authentication events at the target
that look structurally normal: the credentials are valid. The anomaly is the source. An
account that normally authenticates from one or two workstations suddenly appearing from
a new IP, authenticating to a server tier it has no documented reason to reach, is the
signal worth chasing.

Data sources: domain controller Security event log (`Event ID 4624`); a 30-day baseline of
account-to-source-IP pairs.

```powershell
$baselineDays = 30
$huntWindow   = 7
$now          = Get-Date

# collect baseline: account -> known source IPs (prior 30 days)
$baseline = Get-WinEvent -ComputerName DC_NAME -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4624
    StartTime = $now.AddDays(-($baselineDays + $huntWindow))
    EndTime   = $now.AddDays(-$huntWindow)
} | Where-Object { $_.Properties[8].Value -in @(3, 10) } |
    Group-Object { $_.Properties[5].Value } |
    ForEach-Object {
        $acct = $_.Name
        $knownIPs = $_.Group |
            ForEach-Object { $_.Properties[18].Value } |
            Where-Object { $_ -ne '-' -and $_ -ne '::1' } |
            Sort-Object -Unique
        [PSCustomObject]@{ Account = $acct; KnownIPs = $knownIPs }
    }

# collect hunt window events
$recent = Get-WinEvent -ComputerName DC_NAME -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4624
    StartTime = $now.AddDays(-$huntWindow)
} | Where-Object { $_.Properties[8].Value -in @(3, 10) }

# flag account+sourceIP pairs not in baseline
$baselineMap = @{}
$baseline | ForEach-Object { $baselineMap[$_.Account] = $_.KnownIPs }

$recent | ForEach-Object {
    $acct = $_.Properties[5].Value
    $src  = $_.Properties[18].Value
    $tgt  = $_.MachineName
    if ($src -eq '-' -or $src -eq '::1') { return }
    if ($baselineMap[$acct] -and $src -notin $baselineMap[$acct]) {
        [PSCustomObject]@{
            Time       = $_.TimeCreated
            Account    = $acct
            NewSource  = $src
            Target     = $tgt
            LogonType  = $_.Properties[8].Value
        }
    }
} | Sort-Object Time
```

New source IPs appear legitimately when staff change machines, travel, or use VPN.
Cross-reference new-source events against HR or IT change records. Accounts with new
source events targeting server hosts rather than workstations are higher priority. Events
that also appear in the Kerberoasting or admin share hunts within the same window raise
confidence further.
