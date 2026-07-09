# Impact: defender context

## The problem with impact-focused detection

Security monitoring is built around detecting compromise, not impact. By the time a ransomware deployment or data extortion event occurs,
the attacker has typically been present for days or weeks. The impact event
is the last step, and an organisation's best opportunity to detect and
contain the intrusion has usually already passed.

That said, the impact phase does create detectable signals, and defenders
who catch them early can limit damage significantly.

## Families of impact

It helps to separate impact by what is lost rather than what is done.
Destruction and extortion, the loudest of them, encrypts, wipes, or
diverts. Availability degrades the carrying layer without stopping it.
Concentration is the failure of a provider the organisation depends on and does
not control. Integrity leaves everything running and alters the data or
instructions inside. Access denial revokes legitimate access while the
infrastructure works perfectly. Chokepoints leave the digital layer healthy and
stall the physical inputs it was meant to process. Administrative hijack brings no
tools at all, turning the organisation's own trusted rules and utilities against
it. Confidentiality loss takes nothing and breaks nothing, copying the secret while
the original sits undisturbed, so the only sign is the thing surfacing on the far
side. The families differ most in how much signal they leave: destruction is loud by
the end, and the others can be close to silent. That asymmetry is the through-line, and it is why detection built
around encryption events tends to miss the quieter ones entirely.

## The loud end: ransomware

Destruction announces itself by the end, which is why most monitoring is
built for it. Ransomware deployment runs through a sequence of preparatory
actions, each detectable before the encryption that ends it:

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

## The quiet end: when nothing fires

Most of the families sit at the other end of the spectrum. Integrity,
administrative hijack, and confidentiality loss share one inconvenient
property: they are built out of authorised actions, so telemetry tuned for
malware sees a normal day. A business process attack is the plainest case.
An authorised user modifying a payroll record looks the same as a
compromised identity doing it.

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

The key shift is from reactive to proactive: detect the precursor activities
(credential harvesting, lateral movement to backup infrastructure, shadow
copy manipulation) and contain before the impact event.

Immutable backups are the highest-impact single control here. A ransomware
deployment that cannot destroy the backup loses its primary leverage point.
Air-gapped or write-once backups stored in a location not accessible from
domain admin credentials are the practical implementation.

Backup access monitoring: any access to backup infrastructure by any
identity is worth logging and reviewing. Backup servers benefit from minimal
exposure and are not accessible from general-purpose domain admin accounts.

These are the loud end's controls. The quiet families answer to different
ones: segregation of duties, provenance of access, and business-logic
monitoring.

## The disclosure gap: extortion and espionage

Ransomware detection frameworks focus on encryption events. Disclosure
requires none. If data has already left an organisation before the
extortion demand arrives, there is no technical control that recovers it,
and the only defence is preventing the exfiltration in the first place.

Extortion is the loud half of that. The quiet half is espionage, the
[confidentiality](confidentiality.md) family, where there is no demand at
all and the secret simply surfaces on the far side. Both are losses a copy
makes permanent, which is why exfiltration detection (in the
[exfiltration section](../exfiltration/index.rst)) is the control point for
either.
