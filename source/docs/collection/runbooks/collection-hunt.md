# Collection activity hunting

Proactively hunting for evidence of data collection in progress or
recently completed, before exfiltration occurs.

## Hunt 1: AD enumeration anomalies

Unusual LDAP query volume or pattern from a host that does not normally
perform AD administration.

```powershell
# identify hosts generating high LDAP query volume (requires AD audit logs)
Get-WinEvent -LogName Security |
  Where-Object { $_.Id -eq 4662 } |
  Group-Object -Property { $_.Properties[1].Value } |  # group by Subject Account
  Where-Object { $_.Count -gt 500 } |
  Sort-Object Count -Descending |
  Select-Object Name, Count

# cross-reference with known admin hosts
$adminHosts = @('DC01', 'MGMT01', 'SCCM01')  # populate with known admin hosts
# flag any high-count results NOT in $adminHosts
```

```bash
# from Zeek/Suricata: detect BloodHound characteristic LDAP queries
# BloodHound queries for: objectSid, adminCount, servicePrincipalName, etc.
# in rapid succession from a single source
zeek-cut id.orig_h id.resp_h query -d '\t' < ldap.log |
  awk '{count[$1]++} END {for (h in count) if (count[h] > 200) print h, count[h]}' |
  sort -k2 -rn | head -20
```

## Hunt 2: LSASS access anomalies

```powershell
# Sysmon Event ID 10: unexpected processes accessing LSASS
$expected = @('C:\Windows\System32\svchost.exe',
              'C:\Program Files\CrowdStrike\CSFalconService.exe',
              'C:\Program Files\SentinelOne\*')  # populate with known EDR paths

Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object { $_.Id -eq 10 -and $_.Message -match 'lsass' } |
  ForEach-Object {
    $source = ($_.Message | Select-String 'SourceImage: (.+)').Matches.Groups[1].Value.Trim()
    $access = ($_.Message | Select-String 'GrantedAccess: (.+)').Matches.Groups[1].Value.Trim()
    [PSCustomObject]@{
        Time   = $_.TimeCreated
        Source = $source
        Access = $access
    }
  } |
  Where-Object {
    $src = $_.Source
    -not ($expected | Where-Object { $src -like $_ })
  } | Format-Table
```

## Hunt 3: credential files accessed outside normal context

```powershell
# Sysmon Event ID 11: file created; Event ID 15: stream created
# look for access to known credential file paths
$credPaths = @(
    '*\.aws\credentials',
    '*\.azure\accessTokens.json',
    '*\.azure\msal_token_cache*',
    '*\gcloud\credentials*',
    '*\AppData\Local\Google\Chrome\User Data\Default\Login Data'
)
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object { $_.Id -in @(11, 15) } |
  Where-Object {
    $path = ($_.Message | Select-String 'TargetFilename: (.+)').Matches.Groups[1].Value
    $credPaths | Where-Object { $path -like $_ }
  } | Format-List TimeCreated, Message
```

## Hunt 4: bulk download from SharePoint

```powershell
# Microsoft 365 Unified Audit Log: bulk file access from a single identity
# over a short window
$yesterday = (Get-Date).AddDays(-1)

$downloads = Search-UnifiedAuditLog `
  -StartDate $yesterday -EndDate (Get-Date) `
  -Operations 'FileDownloaded','FileSyncDownloadedFull','FileAccessed' |
  ForEach-Object {
    $data = $_.AuditData | ConvertFrom-Json
    [PSCustomObject]@{
        Time      = $_.CreationDate
        User      = $_.UserIds
        File      = $data.SourceFileName
        SiteUrl   = $data.SiteUrl
        ClientIP  = $data.ClientIP
    }
  }

$downloads |
  Group-Object -Property User |
  Where-Object { $_.Count -gt 200 } |
  Select-Object Name, Count |
  Sort-Object Count -Descending
```

## Hunt 5: credential harvesting via process injection into LSASS

```powershell
# look for processes that migrated or injected into LSASS
# Sysmon Event ID 8: CreateRemoteThread targeting LSASS
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object { $_.Id -eq 8 -and $_.Message -match 'lsass' } |
  Format-List TimeCreated, Message
```

## Hunt 6: shadow copy and VSS access

```powershell
# SAM extraction via VSS uses specific process behaviour
# look for access to HarddiskVolumeShadowCopy paths
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object { $_.Id -eq 11 -and $_.Message -match 'HarddiskVolumeShadowCopy' } |
  Format-List TimeCreated, Message
```

## Hunt 7: cloud metadata access from unexpected processes

```bash
# on EC2 Linux: detect unexpected processes accessing IMDS
# use auditd to monitor connections to 169.254.169.254
ausearch -k imds_access --start yesterday | aureport -x --summary

# expected processes: AWS CLI, SSM agent, CloudWatch agent
# unexpected: curl, python, powershell (without a known legitimate use case)
```

## Triage and investigation workflow

When a hunt produces a hit:

1. Identify the source identity and host
2. Determine whether the activity corresponds to a known administrative task
   (query the change management system or ask the account owner)
3. If unaccounted for: pull related Sysmon events for the same host and
   timeframe (+/- 2 hours)
4. Check outbound network connections from that host in the same window
   (look for new external destinations)
5. Check whether any scheduled tasks, services, or WMI subscriptions were
   created from that host in the same window
6. Escalate to incident response if no legitimate explanation is found
