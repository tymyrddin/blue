# Impact: defender context

## The problem with impact-focused detection

Security monitoring is built around detecting compromise, not detecting
impact. By the time a ransomware deployment or data extortion event occurs,
the attacker has typically been present for days or weeks. The impact event
is the last step, not the first, and an organisation's best opportunity
to detect and contain the intrusion has usually already passed.

That said, the impact phase does create detectable signals, and defenders
who catch them early can limit damage significantly.

## Ransomware: what defenders can detect

Ransomware deployment involves a sequence of preparatory actions, each of
which is detectable:

Shadow copy deletion is one of the strongest signals. Legitimate processes
rarely delete shadow copies; malware does it systematically before encrypting.
Sysmon process events for `vssadmin delete`, `wbadmin delete catalog`, and
`bcdedit /set recoveryenabled no` are high-confidence indicators of
pre-ransomware activity.

Backup access from unexpected identities: if a domain admin account that
normally never touches backup infrastructure suddenly authenticates to the
Veeam management console, that is worth investigating.

Mass file modification or extension change: ransomware appending a custom
extension to every file in a directory generates file modification events
at a rate that is anomalous compared to any legitimate process.

## Business process attacks: what defenders miss

Business process attacks generate almost no security signals. An authorised
user modifying a payroll record looks the same as a compromised identity
doing it.

*A payroll diversion over a compromised HR manager account leaves an audit trail
that reads: login at 22:47, navigate to payroll settings, update direct deposit
details for three employees to a mule account, log out. Every entry is a normal
application action performed by an authenticated identity. The SIEM sees a
successful login and routine application activity. Nothing fires. The first
indication of fraud may be the employees reporting missed payment.*

Detection requires:

- Segregation of duties controls that flag changes made outside the normal
  workflow (single-person changes to high-value records)
- Time-based anomaly detection (payroll changes at 2am are suspicious)
- Business logic monitoring that correlates actions across systems
  (a user who just reset their own password and then immediately modified
  their bank account details)

Many organisations do not have these controls because they were designed
to detect malware, not process abuse.

## Proactive containment

The key shift is from reactive to proactive: rather than detecting the
ransomware deployment and responding, detect the precursor activities
(credential harvesting, lateral movement to backup infrastructure, shadow
copy manipulation) and contain before the impact event.

Immutable backups are the highest-impact single control here. A ransomware
deployment that cannot destroy the backup loses its primary leverage point.
Air-gapped or write-once backups stored in a location not accessible from
domain admin credentials are the practical implementation.

Backup access monitoring: any access to backup infrastructure by any
identity is worth logging and reviewing. Backup servers benefit from minimal
exposure and are not accessible from general-purpose domain admin accounts.

## The data extortion gap

Ransomware detection frameworks focus on encryption events. Data extortion
requires none. If data has already left an organisation before the
extortion demand arrives, there is no technical control that recovers it.
The only defence against data extortion is preventing the exfiltration in
the first place.

This makes exfiltration detection (covered in the exfiltration section)
the critical control point for the extortion threat, not anything in the
impact phase.
