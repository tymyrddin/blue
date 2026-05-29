# Signals intake, the drop

Most of what arrives does not route. A division that escalated everything would be useless to the one
above it; the value of the Quiet Room is partly in what it declines to pass on. This walkthrough follows
one event that is dropped, and what dropping means.

## The material

A third-party feed the Quiet Room subscribes to lists an external IP address as associated with generic
scanning activity.

- Source IP: 203.0.113.77
- Feed claim: scanning, no target specified, no campaign attribution
- Local sightings: none

The address has not been seen by any Quiet Room sensor. It does not appear in any event in the pipeline.
It arrives as a feed assertion and nothing else.

## Case record: QR-2026-0034

| Field           | Value                              |
|-----------------|------------------------------------|
| Date of receipt | 2026-05-28                         |
| Source          | Third-party feed                   |
| Origin          | External feed, unconfirmed         |
| Routing note    | Below threshold, no correlation    |

### Source taxonomy and reliability

Source taxonomy: Other. A third-party feed is neither a Society notification nor an Office advisory.
Reliability: 1. The claim is single-source, unconfirmed, and uncorroborated by anything local. The
overview puts material like this at the bottom of the scale: unconfirmed, single-source, no corroboration.

### Disposition

Reliability 1 material is dropped unless a correlation already in the pipeline changes its standing. The
address is checked against the pipeline. There is no match. No sensor has seen 203.0.113.77, no routed
event references it, and no held event shares infrastructure with it. Nothing changes its standing.

The event is dropped.

Dropping is not deleting. The drop is written to the drop log, where it is retained for ninety days. If
203.0.113.77 turns up in a sensor event next week, the earlier feed claim is there to be found, and the
combination would be assessed then. Until something local corroborates it, a feed assertion about an
address nobody has seen is not the Establishment's concern, and the Long Table is not asked to spend
attention on it.

## No MISP event

No MISP event is created. The drop log entry is the only record. The drop log is internal to the Quiet
Room and is not in any Long Table sharing group; the overview is explicit that the drop log is not
reviewed by the Long Table in the normal course of operations. Routing this upward would hand the division
above exactly the volume the threshold exists to keep from it.

Drop log entry:

| Field       | Value                                  |
|-------------|----------------------------------------|
| Reference   | QR-2026-0034                           |
| Value       | 203.0.113.77                           |
| Source      | Third-party feed                       |
| Reliability | 1                                      |
| Reason      | Below threshold, no local correlation  |
| Retained to | 2026-08-26 (ninety days)               |

## What the Quiet Room does not do

It does not route a feed claim because the feed is usually right. A feed's general accuracy is not
corroboration of a specific entry, and the Quiet Room scores the entry, not the feed.

It does not discard the claim entirely. The ninety-day retention is the difference between declining to
act now and pretending the claim was never made. The two are not the same.

It does not tell the Long Table. Silence is the correct output for material at this standing. The drop log
exists so that a later correlation has something to find, not so that the division above has more to read.

## Case record status

| Field           | Value                                        |
|-----------------|----------------------------------------------|
| Status          | Dropped, logged                              |
| MISP event      | None                                         |
| Drop log        | QR-2026-0034, retained to 2026-08-26         |
| Routed          | No                                           |

The case is closed at the Quiet Room. If the address reappears with local corroboration, the log entry
brings this claim back into view.
