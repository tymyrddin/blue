# Signals intake, Society notification

![QR-2026-0031](/_static/images/walkthrough-society-notification.png)

*Tags tlp:amber + Long-Table + reliability="4" + Society-notification; attrs 94.23.117.8, AS16276, 10.44.12.0/24.*

The Quiet Room receives forwarded material from the Receiving Desk. The case carries a source
taxonomy and reliability score assigned at intake; the Quiet Room reviews the signal content,
confirms or adjusts the classification, and produces a characterised event for routing.
Interpretation is not done here.

This walkthrough follows one case from receipt to MISP record.

## The material

The Receiving Desk forwards T. Vanholt's pcap submission. The forwarded material contains:

- Source IP: 94.23.117.8 (AS16276, OVH SAS, FR)
- Target subnet: 10.44.12.0/24 (Ankh-Morpork water treatment signalling infrastructure)
- Observed period: approximately 2026-04-28 onwards
- Attachment: pcap excerpt, PGP-signed by T. Vanholt

The routing note records a related firmware vulnerability already in the Long Table pipeline
under RD-2026-0047-A: the same researcher submitted the pcap alongside the firmware finding,
and the two travel separate paths from the Receiving Desk onward.

## Case record: QR-2026-0031

| Field           | Value                                   |
|-----------------|-----------------------------------------|
| Date of receipt | Day of intake                           |
| Source          | Receiving Desk (parent RD-2026-0047)    |
| Origin          | T. Vanholt, Civil Observers' Society    |
| Routing note    | Related Long Table case: RD-2026-0047-A |

### Source taxonomy and reliability

Origin taxonomy: Society notification. The material originated with a vetted Society member
and arrived via the Receiving Desk acting as a forwarding channel. The Receiving Desk assigned
reliability 4 at intake.

The routing path is indirect: the material did not arrive from a Quiet Room sensor. How source
taxonomy applies to forwarded material like this is a recognised open question. For this case:
the original source taxonomy is carried forward. The indirect routing path is recorded as a
provenance note, not a taxonomy adjustment. Reliability 4 is confirmed.

### Analyst review

Reliability 4 exceeds the routing threshold of 3. Analyst review is required before the event
is routed to the Long Table sharing group.

The pcap is reviewed. Traffic from 94.23.117.8 is consistent with the exploitation pattern
described by the researcher. The subnet 10.44.12.0/24 is identifiable as city water treatment
signalling infrastructure. The observed period places the activity approximately four weeks
before the submission date.

The analyst does not assess whether the traffic represents an active compromise, a scanning
campaign, or opportunistic exploitation. That determination belongs to the Long Table. The
analyst confirms the signal is real, the source and target are as described, and the
reliability classification is appropriate.

Classification confirmed. Routing approved.

## Signal characterisation

What the Quiet Room records:

Source: a single IP address in AS16276 (OVH SAS, France). No additional attribution. The ASN
is a commercial hosting provider; the IP alone does not identify an actor.

Target: 10.44.12.0/24, water treatment signalling subnet. The subnet is within the city's
operational infrastructure. Targeting is specific to this subnet, not diffuse.

Temporal extent: earliest observed activity approximately 2026-04-28. The gap between
earliest observed and submission date is approximately four weeks.

Traffic pattern: consistent with exploitation of a vulnerability in the update service of the
targeted firmware class. The Quiet Room records the traffic characteristics. It does not
confirm the vulnerability or assess exploitation success.

The cross-reference to RD-2026-0047-A is recorded in the event. Whether the two cases warrant
combined assessment is the Long Table's determination.

## MISP record

A MISP event is created for QR-2026-0031.

Tags: `Quiet-Room`, `Society-notification`, `tlp:amber`

`tlp:amber` rather than `tlp:white` because the target subnet is live operational
infrastructure. The event is shared with the Long Table sharing group and not beyond. The
automated sensor path (Suricata alerts) uses `tlp:white` by default; this case is handled
differently because it arrived via the Receiving Desk with a known operational target.

Attributes:

| Type      | Value           | Note                               |
|-----------|-----------------|------------------------------------|
| ip-src    | 94.23.117.8     | source of observed traffic         |
| asn       | AS16276         | OVH SAS, FR                        |
| ip-dst/24 | 10.44.12.0/24   | water treatment signalling subnet  |
| datetime  | 2026-04-28      | earliest observed activity         |
| text      | QR-2026-0031    | internal reference                 |
| text      | RD-2026-0047-A  | related Long Table case            |

The pcap is attached to the MISP event as a file object. Attribute expansion from pcap content is the Long Table's decision.

## What the Quiet Room does not do

The cross-reference to RD-2026-0047-A is visible in the routing note and is recorded in the
MISP event. The Quiet Room does not read the Long Table case or combine the two findings.
Correlation belongs to the Long Table.

The Quiet Room does not contact T. Vanholt. Researcher acknowledgement was handled by the
Receiving Desk. The Quiet Room has no researcher-facing function.

The Quiet Room does not assess whether 94.23.117.8 belongs to a known threat actor, whether
the campaign is ongoing, or whether the targeting is part of a broader operation. Those are
Long Table questions.

## Case record status

| Field           | Value                                              |
|-----------------|----------------------------------------------------|
| Status          | Characterised, routed to Long Table                |
| MISP event      | QR-2026-0031 (tlp:amber, Long Table sharing group) |
| Cross-reference | RD-2026-0047-A (Long Table)                        |
| Pcap            | Attached to MISP event, unexpanded                 |
| Analyst review  | Completed same day                                 |

The case is closed at the Quiet Room. The Long Table determines whether further work is
warranted.
Last updated: 10 July 2026
