# Multi-stage BGP attack correlation logic

## What this correlation detects

A deliberate, multi-phase BGP control-plane attack in which an adversary:

1. Manipulates RPKI state to establish apparent legitimacy
2. Announces a sub-prefix via BGP that appears RPKI-valid
3. Achieves traffic redirection or interception
4. Withdraws the route after objectives are met

This is not a noisy hijack. It is a patient campaign that succeeds by corrupting trust mechanisms rather than bypassing them.

## Why this matters

Single BGP alerts are almost always ambiguous:

* Route leaks happen
* Misconfigurations happen
* Validators disagree

This attack becomes visible only when multiple independent signals align: routing behaviour, operational acceptance, and validator consensus.

If you alert on any one of these in isolation, you either miss the attack or drown in false positives.

## Observable signals

The following signals are observable without packet inspection or active probing:

* BGP route announcements and withdrawals for monitored prefixes
* Route attributes (origin AS, AS_PATH, next hop)
* Router-reported acceptance or rejection of a route
* Independent RPKI validator confirmation of validation state

None of these signals alone are sufficient.
Together, they describe a successful control-plane compromise.

## Required log sources

This correlation assumes access to:

* BMP (BGP Monitoring Protocol)
  Authoritative visibility into BGP announcements and withdrawals.
  This is the ground truth for what entered the control plane.

* RPKI validator logs
  From one or more independent validators (for example Routinator, Cloudflare, RIPE).
  These provide the authoritative validation state.

* Router syslog
  For *operational context only*, such as:

  * session stability
  * timing of acceptance or rejection
  * confirmation that routing decisions were applied

Router logs are not treated as a source of routing truth or validation authority.

Optional but useful:

* Authentication logs (registry or router access)
* Traffic forwarding or flow telemetry

## Correlation logic (human-readable)

The detection logic is as follows:

1. A BGP announcement for a monitored prefix or sub-prefix is observed via BMP
2. Router logs indicate that the announcement was accepted into the control plane
3. One or more independent RPKI validators confirm the prefix and origin AS as `valid` within a short time window
4. The prefix is later withdrawn, suggesting a completed operation rather than a persistent routing change

When all four conditions occur in sequence, raise a high-confidence alert for a control-plane attack executed under RPKI cover.

## Temporal considerations

* Announcement and validation typically occur within seconds to minutes
* Withdrawal may occur minutes, hours, days later
* Correlation logic must therefore support asymmetric time windows

This is not a burst. It is a short campaign with intent.

## Assumptions and limitations

Assumptions

* BMP visibility exists for relevant peers
* At least one validator reflects authoritative RPKI state
* Router logs are sufficiently verbose to indicate acceptance timing

Limitations

* Attacks without withdrawal may evade this logic
* Long-delayed withdrawals weaken confidence
* Partial visibility reduces correlation strength

This detection deliberately favours confidence over coverage.

## Evasion considerations

A capable adversary may attempt to evade detection by:

* Relying on a single validator to avoid consensus signals
* Spreading actions over longer time windows
* Announcing prefixes just outside monitored ranges
* Avoiding withdrawal to appear as a stable route

These evasions increase attacker cost and operational risk, which is an acceptable trade-off.

## Expected outcome

A triggered correlation indicates:

* A suspicious prefix was successfully announced
* Routing infrastructure accepted the route
* Validation systems endorsed the announcement

This is late-stage detection, but still actionable: traffic can be rerouted, prefixes filtered, and trust anchors audited.
