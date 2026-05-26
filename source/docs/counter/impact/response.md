# Responding to impact events

## Ransomware: immediate response

When ransomware is confirmed or strongly suspected:

### First 15 minutes

1. Do not immediately shut down affected systems. Memory forensics before
   shutdown may recover encryption keys or identify the ransomware variant.
   Consult with the IR team before making this decision.

2. Isolate affected systems: remove from the network, but do not power off
   unless the ransomware is actively spreading and isolation is not possible.

3. Identify the blast radius: which hosts show the characteristic file
   extension change or ransom note? Are domain controllers affected?

4. Check backup integrity immediately: are the backups accessible? Are
   shadow copies intact? Is the backup server reachable and unaffected?

```powershell
# quick check: are shadow copies still present?
vssadmin list shadows

# is the Veeam or backup service running?
Get-Service | Where-Object { $_.DisplayName -match 'Veeam|Backup|Shadow' }

# check VSS event log for recent deletion events (VSS events appear in Application log)
Get-WinEvent -LogName Application |
  Where-Object { $_.ProviderName -eq 'VSS' -and $_.TimeCreated -gt (Get-Date).AddHours(-24) } |
  Format-List
```

5. Preserve logs before any remediation: export Windows event logs, Sysmon
   logs, and EDR telemetry to a location that will not be affected by
   containment actions.

```powershell
# export event logs to a safe location
$dest = '\\SAFE_SHARE\ir-logs\'
wevtutil epl Security "$dest\Security-$(hostname).evtx"
wevtutil epl System "$dest\System-$(hostname).evtx"
wevtutil epl 'Microsoft-Windows-Sysmon/Operational' "$dest\Sysmon-$(hostname).evtx"
```

### Identification phase

Identify the ransomware variant and understand the attack path:

```powershell
# find the ransom note (typically in encrypted directories)
Get-ChildItem -Path C:\,D:\ -Recurse -Filter '*RANSOM*' -ErrorAction SilentlyContinue
Get-ChildItem -Path C:\,D:\ -Recurse -Filter '*README*' -ErrorAction SilentlyContinue
Get-ChildItem -Path C:\,D:\ -Recurse -Filter '*.txt' |
  Where-Object { $_.Length -lt 10KB -and $_.LastWriteTime -gt (Get-Date).AddHours(-4) } |
  Get-Content | Select-String -Pattern 'encrypt|bitcoin|tor|ransom' -SimpleMatch
```

```powershell
# identify the patient zero host: find earliest encrypted file or ransom note
Get-ChildItem -Path \\FILESERVER\Shares -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '\.[a-z]{5,8}$' -and  # custom extension
                 $_.LastWriteTime -gt (Get-Date).AddDays(-2) } |
  Sort-Object LastWriteTime | Select-Object -First 20
```

## Business process attack response

When a fraudulent transaction or data manipulation is confirmed:

1. Freeze the affected process: halt any pending payments, payroll runs, or
   workflow approvals pending investigation
2. Preserve the audit trail: export logs from the SaaS platform before
   any incident response actions that might alter them
3. Identify the entry point: which identity made the change? When did it
   last authenticate? From which location?
4. Check whether the identity was compromised (token theft, session hijacking)
   or whether a social engineering attack targeted an authorised user directly
5. Engage finance/legal/HR as appropriate for the specific impact type
6. For wire transfer fraud: contact the receiving bank immediately; recovery
   windows are short

## Post-incident: closing the gaps

After containment, understand what allowed the impact to occur:

```text
For ransomware:
- How did the attacker reach domain admin or backup admin credentials?
- Why was the backup infrastructure accessible from domain admin?
- Were shadow copies protected (WORM, cloud, air-gapped)?
- How long was the attacker present before the encryption event?
- What detection opportunities were missed during the dwell period?

For business process attacks:
- Was the compromised identity's access appropriately scoped?
- Did any control flag the unusual action before it completed?
- Were change logs from the SaaS platform reviewed in real time?
- What segregation of duties controls were absent?
```

## Immutable backup architecture

The single highest-impact control for ransomware resilience:

```text
Recommended backup architecture:
- Primary backups: regular automated backups to local NAS or backup server
- Secondary backups: replicate to cloud storage with write-once / object lock
  enabled (AWS S3 Object Lock, Azure Immutable Storage)
- Backup server: isolated from the domain admin privilege scope; access
  controlled separately from general IT administration
- Test restore: regular restore drills to confirm backups are usable

AWS S3 Object Lock (WORM):
aws s3api put-object-lock-configuration \
  --bucket backup-bucket \
  --object-lock-configuration \
  '{"ObjectLockEnabled":"Enabled","Rule":{"DefaultRetention":{"Mode":"COMPLIANCE","Days":30}}}'
```

Compliance mode object lock cannot be overridden even by the bucket owner
within the retention period. This makes the backup resistant to deletion
by a compromised administrator account.
