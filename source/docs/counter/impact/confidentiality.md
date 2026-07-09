# When nothing breaks and the secret is already gone

The crises that dramatise this: [Operation Silent Siphon](../../scenarios/cloud-identity-exfil.md),
[Operation Neural Ghost](../../scenarios/ai-autonomous-intrusion.md),
[Campaign Living Archive](../../scenarios/continuity-exfiltration.md),
[Operation Double Bite](../../scenarios/wiper-diversion.md), and
[Operation Menagerie Watch](../../scenarios/ngo-feed-intercept.md), the last two hidden behind a fire and
a kindness.

This is the impact that takes nothing away. Nothing is encrypted, nothing is altered, nothing is locked,
and every system reports green, because the system was never touched. What is lost is the one thing
copying does not disturb: the secret stays exactly where it was and is gone all the same. The diplomatic
position, the source's name, the cryptographic log, the negotiating hand, each is worth something only as
long as one side holds it alone, and a copy ends that quietly, on time, with the original sitting
undisturbed in its drawer.

It is the third leg of a triad whose other two already have families here. Availability is the loss of
the thing working; integrity is the loss of being able to trust what it says; this is the loss of having
it to oneself. It is also the quietest of the families, which is the through-line the whole section keeps
returning to: an impact that changes nothing operational leaves nothing operational to detect, and tends
to surface late, by an audit, a coincidence, or a word from an ally who saw the other end.

## The lack of signal

A confidentiality loss is built out of authorised actions. A valid token reading a mailbox, a service
account exporting a report, a backup job writing to one more destination: each is the system doing its
job, and a monitor tuned for malware or breakage sees a calm and blameless day. [Operation Silent
Siphon](../../scenarios/cloud-identity-exfil.md) kept every dashboard at baseline for months and was
found only because an allied service noticed the city's own positions arriving somewhere they had no
business being. The signal, where there is one, is not on the compromised system at all. It is the
secret turning up on the far side, in a price quoted too well, a position anticipated, a source rolled
up.

### The quiet read

The pure form takes the data and leaves everything else exactly as it was. Borrowed identity, trusted
cloud, slow export under the loss-prevention thresholds, and the read can run for as long as the tokens
live. There is no remediation that recovers the secret, because there is no damage to undo. The work is
to scope what left, assume it is held by an adversary, and act as though it is, which is a different and
harder discipline than restoring a service.

### Theft behind a louder crime

The other form hides the read inside a noisier event. [Operation Double
Bite](../../scenarios/wiper-diversion.md) spent months drawing off an energy ministry's schematics, then
lit a wiper across the network on the way out, so the response would chase the destruction while the
theft, finished and quiet, went unremarked. The destruction is real, and it is also misdirection.
Reading the smoke as the whole attack is the mistake the diversion is built to produce.

## Countermoves

The defining fact is that the loss cannot be reversed, which moves the whole effort upstream and
downstream of the theft itself. Upstream, it is provenance of access: who and what may read the secret,
proven and short-lived, so a borrowed token expires before it earns its keep and a new reader is a new
event rather than an inherited right. Downstream, once a read is suspected, the work is to bound it
honestly, rotate every credential and key it could have touched, and treat the material as held by the
adversary from there on, including the awkward step of warning whoever else trusted the holder with it.
The detection that exists lives in the shape of access and the shape of the exit, not in any broken
thing.

## Read across

- [Counter moves on exfiltration](../exfiltration/index.rst): the channel the secret leaves by, and the
  technique this impact is the consequence of.
- [Counter moves on collection](../collection/index.rst): catching the data being gathered and staged
  before it goes.
- [When your own posture is the threat](administrative-hijack.md): the method most of these run on, the
  organisation's own trusted access turned to reading.
- [OAuth scopes as blast radius](../cloud/oauth-scopes.md): the cloud consent and tokens that make the
  quiet read possible.
- Responding to it borrows from two existing runbooks: [administrative hijack
  response](runbooks/administrative-hijack-response.md) for evicting the trusted access, and the
  [exfiltration hunts](../exfiltration/runbooks/exfil-hunt.md) for finding the exit it used.
Last updated: 13 June 2026
