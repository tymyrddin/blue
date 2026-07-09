# Responding to impact events

This is the response guidance for the destruction-and-extortion family: the impact that encrypts,
wipes, or diverts, where the response is measured in minutes. The terse step-by-step procedures live
in [the runbooks](runbooks/index.rst); what follows is the shape of the response and the reasoning
behind it. The other four families leave the infrastructure standing and are met more by design than
by reaction, so their countermoves live on their own pages: [availability](availability.md),
[concentration](concentration.md), [integrity](integrity.md), and [access denial](access-denial.md).

## The shape of a ransomware response

The first instinct, pulling the power, is often the wrong one. Memory forensics before shutdown can
recover encryption keys or identify the variant, so isolating the host, removing it from the network,
usually serves better than powering it off. Powering off is the reserve option, for the case where
the ransomware is actively spreading and isolation cannot be done in time. Confirming the blast
radius comes next: which hosts carry the characteristic extension change or ransom note, and whether
the domain controllers are among them.

Backups are looked at early, because they are the attacker's leverage and the defender's only clean
exit. Whether the shadow copies are intact, whether the backup server is reachable, whether anything
has already been deleted. Logs are preserved before any remediation, exported somewhere the
containment actions cannot reach, because the record of how the intrusion began is the first thing
remediation overwrites.

The pattern underneath is that the encryption event is the last step. By the time it
fires the attacker has usually been present for days, so the response is as much about preserving the
record of the dwell time as about stopping the encryption.

## Business process attacks

Fraudulent transactions and data manipulation respond differently, because nothing is encrypted and
almost nothing fires. The affected process is frozen first, pending payments, payroll runs, or
workflow approvals held while the questions are asked. The audit trail is preserved before any action
that might alter it, and the entry point is traced: which identity made the change, when it last
authenticated, and from where. Whether the identity was compromised through token theft or a session
hijack, or whether an authorised user was socially engineered directly, changes what the rest of the
response looks like. Wire transfer fraud runs on its own clock: recovery windows are short, often a
day or two, so the receiving bank is contacted at once.

## After containment

The questions worth asking once the impact is contained are about the path, not the payload. For
ransomware: how the attacker reached domain admin or backup admin credentials, why the backup
infrastructure was reachable from domain admin at all, whether the shadow copies were protected, how
long the dwell lasted, and which detection chances were missed in that window. For business process
attacks: whether the compromised identity's access was appropriately scoped, whether any control
flagged the action before it completed, whether the platform's change logs were read in real time,
and which segregation-of-duties controls were absent. The answers tend to describe the same gap from
two directions.

## Immutable backups

The single highest-leverage control against ransomware is a backup the attacker cannot destroy. A
deployment that can reach and delete the backup keeps its leverage; one that cannot, loses it. The
practical shape is layered: regular primary backups to local storage, a secondary copy replicated to
write-once or object-locked cloud storage, and a backup server held outside the domain admin
privilege scope so a single compromised administrator account cannot reach it. Object lock in
compliance mode cannot be overridden even by the bucket owner within its retention period, which is
what makes the copy resistant to deletion by a stolen administrator credential. The arrangement is
only as good as the restore, so the restores are tested. The command that sets
the lock sits with the other hardening steps in [the runbooks](runbooks/impact-response.md).
