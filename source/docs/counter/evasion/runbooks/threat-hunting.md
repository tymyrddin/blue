# Threat hunting for evasion techniques

Threat hunting is proactive: looking for attacker presence before an alert fires.
For evasion-focused adversaries who stay below detection thresholds, hunting is often
the only way to find them. This runbook covers hypothesis-driven hunts for the
most common modern evasion techniques.

## Hunting methodology

Each hunt starts with a hypothesis: "I believe an attacker may be using technique X
in this environment." The hunt collects and analyses data to confirm or refute it.

Structure each hunt:

1. Define the hypothesis (specific technique, not "is there an attacker")
2. Identify the data sources needed
3. Query and collect the relevant data
4. Apply analysis to identify anomalies
5. Investigate anomalies, document findings
6. Improve detection rules based on what was found

## Hunt 1: living-off-the-land usage anomalies

Hypothesis: an attacker is using LoLbins for execution or lateral movement in an
unusual way.

Data sources: process creation logs (Sysmon Event ID 1), command line auditing
(Windows Security Event ID 4688 with command line auditing enabled).

```powershell
# collect command lines for high-risk LoLbins over the past 30 days
$startTime = (Get-Date).AddDays(-30)
$lolbins = @('certutil', 'mshta', 'regsvr32', 'wmic', 'rundll32', 'bitsadmin', 'msiexec')

$events = Get-WinEvent -FilterHashtable @{
    LogName = 'Microsoft-Windows-Sysmon/Operational'
    Id = 1
    StartTime = $startTime
} | Where-Object {
    $proc = $_.Properties[4].Value
    $lolbins | Where-Object { $proc -like "*$_*" }
}

# group by unique command line patterns
$events | Group-Object { $_.Properties[10].Value } |
  Sort-Object Count |
  Select-Object Count, @{n='CommandLine';e={$_.Name}} |
  Format-Table -AutoSize

# investigate low-frequency command lines (occur once or twice, not repeated)
$rare = $events | Group-Object { $_.Properties[10].Value } | Where-Object { $_.Count -le 2 }
$rare | ForEach-Object {
    Write-Output "Rare command: $($_.Name)"
    $_.Group | Select-Object TimeCreated,
        @{n='User';e={$_.Properties[12].Value}},
        @{n='Host';e={$_.MachineName}}
}
```

Low-frequency, unique command lines are more suspicious than high-frequency repeated
ones. A certutil download command that runs once at 2am on a server is more interesting
than certutil `-verify` commands run hundreds of times by legitimate software.

## Hunt 2: PowerShell script block anomalies

Hypothesis: an attacker is executing malicious PowerShell content from memory.

Data sources: PowerShell script block log (Event ID 4104).

```powershell
# collect script block logs and score by suspicious content
$sbEvents = Get-WinEvent -LogName 'Microsoft-Windows-PowerShell/Operational' |
  Where-Object { $_.Id -eq 4104 }

$indicators = @(
    @{ pattern = 'DownloadString|DownloadData|WebClient'; weight = 3 },
    @{ pattern = 'IEX|Invoke-Expression'; weight = 3 },
    @{ pattern = '-enc|-EncodedCommand'; weight = 2 },
    @{ pattern = 'reflection\.assembly|Assembly\.Load'; weight = 4 },
    @{ pattern = 'amsiUtils|amsiContext|amsiInitFailed'; weight = 10 },
    @{ pattern = 'VirtualAlloc|WriteProcessMemory|CreateThread'; weight = 5 },
    @{ pattern = 'sekurlsa|mimikatz|kerberoast'; weight = 10 }
)

foreach ($event in $sbEvents) {
    $score = 0
    foreach ($ind in $indicators) {
        if ($event.Message -match $ind.pattern) { $score += $ind.weight }
    }
    if ($score -ge 5) {
        Write-Output "Score: $score | Time: $($event.TimeCreated)"
        Write-Output $event.Message[0..200]
        Write-Output '---'
    }
}
```

## Hunt 3: WMI persistence

Hypothesis: an attacker has established persistence via WMI event subscriptions.

Data sources: WMI repository, WMI activity event log.

```powershell
# enumerate all WMI subscriptions and score for suspicion
$filters = Get-WMIObject -Namespace root\subscription -Class __EventFilter
$consumers = Get-WMIObject -Namespace root\subscription -Class CommandLineEventConsumer
$bindings = Get-WMIObject -Namespace root\subscription -Class __FilterToConsumerBinding

Write-Output "=== WMI Event Filters ==="
foreach ($f in $filters) {
    Write-Output "Name: $($f.Name)"
    Write-Output "Query: $($f.Query)"
    # flag queries using short intervals (attackers use tight polling)
    if ($f.Query -match 'WITHIN \d+' ) {
        $interval = [regex]::Match($f.Query, 'WITHIN (\d+)').Groups[1].Value
        if ([int]$interval -lt 300) {
            Write-Warning "Short polling interval: $interval seconds"
        }
    }
}

Write-Output "=== CommandLine Consumers ==="
foreach ($c in $consumers) {
    Write-Output "Name: $($c.Name)"
    Write-Output "Command: $($c.CommandLineTemplate)"
    # flag commands with encoded content or download patterns
    if ($c.CommandLineTemplate -match '-enc|-EncodedCommand|DownloadString|IEX|powershell|cmd') {
        Write-Warning "Suspicious consumer command: $($c.CommandLineTemplate)"
    }
}
```

Document all known-legitimate WMI subscriptions (these are rare). Any subscription
not in the known-good list is worth investigating.

## Hunt 4: unusual driver loads

Hypothesis: an attacker has loaded a vulnerable driver for BYOVD.

Data sources: System event log (Event ID 7045), Sysmon Event ID 6, driver hashes.

```powershell
# get all drivers that have been loaded in the last 14 days
$driverEvents = Get-WinEvent -LogName System |
  Where-Object { $_.Id -eq 7045 -and $_.TimeCreated -gt (Get-Date).AddDays(-14) } |
  Where-Object { $_.Message -match 'kernel' }

foreach ($event in $driverEvents) {
    $name = $event.Properties[0].Value
    $path = $event.Properties[1].Value
    $time = $event.TimeCreated

    Write-Output "Time: $time | Service: $name | Path: $path"

    # check signature
    if (Test-Path $path) {
        $sig = Get-AuthenticodeSignature $path
        Write-Output "  Signature: $($sig.Status) / $($sig.SignerCertificate.Subject)"
        $hash = (Get-FileHash $path -Algorithm SHA256).Hash
        Write-Output "  SHA256: $hash"
        # compare against loldrivers.io hash list
    } else {
        Write-Warning "  Driver file no longer present (possible cleanup)"
    }
}
```

A driver that was loaded and whose file was subsequently deleted is a strong indicator
of BYOVD cleanup activity.

## Hunt 5: lateral movement via credential replay

Hypothesis: an attacker is using stolen credentials to authenticate to multiple
systems.

Data sources: Windows Security Event Log (Event ID 4624, 4625, 4648), domain
controller logs.

```powershell
# find accounts authenticating from multiple source IPs in a short window
# (credential replay often shows one account logging in from an unusual source)
$startTime = (Get-Date).AddDays(-7)
$events = Get-WinEvent -ComputerName DC_NAME -FilterHashtable @{
    LogName = 'Security'
    Id = 4624
    StartTime = $startTime
}

# group by account and collect source IPs
$accountSources = $events | Group-Object { $_.Properties[5].Value } |
  ForEach-Object {
    $account = $_.Name
    $sources = $_.Group | ForEach-Object { $_.Properties[18].Value } | Sort-Object -Unique
    [PSCustomObject]@{
        Account = $account
        SourceCount = $sources.Count
        Sources = $sources -join ', '
    }
  } | Sort-Object SourceCount -Descending

# flag accounts authenticating from many different source IPs
$accountSources | Where-Object { $_.SourceCount -gt 5 -and $_.Account -notmatch 'SYSTEM|NETWORK SERVICE|LOCAL SERVICE' }
```

An account that authenticates from more than 3-5 different source IPs in a 24-hour
period without a corresponding change in work location is worth investigating.

## Documenting hunt results

Every hunt produces one of three outcomes:

- Nothing found: document the data sources used, time range, and analysis method.
  This establishes that the environment was clean on this date.
- False positive identified: document the legitimate activity that generated the
  indicator, and add a suppression to prevent future waste of analyst time.
- True positive: escalate to incident response. Document the indicator chain, timeline,
  and scope of the finding.

Hunting findings feed back into detection rules. If a hunt found something
that would have benefited from automatic alerting, write the rule.
