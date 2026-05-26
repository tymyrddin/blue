# Password spray and authentication abuse hunting

Three hunts for authentication abuse patterns in Windows Security event logs: source-based
failure clustering that distinguishes spray from brute force, lockout bursts that confirm a
spray in progress, and failure-to-success sequences that indicate a successful credential.

Data source: Windows Security Event Log on domain controllers (for domain account authentication)
and on member servers or workstations (for local account authentication and RDP/network logon
failures). Run these queries on domain controllers first; local account abuse appears on the
targeted machine.

## Source-based failure clustering

Hypothesis: an attacker is spraying one or a small set of passwords across many accounts from
a single source, staying below the per-account lockout threshold.

```powershell
# Event 4625: logon failures over the past four hours
# Change $hours to adjust the lookback window
$since = (Get-Date).AddHours(-4)

$failures = Get-WinEvent -LogName Security -FilterXPath '*[System[EventID=4625]]' -ErrorAction SilentlyContinue |
  Where-Object { $_.TimeCreated -ge $since } |
  ForEach-Object {
    [xml]$xml = $_.ToXml()
    $d = @{}
    $xml.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [PSCustomObject]@{
      Time       = $_.TimeCreated
      TargetUser = $d['TargetUserName']
      IpAddress  = $d['IpAddress']
      Status     = $d['Status']
      LogonType  = $d['LogonType']
    }
  }

# Spray indicator: one source, many distinct usernames
$failures |
  Group-Object IpAddress |
  Select-Object Name,
    Count,
    @{N='DistinctUsers'; E={($_.Group.TargetUser | Sort-Object -Unique).Count}} |
  Where-Object { $_.DistinctUsers -gt 10 } |
  Sort-Object DistinctUsers -Descending

# Brute force indicator: many failures against one account from multiple sources
$failures |
  Group-Object TargetUser |
  Select-Object Name,
    Count,
    @{N='DistinctSources'; E={($_.Group.IpAddress | Sort-Object -Unique).Count}} |
  Where-Object { $_.Count -gt 20 } |
  Sort-Object Count -Descending
```

Spray produces a high DistinctUsers count per source with a low per-account failure count.
Brute force produces a high failure count on a single TargetUser. Credential stuffing resembles
spray in structure but produces a higher success rate; the failure-to-success query below
surfaces that pattern.

## Account lockout bursts

Hypothesis: an automated spray tool has exceeded the lockout threshold on multiple accounts
in a short window, generating a cluster of Event 4740.

```powershell
# Event 4740: account lockout events — clustered in time indicate a spray in progress
$since = (Get-Date).AddHours(-2)
Get-WinEvent -LogName Security -FilterXPath '*[System[EventID=4740]]' -ErrorAction SilentlyContinue |
  Where-Object { $_.TimeCreated -ge $since } |
  ForEach-Object {
    [xml]$xml = $_.ToXml()
    $d = @{}
    $xml.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [PSCustomObject]@{
      Time          = $_.TimeCreated
      LockedAccount = $d['TargetUserName']
      CallerMachine = $d['SubjectUserName']
    }
  } |
  Sort-Object Time -Descending | Select-Object -First 40
```

A single lockout event is a normal occurrence. Several accounts locking out within minutes of
each other from the same source is a spray in progress. The lockout policy (threshold and
observation window) determines how visible this pattern is; a spray tuned to stay just below
the threshold produces no lockouts but remains visible in the failure clustering hunt above.

## Failure-to-success sequences

Hypothesis: a credential-stuffing or spray attack has produced at least one successful
authentication following a failure burst, indicating a valid credential was found.

```powershell
# Event 4624: logon successes — filter for sources that also appear in the failure set
$since = (Get-Date).AddHours(-4)

$failureSources = Get-WinEvent -LogName Security -FilterXPath '*[System[EventID=4625]]' -ErrorAction SilentlyContinue |
  Where-Object { $_.TimeCreated -ge $since } |
  ForEach-Object {
    [xml]$xml = $_.ToXml()
    $d = @{}
    $xml.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    $d['IpAddress']
  } | Sort-Object -Unique

# Logon successes from any source that also generated failures
Get-WinEvent -LogName Security -FilterXPath '*[System[EventID=4624]]' -ErrorAction SilentlyContinue |
  Where-Object { $_.TimeCreated -ge $since } |
  ForEach-Object {
    [xml]$xml = $_.ToXml()
    $d = @{}
    $xml.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [PSCustomObject]@{
      Time       = $_.TimeCreated
      TargetUser = $d['TargetUserName']
      IpAddress  = $d['IpAddress']
      LogonType  = $d['LogonType']
    }
  } |
  Where-Object { $_.IpAddress -in $failureSources } |
  Sort-Object Time -Descending | Select-Object -First 20
```

A source IP that produced a failure burst followed by a successful logon from the same IP
has either found a valid credential or triggered an account that does not enforce lockout.
The subsequent session activity from that account is worth reviewing: Event 4769 (Kerberos
TGS requests), net logon events, and any lateral movement indicators in the hours following
the success.
