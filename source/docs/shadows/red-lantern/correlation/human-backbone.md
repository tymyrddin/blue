# Analytical backbone

How disparate control-plane signals are combined into meaningful, high-confidence detections, turning weak, ambiguous 
signals into structured narratives that reflect attacker intent. We use a running example.

## Correlation input mapping

The first step is to define, explicitly and non-negotiably, which log sources feed which correlations, and what 
authority each source has. For example [correlation-input-map.md](https://github.com/ninabarzh/red-lantern-detection/blob/main/correlations/correlation-input-map.md).

That file answers one question only: *which decoded fields are allowed to influence which correlations, and why*.

Three log sources are used:

* BMP (BGP Monitoring Protocol), the authoritative source for routing events. If an announcement or withdrawal did not appear in BMP, it is not treated as having happened.
* RPKI validator logs provide trust and legitimacy signals. They describe how prefixes and origin ASes are evaluated, not how traffic flows.
* Router syslog (control-plane only) is limited strictly to operational context, such as neighbour session state changes. It is never treated as a source of routing truth or validation authority.

Clear boundaries are established and enforced:

* BMP → routing events (announce / withdraw)
* RPKI logs → trust validation state
* Router syslog → operational context only

Anything that crosses those boundaries is excluded from correlation logic by design. The result is a clean input model 
where every field has a purpose, and no log source is allowed to overstep its role.

## Correlation logic design

With inputs defined, the next step is to design the correlations themselves. Each correlation is first written as 
human-readable detection logic, describing attacker behaviour rather than technical implementation. This keeps the 
focus on intent, sequencing, and meaning.

Three correlations are defined in our example:

* [roa_poisoning](roa-poisoning.md) detects manipulation of trust signals without any accompanying routing action. A preparatory phase, not an attack, and is treated as such.
* [rpki_cover_hijack](rpki-cover-hijack.md) detects active routing events that appear legitimate because they are RPKI-valid. This captures hijacks that deliberately hide inside the trust system.
* [multi_stage_bgp_attack](multi-stage.md) detects a full campaign lifecycle: trust manipulation, routing action, operational acceptance, and eventual withdrawal. This is the highest-confidence detection and deliberately requires multiple independent signals.

For each correlation, the documentation defines:

* The observable signals it relies on
* The sequence in which those signals must occur
* Temporal characteristics (including asymmetric time windows)
* Assumptions about visibility and trust
* Known limitations and likely evasion strategies

The logic is explicitly stateful and sequential where required. These are not simple pattern matches; they describe 
stories that unfold over time.

## Documentation of observable signals

Only signals that can be observed passively and authoritatively are used.

Across the correlations, the following signal types are documented and reused consistently:

* BMP announcements and withdrawals
* RPKI validation outcomes and state transitions
* Router neighbour session changes (as operational confirmation only)
* Contextual ROA changes, where relevant

Signals that are noisy, ambiguous, or non-authoritative are deliberately excluded. If a signal cannot be trusted on its own, it does not drive a correlation.

## Integration of related playbooks

Each correlation is positioned within a broader attack progression. Rather than treating detections as isolated alerts, 
they are linked to related phases and preparatory actions. This allows later alerts to be interpreted in context, 
rather than in isolation.

For example:

* A `roa_poisoning` alert increases suspicion of later routing events.
* An `rpki_cover_hijack` alert gains confidence if preceded by trust manipulation.
* The `multi_stage_bgp_attack` correlation explicitly depends on signals from earlier phases.

This turns correlations into narrative building blocks, not standalone alarms.

## Finally!

The analytical design is now complete. Next steps are implementation-focused, but guided entirely by the documented logic:

* Encode the correlation logic into detection rules
* Map fields exactly as defined in the input map
* Test correlations using synthetic, time-ordered event timelines
* Validate that correlations trigger only when the intended story is present

At no point should implementation invent new meaning. The documentation already defines what matters. The thinking is done, the boundaries are set, and the wiring can now begin.
