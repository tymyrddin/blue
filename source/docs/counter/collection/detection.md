# Detecting collection activity

## Active Directory enumeration detection

AD enumeration generates characteristic LDAP traffic and Windows security
events. Detectable signals:

```powershell
# Sysmon Event ID 1: process creation for known enumeration tools
# look for: SharpHound.exe, BloodHound, ADExplorer, Ldifde, csvde
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object {
    $_.Id -eq 1 -and
    $_.Message -match 'SharpHound|ADRecon|ldifde|csvde'
  } | Format-List TimeCreated, Message

# Windows Security Event 4662: an operation was performed on an object
# BloodHound collection generates a characteristic burst of 4662 events
# querying attributes like servicePrincipalName, adminCount, ms-DS-MachineAccountQuota
Get-WinEvent -LogName Security -FilterXPath `
  "*[System[EventID=4662] and EventData[Data[@Name='AccessMask']='0x100']]" |
  Group-Object -Property { $_.Properties[3].Value } |
  Where-Object { $_.Count -gt 100 } |  # flag high-volume queries
  Select-Object Name, Count
```

LDAP query volume from a single host exceeding 1,000 queries in a short
window is a reliable signal for BloodHound collection.

Sigma rule for BloodHound collection:

```yaml
title: BloodHound/SharpHound Collection Activity
status: experimental
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4662
    Properties|contains:
      - '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2'  # DS-Replication-Get-Changes
      - '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'  # DS-Replication-Get-Changes-All
  timeframe: 30s
  condition: selection | count() > 50
falsepositives:
  - Legitimate AD replication
level: high
```

## LSASS access detection

```xml
<!-- Sysmon config: monitor for LSASS process access -->
<ProcessAccess onmatch="include">
  <TargetImage condition="is">C:\Windows\System32\lsass.exe</TargetImage>
</ProcessAccess>
```

```powershell
# Sysmon Event ID 10: process accessed LSASS
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object {
    $_.Id -eq 10 -and $_.Message -match 'lsass.exe'
  } |
  Select-Object TimeCreated,
    @{N='SourceProcess'; E={($_.Message | Select-String 'SourceImage: (.+)').Matches.Groups[1].Value}},
    @{N='GrantedAccess'; E={($_.Message | Select-String 'GrantedAccess: (.+)').Matches.Groups[1].Value}}
```

Known malicious access masks for LSASS:
- `0x1010`: PROCESS_VM_READ + PROCESS_QUERY_LIMITED_INFORMATION (common for Mimikatz)
- `0x1FFFFF`: PROCESS_ALL_ACCESS (suspicious in any context)

## Bulk download detection

SharePoint and OneDrive audit logs record file access events. Alert on
high-volume downloads:

```powershell
# SharePoint audit log: filter for download events above threshold
# (requires Unified Audit Log access in Microsoft 365)
$startDate = (Get-Date).AddDays(-1)
$endDate   = Get-Date

Search-UnifiedAuditLog -StartDate $startDate -EndDate $endDate `
  -Operations 'FileDownloaded','FileSyncDownloadedFull' |
  Group-Object -Property UserIds |
  Where-Object { $_.Count -gt 100 } |
  Select-Object Name, Count |
  Sort-Object Count -Descending
```

## Cloud credential access detection

```bash
# AWS CloudTrail: GetCredentials from instance metadata
# alert on unusual roles or processes accessing IMDS
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=GetCredentials \
  --start-time "$(date -d '1 day ago' --iso-8601=seconds)" \
  --query 'Events[*].[EventTime,Username,SourceIPAddress]' \
  --output table
```

```bash
# detect unexpected access to the instance metadata endpoint
# on Linux hosts with auditd:
auditctl -a always,exit -F arch=b64 -S connect \
  -F exit=-EINPROGRESS -k imds_access
# (connection to 169.254.169.254:80 will be logged)
```

## CI/CD supply chain monitoring

```yaml
# GitHub Actions: monitor for workflow file changes
# create a workflow that alerts when .github/workflows/ is modified

name: Workflow File Change Alert
on:
  push:
    paths:
      - '.github/workflows/**'

jobs:
  alert:
    runs-on: ubuntu-latest
    steps:
      - name: Notify security team
        run: |
          echo "Workflow change detected in commit $GITHUB_SHA by $GITHUB_ACTOR"
          # send to SIEM or notification channel
```

Dependency monitoring: use tools like Dependabot, Snyk, or OWASP Dependency
Check in pipelines. Alert on dependency changes that are not accompanied
by a pull request review.

## Detection gaps to acknowledge

Even with the above controls, these gaps remain:

- A valid identity using normal API calls at reasonable volume will not
  trigger any alert; only significant deviations are detectable
- Supply chain compromise in a dependency pulled before any monitoring
  was in place
- Credentials stolen from memory before RunAsPPL was enabled
- Collection via platforms entirely outside the monitoring perimeter
  (shadow IT, personal devices)
Last updated: 27 May 2026
