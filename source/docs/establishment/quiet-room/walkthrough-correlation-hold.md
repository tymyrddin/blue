# Signals intake, correlation hold

Some material is worth nothing alone and something in combination. Two sensor events, neither routable on
its own, can describe a pattern that neither describes separately. The Quiet Room holds sub-threshold
material for exactly this reason. This walkthrough follows two events that arrive low and leave together.

## The material

On 2026-05-28 two events touch the same address within minutes of each other.

A Suricata alert:

- Rule: outbound connection to a flagged scanning signature
- Source IP: 198.51.100.23 (internal host on a monitored segment)
- Destination: external, low-reputation range
- Alert time: 2026-05-28

A Zeek DNS log:

- Host: 198.51.100.23
- Query: a newly registered domain resembling a city payroll service
- Response: resolved to the same external range
- Time: 2026-05-28, four minutes before the Suricata alert

Each on its own is a reliability 2 event. A single scanning-signature alert is noise the perimeter
produces all day. A single DNS query to a new domain is not, by itself, an incident. Neither crosses the
routing threshold. Apart, both would be held or dropped.

## Case records: QR-2026-0033

The two events are ingested separately and correlated on the shared host and the shared external range.

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| Date of receipt | 2026-05-28                                    |
| Sources         | Quiet Room sensors (Suricata, Zeek)           |
| Origin          | Automated, no human source                    |
| Correlation     | Shared internal host, shared external range   |

### Why the combination changes the picture

A scanning alert says a host reached out to somewhere it should not have. A DNS query to a freshly
registered look-alike of a city payroll service says the host was steered there. Together they describe an
internal host that resolved a deceptive domain and then connected outbound to the range it resolved to,
within the same five minutes. That is not the shape of background noise. It is the shape of a host that
followed a lure.

The overview describes this as the case where a Zeek log and a Suricata alert from overlapping
infrastructure on the same day produce a different picture combined than either produces alone. This is
that case.

### Analyst review

The correlation raises the combined material toward the routing threshold, which is the point at which an
analyst is required. The analyst reviews both events.

The shared host is confirmed as a single internal address on a monitored segment. The external range is
confirmed low-reputation. The domain is confirmed newly registered and confirmed to resemble a real city
service. The ordering holds: the DNS resolution precedes the outbound connection. The analyst does not
determine whether the host is compromised, who registered the domain, or whether payroll data was the
objective. Those are Long Table questions. The analyst confirms the correlation is real and the combined
reliability supports routing.

Combined classification: reliability 3, routed. Source taxonomy: Other. The events were sensor-origin and
neither came from a named source.

## MISP record

A single MISP event is created for QR-2026-0033, with both observations as attributes.

Tags: `Quiet-Room`, `Other`, `reliability="3"`, `tlp:amber`

`tlp:amber` because the internal host sits on a monitored operational segment, which the analyst
confirmed. The combination, unlike either part, concerns named infrastructure.

Attributes:

| Type       | Value                          | Note                                 |
|------------|--------------------------------|--------------------------------------|
| ip-src     | 198.51.100.23                  | internal host                        |
| domain     | (look-alike payroll domain)    | newly registered, deceptive          |
| datetime   | 2026-05-28                     | DNS resolution, then outbound        |
| text       | QR-2026-0033                   | internal reference                   |

The two source events are attached. The Quiet Room records the sequence; it does not expand the DNS or
connection content into a timeline. That is the Long Table's decision.

## What the Quiet Room does not do

It does not route either event on its own. Neither crossed the threshold alone, and the correlation is
recorded as the reason the combined material did, not retrofitted onto either part.

It does not investigate the internal host. An address that followed a lure may warrant a look at the
endpoint. The Quiet Room passes that observation upward and does not act on it.

It does not attribute the domain registration or the external range. Whether this is one actor, a
commodity kit, or coincidence is not characterised here.

## Case record status

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| Status          | Correlated, routed to Long Table                 |
| MISP event      | QR-2026-0033 (tlp:amber, reliability 3)         |
| Basis           | Two reliability 2 sensor events, correlated      |
| Analyst review  | Completed 2026-05-28                             |

The combination is routed. Either event alone would have been held or dropped.
