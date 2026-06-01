# Response playbooks

Three correlations, three response states. A Playbook 1 alert represents ground preparation with no
active attack yet. Playbook 2 indicates a campaign in progress or recently completed. Playbook 3 is
an active control-plane incident in which routing trust has already been abused.

## Playbook 1: ROA poisoning

When this alert fires, RPKI validation state has shifted without a corresponding routing event. The
attack has not started; the conditions for it are being arranged.

Immediate actions:

* Flag the affected prefix for heightened BMP monitoring. Any subsequent announcement for that prefix
  warrants escalated scrutiny.
* Review recent ROA changes with the responsible registry or RIR. Unexpected creation, modification,
  or early expiry of a ROA is the primary signal to investigate.
* Prepare prefix-specific filters or de-preference rules in advance, before a routing event
  materialises.

This alert fires rarely when the baseline is correct. If it fires often, the historical baseline or
validator configuration is worth reviewing first.

Escalation: any BGP announcement for the affected prefix following a Playbook 1 alert moves the
incident to Playbook 2 or Playbook 3.

## Playbook 2: Multi-stage BGP attack

When this alert fires, the full attack sequence has occurred or is in progress: announcement,
validation endorsement, route acceptance, and likely withdrawal. The window for interception is
narrow.

Immediate actions:

* Apply prefix filtering or de-preference for the affected prefix on border routers. This limits
  further traffic redirection while the incident is investigated.
* Reroute traffic away from affected paths where alternatives exist.
* Escalate as a routing security incident, not a misconfiguration.

Follow-on:

* Document the full event sequence: AS_PATH, origin AS, announcement and withdrawal timestamps, and
  which validators endorsed the route.
* Audit ROAs for the affected prefix with the responsible registry or RIR.
* Review trust anchors for the autonomous system involved.

## Playbook 3: RPKI cover hijack

When this alert fires, a prefix has been announced under valid RPKI cover and subsequently withdrawn,
consistent with tactical rather than operational use. Routing trust has been successfully abused.

Immediate actions:

* Treat as a control-plane security incident, not a misconfiguration or operator error.
* Apply immediate prefix filtering or de-preference on affected peers.
* Audit ROAs and trust anchors for the hijacked prefix.

Follow-on:

* Increase monitoring for related prefixes and AS paths. A confirmed cover hijack may be one event
  in a longer campaign.
* Retain all correlated log evidence: BMP events, validator responses, and timing data.

This is late-stage detection. The route was active; any traffic redirection has already occurred.
The response value is containment, attribution, and preventing recurrence.

## Testing and validation

The [red-lantern-sim](https://github.com/tymyrddin/red-lantern-sim) generates deterministic telemetry
for all three playbooks. Running a scenario through the simulator and confirming that the
corresponding correlation fires is the practical way to verify detection coverage before relying on
it in production.

Playbook 3 practice telemetry is in `examples/playbook3-practice.json` in the simulator repository.
The training variant (`playbook3-training.json`) adds annotated debug lines and is more useful for
initial analyst familiarisation than for rule validation.
