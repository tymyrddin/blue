# DCSync activity hunt

Hypothesis: an attacker is abusing the MS-DRSR replication protocol to extract credential
hashes from a domain controller without running code on the DC itself.

Domain controllers generate Event ID 4662 on the domain NC object continuously during
normal replication, with computer accounts (accounts ending in `$`) as the subject. The
anomaly is a user or service account appearing as the subject in the same event with the
DS-Replication-Get-Changes-All GUID in the Properties field. This hunt returns nothing
if the domain object SACL is not configured; in that case, the SACL configuration itself
is the remediation item.

Data sources: domain controller Security event log; `Event ID 4662` on the domain NC
object; requires "Audit Directory Service Access" enabled and a SACL on the domain object
auditing DS-Replication-Get-Changes-All
(`{1131f6ad-9c07-11d1-f79f-00c04fc2dcd2}`).

```powershell
$startTime = (Get-Date).AddHours(-24)
$replGuid  = '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'

$events = Get-WinEvent -ComputerName DC_NAME -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4662
    StartTime = $startTime
}

$events | ForEach-Object {
    # Property indices for Event 4662 are inconsistent across Windows versions;
    # named XML parsing is the reliable path
    $xml  = [xml]$_.ToXml()
    $data = $xml.Event.EventData.Data

    $subject    = ($data | Where-Object Name -eq 'SubjectUserName').'#text'
    $properties = ($data | Where-Object Name -eq 'Properties').'#text'

    # skip computer accounts (DC-to-DC replication)
    if ($subject -like '*$') { return }
    if ($properties -notmatch $replGuid) { return }

    [PSCustomObject]@{
        Time          = $_.TimeCreated
        SubjectUser   = $subject
        SubjectDomain = ($data | Where-Object Name -eq 'SubjectDomainName').'#text'
        ObjectDN      = ($data | Where-Object Name -eq 'ObjectName').'#text'
        LogonId       = ($data | Where-Object Name -eq 'SubjectLogonId').'#text'
    }
} | Sort-Object Time
```

Any result after filtering computer accounts is unusual. A user account exercising
DS-Replication-Get-Changes-All has either been explicitly granted that right
(administrative oversight question) or is being used by an attacker who compromised an
account with that right.

The `LogonId` field in the output links to a corresponding `Event ID 4624` logon event on
the same DC, which records the source IP address. Querying `Event ID 4624` with the
matching `TargetLogonId` value identifies the host from which the replication call
originated.

```powershell
# correlate LogonId with Event 4624 to get source IP
$logonId = '0x...'  # value from DCSync hunt output

Get-WinEvent -ComputerName DC_NAME -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4624
    StartTime = $startTime
} | Where-Object {
    $xml  = [xml]$_.ToXml()
    $data = $xml.Event.EventData.Data
    ($data | Where-Object Name -eq 'TargetLogonId').'#text' -eq $logonId
} | ForEach-Object {
    $xml  = [xml]$_.ToXml()
    $data = $xml.Event.EventData.Data
    [PSCustomObject]@{
        Time      = $_.TimeCreated
        Account   = ($data | Where-Object Name -eq 'TargetUserName').'#text'
        IpAddress = ($data | Where-Object Name -eq 'IpAddress').'#text'
        LogonType = ($data | Where-Object Name -eq 'LogonType').'#text'
    }
}
```

A source IP that belongs to a workstation or member server, rather than a domain
controller, confirms the DCSync pattern. Accounts legitimately granted replication rights
(such as Azure AD Connect sync accounts in hybrid environments) appear in the first query;
their source IPs are the expected sync server addresses and distinguish legitimate
operations from attacker activity.
Last updated: 26 May 2026
