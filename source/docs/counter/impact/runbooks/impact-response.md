# Impact response runbook

Step-by-step procedures for responding to confirmed impact events:
ransomware, data destruction, and business process attacks.

## Ransomware response

### Confirm ransomware

```powershell
# confirm encryption is occurring: look for mass file extension changes
# in the last 30 minutes
Get-ChildItem -Path C:\Users,D:\Shares -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-30) } |
  Group-Object Extension |
  Where-Object { $_.Count -gt 50 -and $_.Name -notmatch '\.(docx|xlsx|pdf|txt|log)$' } |
  Sort-Object Count -Descending |
  Select-Object Name, Count
```

### Contain

```powershell
# disable the affected host's network adapter (preserves memory, stops spread)
# (run from a different host via Invoke-Command, or physically disconnect)
Get-NetAdapter | Disable-NetAdapter -Confirm:$false

# if lateral movement is active: isolate the entire VLAN via the network switch
# (escalate to network team with the source subnet)
```

### Preserve evidence

```powershell
# memory dump before shutdown (if time permits)
# use winpmem or a supported live response tool
.\winpmem_mini_x64_rc2.exe memory.aff4

# export key logs
foreach ($log in @('Security','System','Application',
                   'Microsoft-Windows-Sysmon/Operational')) {
    $out = "\\SAFE_SHARE\ir\$log-$(hostname)-$(Get-Date -Format yyyyMMdd-HHmm).evtx"
    wevtutil epl $log $out
}
```

### Assess backup status

```powershell
# check shadow copies
vssadmin list shadows | Select-String 'Shadow Copy Volume|Creation Time'

# attempt backup server connectivity
Test-NetConnection -ComputerName BACKUP_SERVER -Port 445

# check if backup service is running
Get-Service -ComputerName BACKUP_SERVER |
  Where-Object { $_.DisplayName -match 'Veeam|Backup' }
```

### Identify scope

```powershell
# count encrypted files across the domain
# (run against file servers; look for unusual extension counts)
Get-ChildItem -Path \\FILESERVER\* -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-6) } |
  Group-Object Extension |
  Sort-Object Count -Descending |
  Select-Object -First 30

# find the ransom note (start of encryption)
Get-ChildItem -Path C:\ -Recurse -Filter '*.txt' -ErrorAction SilentlyContinue |
  Where-Object { $_.Length -lt 5KB } |
  Get-Content |
  Select-String 'encrypt|ransom|bitcoin|tor' -SimpleMatch |
  Select-Object -First 5
```

## Shadow copy deletion detection and response

```powershell
# check Application event log for VSS error events (source: VSS)
# these fire when VSS encounters errors during or after deletion;
# the Sysmon command check below is more reliable for detecting deliberate deletion
Get-WinEvent -LogName Application -ErrorAction SilentlyContinue |
  Where-Object {
    $_.ProviderName -eq 'VSS' -and
    $_.TimeCreated -gt (Get-Date).AddDays(-7)
  } |
  Format-List TimeCreated, Id, Message

# check for the commands that deleted them
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object {
    $_.Id -eq 1 -and
    $_.Message -match 'vssadmin|wbadmin|bcdedit'
  } |
  Where-Object { $_.TimeCreated -gt (Get-Date).AddDays(-7) } |
  Format-List TimeCreated, Message
```

## Business process attack response

### Wire transfer fraud

```text
1. Contact the finance team and freeze any pending payments immediately
2. Identify the sender identity and their recent authentication events
3. Retrieve the original payment instruction from email
4. Contact the originating bank:
   - Provide transaction reference, amount, timestamp
   - Request a SWIFT recall (MT199 recall message)
   - Recovery window: typically 24-48 hours; act immediately
5. Contact the receiving bank through the originating bank's fraud team
6. File a report with Action Fraud (UK) or equivalent national authority
```

### Payroll diversion

```text
1. Freeze the next payroll run before it processes
2. Identify which records were modified: pull a change audit log from HR system
3. Identify the identity that made the changes and when
4. Revert the changes from the audit log
5. Verify the reverted data against an offline backup of payroll records
6. Notify affected employees if salaries were already diverted
7. Investigate how the HR system was accessed (identity compromise, insider?)
```

### SaaS workflow manipulation

```powershell
# retrieve audit logs from the affected SaaS platform
# (example: Microsoft 365; adjust for other platforms)

Search-UnifiedAuditLog `
  -StartDate (Get-Date).AddDays(-7) `
  -EndDate (Get-Date) `
  -Operations 'Update','Set','Add','Remove','Grant' |
  Where-Object { $_.UserIds -eq 'compromised.user@domain.com' } |
  Select-Object CreationDate, Operations, AuditData |
  ForEach-Object {
    $data = $_.AuditData | ConvertFrom-Json
    [PSCustomObject]@{
        Time      = $_.CreationDate
        Operation = $_.Operations
        Target    = $data.ObjectId
        Detail    = $data.ModifiedProperties | ConvertTo-Json -Compress
    }
  } | Format-List
```

## Post-incident hardening actions

After any confirmed impact event, verify or implement:

```powershell
# enable shadow copy protection on all production servers
vssadmin resize shadowstorage /For=C: /On=C: /MaxSize=UNBOUNDED
# and configure a scheduled backup policy that creates daily shadow copies

# restrict vssadmin to administrators only (via AppLocker or WDAC)
# AppLocker rule: deny vssadmin.exe for non-administrator standard users

# enable Protected Users security group for all privileged accounts
# (disables NTLM, Kerberos delegation, session credential caching)
Get-ADUser -Filter { AdminCount -eq 1 } | ForEach-Object {
    Add-ADGroupMember -Identity 'Protected Users' -Members $_
}
```

Enforce write-once (WORM) on the off-site backup bucket so a compromised
administrator cannot delete it within the retention period:

```text
aws s3api put-object-lock-configuration \
  --bucket backup-bucket \
  --object-lock-configuration \
  '{"ObjectLockEnabled":"Enabled","Rule":{"DefaultRetention":{"Mode":"COMPLIANCE","Days":30}}}'
```
Last updated: 12 June 2026
