# Signals intake, automated sensor path

![QR-2026-0032 automated sensor event](/_static/images/walkthrough-automated-sensor.png)

*Tags Quiet-Room + tlp:white + reliability="2", no Long-Table; attrs 94.23.117.8 → 10.44.12.7.*

The [Society notification walkthrough](walkthrough-society-notification.md) follows material that arrived forwarded, 
with a source and a reliability already attached. Most of what the Quiet Room handles does not arrive that way. It 
arrives from the sensors: Suricata and Zeek on the perimeter, producing events with no human behind them and no
context beyond what the network showed. This walkthrough follows one automated event from the sensor to
its disposition.

## The material

A Suricata alert fires. The rule matches the exploitation pattern for the Acme Industrial
Gateway update service. The alert carries what an alert carries: a rule signature, a source address, a
destination, and a timestamp. No context. No source. No researcher.

- Rule: exploitation attempt, Acme Gateway update service (TCP/8443)
- Source IP: 94.23.117.8
- Destination: 10.44.12.7, within 10.44.12.0/24
- Alert time: day of intake

The address is familiar, but the sensor does not know that. The automated path does not read the case
store before emitting an event. Whether this address means anything is a question that comes after intake,
not before it.

## Case record: QR-2026-0032

| Field           | Value                              |
|-----------------|------------------------------------|
| Date of receipt | Day of intake                      |
| Source          | Quiet Room sensor (Suricata)       |
| Origin          | Automated, no human source         |
| Routing note    | Pending correlation check          |

### Source taxonomy and reliability

The automated path assigns both axes on intake without an analyst. Source taxonomy: Other. The event did
not come from a Society notification or an Office advisory; it came from the Quiet Room's own sensor, which
the taxonomy carries as Other with a provenance note rather than as a fourth category. Reliability: 2,
the default for a single automated sensor event. One sensor, one alert, no corroboration: that is a 2 by
definition, and it is assigned by rule, not by judgement.

The event is tagged `tlp:white` by default. The automated sensor path does not know the sensitivity of
what it has seen, so it does not assert one. Sensitivity is raised later if the material is found to
concern live operational infrastructure, which is a determination the automated path cannot make.

This is the distinction the forwarded-case walkthrough noted from the other side: QR-2026-0031 was handled
at `tlp:amber` because it arrived through the Receiving Desk with a known operational target. QR-2026-0032
describes the same target, but the sensor path reaches it with no such knowledge attached, so it leaves
intake at `tlp:white`. The two events meet later.

### Disposition

Reliability 2 is below the routing threshold of 3. On its own, this event is held or dropped; a single
automated alert does not route to the Long Table.

It is not on its own. The source address 94.23.117.8 already appears in the pipeline, in QR-2026-0031,
which is routed and at the Long Table. A below-threshold event whose infrastructure matches material
already in the pipeline is held for correlation rather than dropped: the standing of the event changes
because of what it touches, not because of what it is. The correlation link to QR-2026-0031 is recorded,
and the event is shared into the Long Table sharing group as correlated context at its own reliability of
2, not elevated.

No analyst characterises this event. The analyst gate applies to material being routed above the
threshold on its own standing; this event is not. It travels as a sensor observation that happens to
corroborate something already in assessment. What the corroboration is worth is the Long Table's
determination.

## MISP record

A MISP event is created for QR-2026-0032.

Tags: `Quiet-Room`, `Other`, `reliability="2"`, `tlp:white`

Attributes:

| Type      | Value          | Note                                  |
|-----------|----------------|---------------------------------------|
| ip-src    | 94.23.117.8    | source of the alert                   |
| asn       | AS16276        | OVH SAS, FR                           |
| ip-dst    | 10.44.12.7     | targeted host within the subnet       |
| ip-dst/24 | 10.44.12.0/24  | water treatment signalling subnet     |
| datetime  | day of intake  | alert time                            |
| text      | QR-2026-0032   | internal reference                    |
| text      | QR-2026-0031   | correlated event, source IP match     |

The alert time is the case date itself. Where QR-2026-0031 placed the earliest observed activity at
approximately 2026-04-28, this event shows the same source still active four weeks later. The Quiet Room
records that. Whether it means the activity is ongoing is not its determination.

## What the Quiet Room does not do

It does not raise the reliability because the address is familiar. Familiarity is correlation, and
correlation is recorded as a link, not folded into the score. QR-2026-0032 stays at 2.

It does not change the `tlp:white` tag to match QR-2026-0031's `tlp:amber`. The two events are correlated,
not merged. Each keeps the sensitivity it was assigned at its own intake.

It does not interpret the continued activity. A source seen four weeks after first observation may indicate
an ongoing operation or a host that was never cleaned up. The Quiet Room records the timestamps. The Long
Table reads them.

## Case record status

| Field           | Value                                                  |
|-----------------|--------------------------------------------------------|
| Status          | Held for correlation, shared as context               |
| MISP event      | QR-2026-0032 (tlp:white, reliability 2)               |
| Cross-reference | QR-2026-0031 (source IP match)                        |
| Analyst review  | Not required (below threshold, not elevated)          |

The event is in the Long Table sharing group as correlated context. The Quiet Room's part is done.
