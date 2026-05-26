# Kerberoasting sweep

Hypothesis: an attacker is requesting RC4-encrypted Kerberos service tickets to crack
offline.

Any authenticated domain user can request a TGS ticket for any service account SPN; the
ticket is returned encrypted with that account's key. Requesting tickets for multiple SPNs
in a short window using the older RC4 encryption type, rather than the AES types that
modern clients prefer, is the Kerberoasting signature.

Data sources: domain controller Security event log (`Event ID 4769`); requires audit policy
"Audit Kerberos Service Ticket Operations" set to Success.

```powershell
$startTime = (Get-Date).AddHours(-24)

$events = Get-WinEvent -ComputerName DC_NAME -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4769
    StartTime = $startTime
} | Where-Object {
    # TicketEncryptionType 0x17 (23) is RC4-HMAC
    $_.Properties[5].Value -eq 0x17
}

# group by source IP, count unique SPNs requested
$events | Group-Object { $_.Properties[6].Value } |
    ForEach-Object {
        $src = $_.Name
        $spns = $_.Group | ForEach-Object { $_.Properties[2].Value } | Sort-Object -Unique
        [PSCustomObject]@{
            SourceIP   = $src
            SPNCount   = $spns.Count
            SPNs       = $spns -join ', '
            FirstEvent = ($_.Group | Sort-Object TimeCreated | Select-Object -First 1).TimeCreated
            LastEvent  = ($_.Group | Sort-Object TimeCreated | Select-Object -Last 1).TimeCreated
        }
    } |
    Where-Object { $_.SPNCount -gt 2 } |
    Sort-Object SPNCount -Descending
```

A single RC4 TGS request may be a legacy application. A source requesting RC4 tickets for
three or more different service account SPNs within a short window is the Kerberoasting
pattern. Legitimate SPNs queried by management tooling appear consistently across hunts;
new SPNs in the high-RC4 list are worth prioritising.
