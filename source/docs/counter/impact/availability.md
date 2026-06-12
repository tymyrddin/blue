# When the network is the target

The crises that dramatise this: [Operation Foul Weather](../../scenarios/clacks-routing-attack.md)
head-on, with [Exercise Quiet Yard](../../scenarios/golem-trust-outage.md) and
[Operation Idle Hands](../../scenarios/golem-free-will-injection.md) arriving at the same loss from
their own families.

Most availability planning assumes the failure announces itself. A line goes dead, an alarm sounds,
a runbook opens. A harder case is the line that stays up and lies. Traffic is not stopped so much as
desynchronised, delayed, or quietly misrouted, and a network sorted into the wrong piles is worse
than a dead one, because a deadline invites remediation and a lying one invites confidence.

## The shape of it

Deliberate degradation of the carrying layer rather than its destruction. The adversary moves off
binary states and works the margins: routing updates that reorganise the network around a relay
that should not hold the authority, non-repudiation that drifts out of step so the record of who
said what no longer agrees with itself, commands sorted into islands that cannot hear each other
agree. Nothing is down. Everything is in the wrong place, signed, and plausible.

## Where it shows

The early signals tend to read as routine operational friction, which is the point. A rise in
dropouts the operators attribute to the weather. Logs that are delivered but no longer reconcile.
Malformed headers filed, for a day or two, as a replication bug in somebody else's database. Each
phase has an innocent reading available for free, and the innocent readings hold right up until the
routing islands appear, by which time the slow burn has bought the adversary days of deniability.

## Countermoves

Out-of-band fallback is the first instinct and carries its own exposure. A physical or otherwise
unforgeable channel is slow and awkward, and a single carrier holding the only trustworthy
instruction is a single point of failure that can be watched, intercepted, or simply followed. A
fallback assumed to be unwatched is a fallback an unhurried adversary has had the same months to
study.

Re-keying mid-crisis is the second, and it blinds the defender too. A stolen but genuine signing
key means trusting any signed update becomes a choice rather than a default, and revoking it darkens
everyone for a while, the defender included. The window that buys can be the window the adversary
was after. Defending the integrity of the network can mean darkening your own assets, at an hour
someone else chose.

The discipline underneath both is treating a recovered network as suspect until its provenance has
been read, rather than after the traffic has already flowed through it.

## Read across

- [Counter moves on the network](../network/index.rst): the technical layer beneath routing and
  signal integrity.
- [Detection false positives](../friction/detection-false-positives.md): why a real signal gets
  dismissed as routine noise, which is the whole game in a slow-burn attack.
- [Responding to it](runbooks/availability-response.md): the do-this-now runbook for the failure
  modes above.
