# When your own posture is the threat

The crises that dramatise this: [Exercise Clean Slate](../../scenarios/compliance-lockdown.md),
[Campaign Living Archive](../../scenarios/continuity-exfiltration.md),
[Operation Shadow Protocol](../../scenarios/ipv6-autoconfig-takeover.md), and
[Operation DHCP Deception](../../scenarios/dhcp-route-poisoning.md).

Every other impact family involves the adversary bringing something: a payload, a stolen key, a
blocked road. This one involves bringing nothing. The attacker studies the organisation's structural
habits, finds the systems trusted implicitly, and changes a destination or a threshold. It is living
off the land scaled up from the single host to the whole institution: where the tactical version
abuses a built-in binary to avoid dropping malware, the strategic version abuses a policy, a mandate,
a maintenance window, or the network's own autoconfiguration, and lets a perfectly compliant, heavily
automated estate do the work.
Nothing fires, because nothing is wrong in the only sense the monitoring understands wrong.

## The shape of it

The weapon is the organisation's own trust in its own machinery. Two postures recur.

### The defensive squeeze

The rules themselves are turned up. A genuine, properly signed policy change tightens controls,
audits, and approvals until the machinery locks itself down and the institution can no longer move,
its own risk-aversion used against it. The harm is paralysis, and it is hard to call an attack
because every part of it is compliant. [Exercise Clean Slate](../../scenarios/compliance-lockdown.md)
is this posture: the gates lock so thoroughly the garrison cannot open them.

### The housekeeping drain

The automation is turned outward. A trusted native utility, replication or logging or backup, is
given one more legitimate-looking instruction, a second destination or a wider scope, and the
organisation's own resilience mandate carries its data out or runs up its costs. The victim bears the
processing and the bandwidth of its own compromise.
[Campaign Living Archive](../../scenarios/continuity-exfiltration.md) is this posture: the continuity
mandate that copies everything, copied to one address too many.

## The lack of signal

Detection built to catch intrusion finds nothing here, because there is no intrusion. The tools are
native, the certificates valid, the policy signed, the job scheduled. The signal, where it exists, is
in the shape rather than the act: a maintenance window that runs longer than its baseline, a
replication job with a destination it did not have last month, a compliance posture that tightened
without a debate, a clerk's token used for a configuration change at an odd hour. Each reads as
routine administration until someone asks why.

## Countermoves

The defence is mostly about not trusting the machinery blindly. A change that tightens security is
worth the same review and rollback as one that loosens it, because either can break an institution.
Native tools that move or replicate data are worth baselining, so a new destination or a widened
scope stands out against what the job did yesterday. Privileged automation, the scheduler, the backup
utility, the policy pipeline, is worth treating as the high-value target it is, since a valid token on
any of it is a weapon that needs no malware. And a break-glass path the controls cannot themselves
revoke is the difference between a bad afternoon and an institution that cannot reach its own levers.

## Read across

- [Counter moves on evasion](../evasion/index.rst): living off the land at the host level, the
  tactical root of the same idea.
- [Operational cost of security controls](../friction/index.rst): the controls whose own weight can
  be turned into the weapon.
- [Counter moves on exfiltration](../exfiltration/index.rst): native tools moving data they were
  trusted to move.
- [Counter moves on the human layer](../human/index.rst): the clerical estate, the valid tokens, and
  the policy pipeline.
- [Responding to it](runbooks/administrative-hijack-response.md): hunting the shape, and containing
  both postures.
