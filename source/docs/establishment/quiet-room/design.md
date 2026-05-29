# Signal intake design

What the Quiet Room does is described in the overview. This page records the decisions needed to build
and operate it.

## Domain

The Quiet Room processes incoming signals, not outgoing escalations. Material that arrives leaves either
classified and routed, or dropped. It does not leave as an escalation. That is the Long Table's function.

The distinction matters operationally: if the Quiet Room begins making assessment decisions, it absorbs
work that belongs to the Long Table and starts producing inconsistent output. The boundary is worth
maintaining explicitly.

## Sensor stack

Three sources are in use: Suricata, Zeek, and Wazuh.

Suricata and Zeek are deployed on network perimeter sensors. They are complementary. Suricata triggers on
rule signatures; Zeek captures full connection metadata regardless of whether a signature fires. Both are
needed. Suricata without Zeek loses the context around alerts. Zeek without Suricata produces volume without
initial prioritisation.

Wazuh provides host-level telemetry on a selective basis. The selection is implemented as a host group
assignment at deployment time, not a filter at analysis time. Hosts not in the group produce no data visible
to the Quiet Room.

All three tools are open source. None requires a vendor relationship for operational use.

## Storage and routing

Classified signals are written to MISP as events, with sharing groups governing what reaches the Long
Table. The classification metadata (source taxonomy, reliability level) is stored as MISP event tags.

Material dropped below the routing threshold is logged before deletion. The drop log is retained for 90
days. It is available for retrospective analysis but is not reviewed in the normal course of operations.

## Classification automation

Reliability scores are auto-assigned on intake based on source taxonomy. Analyst review is required before
material is escalated or routed above the reliability threshold. Manual override is available at any stage.

This keeps throughput manageable during high-volume periods without collapsing the distinction between
intake metadata and assessment credibility. Fully manual scoring does not scale once ingestion volume rises.
Fully automated scoring without an analyst gate would have the Quiet Room making assessment decisions, which
is the Long Table's function.

## Open decisions

Sensor ownership. Does the Quiet Room operate its own sensors, or receive feeds from other sources,
such as the Office's signal infrastructure or external feeds forwarded by the Receiving Desk? If both, how
is source taxonomy assigned for material whose origin is indirect? The overview's "Other" category covers
this, but the operational boundary between direct sensor data and forwarded material is worth defining
before ingestion volume grows.

MISP sharing groups. The current configuration shares all material classified at reliability 3 or above
with the Long Table sharing group. Whether the Long Table should have read access to the drop log (reliability
1 and 2 material that was dropped) is an open question. The argument for: early warning if a pattern emerges
across dropped material. The argument against: it collapses the triage boundary and adds volume the Long
Table was not designed to process.

Wazuh host scope. The selection criteria for which hosts forward to the Quiet Room are described in the
overview as internal. They are: hosts that sit on the signals pipeline (MISP, Shuffle, sensor infrastructure)
and hosts with administrative access to those systems. A periodic review process for scope changes does not
currently exist. Hosts added after the initial configuration may not forward at all.
