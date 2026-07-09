# AD enumeration

Hypothesis: an attacker is enumerating Active Directory to map lateral movement paths.

SharpHound collection generates LDAP query volumes and patterns no normal workstation
process produces: hundreds of queries across multiple object classes in a short burst,
combined with SAMR calls to many hosts for session enumeration. The signal is in the
volume and source: management platforms and monitoring agents hit DCs at high query rates,
but they do so from known server IPs on predictable schedules. The same pattern from a
workstation, at an unusual hour, is the BloodHound signature.

Data sources: `Sysmon Event ID 3` (network connection) on endpoints; DC LDAP query logs if
enabled; Windows Security `Event ID 4662` (requires "Audit Directory Service Access" set to
Success for AD objects).

```powershell
# find workstations generating high LDAP connection volumes to DCs
# (adjust DC IP list for the environment)
$startTime = (Get-Date).AddHours(-4)
$dcIPs     = @('10.0.0.1', '10.0.0.2')  # domain controller IPs

$events = Get-WinEvent -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = 3
    StartTime = $startTime
} | Where-Object {
    $_.Properties[14].Value -in $dcIPs -and
    $_.Properties[16].Value -in @('389', '636', '3268', '3269')  # LDAP and GC ports
}

$events |
    Group-Object { $_.Properties[4].Value } |  # group by source process image
    Where-Object { $_.Count -gt 100 } |
    ForEach-Object {
        [PSCustomObject]@{
            SourceProcess  = $_.Name
            LDAPQueryCount = $_.Count
            Hosts          = ($_.Group | ForEach-Object { $_.MachineName } | Sort-Object -Unique) -join ', '
        }
    } | Sort-Object LDAPQueryCount -Descending
```

Legitimate high-LDAP sources (management platforms, monitoring agents, identity sync
services) appear consistently from known server IPs. A workstation generating hundreds of
LDAP queries in a short burst, particularly outside business hours, warrants review.
SAMR-based session enumeration produces a separate signal: connections from one host to
many others on port 445 querying NetSessionEnum. Correlating high-LDAP events with
high-SMB fan-out from the same source raises confidence.
Last updated: 26 May 2026
