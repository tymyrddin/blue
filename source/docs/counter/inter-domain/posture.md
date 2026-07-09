# Posture for the long game

Hardening and detection answer incidents. A state campaign run over months or years is not an incident, and it
does not lose to the same moves. The patient adversary ages a clean routing history, registers plausible
registry objects, teaches a prefix to look habitually multi-origin, and waits, so that when the announcement
finally comes it reads as a mistake and the alert reads as noise. There is no single packet to catch and no
moment that, blocked, undoes the rest. The answer is not a better alarm. It is posture: deny the preconditions
the campaign needs, defend the layer it actually attacks, and accept that the floor is collective.

## Deny the preconditions

A long campaign rarely invents new physics. It multiplies the gaps that are already there, the unsigned
prefix, the loose maximum length, the path no one is entitled to announce, the filter built from stale
registry data. Close those, and the years of positioning buy nothing at the moment of decision, because the
forged route is dropped on its own merits no matter how familiar the ground has been made to look.

This is the work already set out in [reducing the inter-domain attack surface](exposure.md): a ROA whose
maximum length equals the announced length, Route Origin Validation that drops `invalid` on ingest rather than
logging it, per-customer filters pruned to what is actually announced, ASPA to refuse a path that climbs
through an AS that is not an authorised provider, and announcements spread across diverse upstreams so no
single chokepoint degrades cleanly. None of it is novel against a state. Its value is that it removes the soft
ground a patient operation depends on, so the preparation is wasted.

## Defend the layer it attacks

The softest campaigns, legitimacy subversion and deniable degradation, do not aim at the routing table at all.
They aim at confidence: at the operator who has learned to wave a familiar anomaly through, at the public that
reads a slow service as incompetence, at the institution that cannot say cleanly what happened. That layer
needs an institutional defence, not a protocol one.

Three things hold it. Memory kept long enough to compare a prefix's normal today against where it started,
which is the hard case [detection](detection.md) names: slow baseline pollution is only visible against a
long baseline. Correlation across independent signals, RPKI state, IRR consistency, the
relationship graph, cross-vantage agreement, rather than a single learned threshold that can be quietly
retrained. And the ability to account for an incident clearly and quickly, because a routing event reaches the
public through status pages and official statements, and the belief shift is produced by how the disruption is
explained. A transient degradation that is explained promptly stays a transient
degradation; one that is met with silence hardens into a story about competence.

## The floor is collective

The asymmetry is the uncomfortable part and worth stating plainly. The attacker needs one unsigned prefix or
one path with no enforcement on it; the defender needs coverage everywhere the traffic might go. A single
upstream that enforces validation breaks a given hijack, but the class of attack only closes when signing and
enforcement are the default across the ecosystem.

This is why the long game is not a problem any one network firewalls its way out of. The durable defences are
shared: RPKI with tight ROAs and enforced ROV, ASPA as it deploys, IRR hygiene, and the coordination efforts
such as MANRS that raise the floor for everyone at once. An organisation can and does harden its own edge, but
its exposure is partly a function of how well its neighbours and their neighbours have hardened theirs. Posture
here is as much about the company kept as the configuration held.

## What this buys

None of this catches the patient adversary in the act, and it is not meant to. It denies the adversary the act
worth attempting. The campaign's payoff was future freedom of action; closing the preconditions removes the
freedom, defending the interpretation layer removes the deniability, and raising the collective floor removes
the soft neighbours. What is left is an operation that costs years and yields little, which is the only outcome
that durably discourages one. The long game is won by ground that was never left soft, not by the alarm that
finally fired.
