# Correlating control-plane signals

A single routing signal rarely means much on its own. A BGP update is routine. An RPKI
state change is usually administrative. A latency spike is usually congestion. The
interesting cases appear when these line up: a signal becomes evidence once another signal
gives it context. Correlation is the layer that turns ambiguous events into something an
analyst can act on.

This page is doctrine, the reasoning behind the rules rather than the rules themselves. The
runnable encodings, and the fixtures they are validated against, live in the detection
simlab (heimdallr). The single-signal hunts they build on are in
[detecting network attacks](detection.md) and
[route-origin hijack hunting](runbooks/bgp-hijack-hunt.md).

## Correlation, not more alerts

BGP's trust model predates the threat model it now faces: it assumes operators do not lie,
networks cooperate, and mistakes are accidental. None of that holds reliably, and perfect
prevention is not on the table. The lever that remains is time to detection, and correlation
is most of what shortens it.

A single signal is ambiguous; correlation is what turns it into confidence.

| Signal                      | Alone             | With correlation                                         |
|-----------------------------|-------------------|----------------------------------------------------------|
| BGP update                  | Routine operation | plus a short-lived announcement, a possible hijack       |
| Latency spike               | Congestion        | plus a more-specific announcement, possible interception |
| Registry login out of hours | A remote operator | plus a ROA deletion, possible compromise                 |

Two more observations frame the discipline. False positives erode a detection programme
faster than missed signals: once most alerts read as "probably nothing", the one that
mattered travels out with the rest, so tuned thresholds, allow-lists for known anycast and
CDN behaviour, and correlation usually keep the rate survivable. And detection and attribution are different questions. Detection asks whether
something suspicious happened and can land in minutes; attribution asks who and why and may
take weeks, or never resolve. Conflating them stalls the part that is fast.

## Source authority

Correlation degrades quickly when every log source is treated as equally authoritative. A
cleaner model assigns each source a role and holds it there:

- BMP (BGP Monitoring Protocol) is the authoritative record of routing events. If an
  announcement or withdrawal did not appear in BMP, it is not treated as having happened.
- RPKI validator logs carry trust and validation state: how prefixes and origins are
  evaluated, not how traffic flows. Independent validators add consensus.
- Router syslog supplies operational context only, such as neighbour session changes and the
  timing of acceptance. It is not a source of routing truth or validation authority.

Anything that crosses those boundaries stays out of the correlation by design. The result is
an input model where every field has a defined purpose and no source oversteps its role.
Defining that mapping explicitly, before any rule is written, is the step that keeps the
later logic honest.

## Three patterns worth correlating

These describe attacker behaviour over time. Each reads as human-readable logic first; the
platform encoding follows from it.

### Trust-signal manipulation, the arming phase

An adversary alters ROA data (creation, modification, replacement, or expiry abuse) so that
the RPKI validation outcome for a prefix-origin pair changes, without yet announcing
anything. This is not the attack; it is preparation, reshaping trust signals so a later
routing action arrives looking legitimate.

ROA churn is usually waved through as administrative noise, which is the cover. It turns
interesting when a validation state changes and no routing necessity explains it. The phase
is invisible to BGP-only monitoring and cannot be reconstructed after the fact if validator
logs were never kept. The signal is a validation-state transition (valid, invalid,
not-found) with no corresponding announcement, withdrawal, or operational change, and with
validator consensus incomplete or transient. The honest output is a low-to-medium confidence
flag, since legitimate maintenance can look identical.

### RPKI-cover hijack

An announcement made to appear RPKI-valid, which achieves routing acceptance under that
cover, operates briefly, then withdraws or stabilises. It succeeds by abusing trust rather
than ignoring it, so the classic tells (invalid routes, sudden origin changes, obvious
leaks) are absent. Alerting only on invalid misses it; alerting on every announcement drowns
the analyst.

The correlation reads a BMP announcement for a monitored prefix, classified valid by one or
more validators, that attracts traffic and is later withdrawn or replaced without operational
justification. A routing event that both looks legitimate and behaves tactically is the
signature. Timing is asymmetric: announcement and validation sit close together, withdrawal
can lag by hours or days, so the correlation window is asymmetric too. This is late-stage
detection by design, and a triggered correlation reads as a control-plane incident, not a
false positive to wave off.

### Multi-stage campaign

The full lifecycle: trust manipulation to establish apparent legitimacy, a sub-prefix
announced under RPKI cover, acceptance into the control plane, traffic redirection or
interception, and withdrawal once the objective is met. Any one stage is ambiguous; the
campaign becomes visible only when routing behaviour, operational acceptance, and validator
consensus align. This is the highest-confidence detection precisely because it requires
several independent signals in sequence, and it deliberately favours confidence over
coverage: an attack that never withdraws can slip past withdrawal-based logic.

## Design heuristics

Correlation is easy to get wrong, and most of the ways it fails are designed in early. A few
principles head off the common failures:

- Explicit sequence is the spine. A correlation reads more clearly when each stage has a
  defined order, and the engine can refuse events that arrive out of sequence.
- Optional signals work best bounded. Marked optional, they raise confidence without gating
  the correlation, so a missing one still leaves it firing at its last confirmed stage.
- Precise field matching keeps unrelated events apart. Checking the relevant fields at each
  stage, prefix and ASN, and normalising across sources avoids the accidental correlations
  that broad wildcards invite.
- Confidence that accumulates as the attack unfolds reads better than severity pinned to the
  last event; the final alert can reflect the highest confirmed stage.
- Explicit exclusions reduce noise. Naming what does not belong, benign maintenance and
  unrelated prefixes, keeps ordinary churn from amplifying into an apparent campaign.
- Intentional timeframes, grounded in how the attack actually progresses, hold up better than
  convenient ones: short enough that unrelated events do not link, long enough to catch
  asynchronous actions.
- A correlation is a living artefact. Decoders, log sources and environments shift, so a rule
  that ran cleanly months ago can rot quietly without continuous testing.
- Human-readable logic first. Writing each stage, sequence and confidence level in plain
  structured form before translating to platform syntax keeps rules auditable and portable.
- Validation against ground truth. At least one complete scenario, and a few plausible partial
  ones, surfaces silent failures before production.

## Failure modes

Correlation rarely fails loudly. It fails by telling plausible lies, or by saying nothing,
and the quiet failure is the more expensive:

- Silent non-detection. The sequence occurred, the events are present, and nothing fired. The
  usual cause is optimism: an optional signal treated as mandatory, a field name that does not
  match across stages, or state that expired before the next step arrived. Dashboards stay
  green while the attack walks through.
- Correlation without causation. Unrelated events, different prefixes and ASNs, assembled into
  a "sequence" by matching that was too broad or rested on timing alone. The result is
  believable but false incident narratives.
- Order ignored. A withdrawal precedes its announcement, validation precedes observation, and
  the alert fires anyway, because parent-child ordering was assumed rather than encoded.
- Timeframe inflation. Windows stretched to "make it work" until unrelated events link days
  apart and causality blurs into coincidence with a memory.
- Optional signals as accidental gates. A step meant to be optional sits where the correlation
  only fires when it happens to be present, so the attack is caught only in well-instrumented
  networks.
- Confidence collapse. Later stages lower the severity or reset the alert, so analysts cannot
  trust the level and response turns arbitrary.
- Noise amplification. Under-specified boundaries turn maintenance windows into apparent
  campaigns until analysts begin ignoring the alerts, the real ones included.
- Drift. Decoders evolve and field names change subtly, and logic that worked six months ago
  no longer does, with no obvious change to point at.

The move worth resisting is "just extend the timeframe". That is how most of these begin. A
rule of thumb holds up well: an alert that tells a convincing story it cannot explain step by
step from observable events is most likely lying.

## Where this connects

The single-signal detections these correlations build on are in
[detecting network attacks](detection.md) and
[route-origin hijack hunting](runbooks/bgp-hijack-hunt.md). The runnable encodings, the event
model, and the fixtures that validate them, drawn from the inter-domain routing lab and
replayed offline, live in the detection simlab (heimdallr). Response actions, once a
correlation fires, sit with [responding to impact](../impact/response.md).
Last updated: 09 July 2026
