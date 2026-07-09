# Correlation, converging cases

![LT-2026-0007 OpenCTI Case-Incident knowledge graph](/_static/images/walkthrough-correlation.png)

*The convergence: CVE-2026-4471 + 94.23.117.8 + 10.44.12.0/24 + the four input reports, linked; RD-0048 absent.*

The Long Table receives findings and signals from the divisions ahead of it and holds them in one view.
Most of the time a piece of material sits on its own. Occasionally several arrive that describe the same
thing from different directions. This walkthrough follows four inputs that converge on a single CVE and a
single target, and the assessment that results.

## The inputs

By the time the case is opened, four items in the pipeline reference Acme Industrial Gateway v2.3.1 or the
water treatment signalling subnet.

| Reference      | Origin                          | Content                                           | Reliability |
|----------------|---------------------------------|---------------------------------------------------|-------------|
| RD-2026-0047-A | Receiving Desk (T. Vanholt)     | CVE-2026-4471 firmware finding, CVSS 9.1          | 4           |
| QR-2026-0031   | Quiet Room                      | 94.23.117.8 to 10.44.12.0/24, exploitation pcap   | 4           |
| RD-2026-0049   | Receiving Desk (anonymous, Tor) | CVE-2026-4471 reported at water treatment sites   | 2 (ceiling) |
| QR-2026-0032   | Quiet Room (automated sensor)   | Suricata hit on 94.23.117.8, held for correlation | 2           |

RD-2026-0047-A and RD-2026-0049 arrive from the Receiving Desk as vulnerability findings. QR-2026-0031 and
QR-2026-0032 arrive from the Quiet Room sharing group as MISP events. The Receiving Desk findings are
ingested into the relationship graph as reports; the MISP events arrive through the MISP-to-OpenCTI
connector and are mapped as observables. MISP holds the events and their tags; OpenCTI holds the
relationships between them.

## Case record: LT-2026-0007

| Field         | Value                                                    |
|---------------|----------------------------------------------------------|
| Date opened   | Day of correlation                                       |
| Trigger       | Shared infrastructure across two divisions, same CVE     |
| Inputs        | RD-2026-0047-A, QR-2026-0031, RD-2026-0049, QR-2026-0032 |
| Determination | Pending correlation                                      |

## The correlation

The relationship graph resolves to one picture. CVE-2026-4471, unauthenticated command execution in the
Acme Industrial Gateway update service, is being exploited from 94.23.117.8 (AS16276, OVH SAS, FR) against
10.44.12.0/24, the city's water treatment signalling subnet, from approximately 2026-04-28. Four inputs
describe parts of this and the graph links them through the shared CVE, the shared source address, and the
shared target subnet.

### Counting the sources

Four inputs are not four independent sources. RD-2026-0047-A is T. Vanholt's firmware finding.
QR-2026-0031 is the Quiet Room's characterisation of the pcap T. Vanholt submitted alongside it: the two
share a parent, RD-2026-0047, and are one source seen through two pipelines. Counting them as separate
corroboration would manufacture confidence that is not there.

Two genuinely independent lines remain. RD-2026-0049 is an anonymous tip submitted through the Tor portal
by someone who is not T. Vanholt and did not have access to T. Vanholt's submission. QR-2026-0032 is an
automated sensor observation: Suricata saw traffic from 94.23.117.8 without any human reporting it. A
vetted researcher, an anonymous insider, and a perimeter sensor describe the same activity without
reference to each other.

### The reliability ceiling

RD-2026-0049 arrived with a reliability ceiling of 2. Anonymous submissions cannot be raised above that on
their own content, because the source cannot be assessed. The ceiling is a property of the source, not of
the claim.

Correlation changes what can be said about the claim without changing what is known about the source.
The anonymous tip is not more trustworthy than it was; the activity it describes is now independently
supported by a vetted finding and a sensor observation. The Long Table records the corroborated activity
at the higher confidence the corroboration warrants, and notes that RD-2026-0049's own ceiling is
unchanged. The two statements are different and both are kept.

### What does not correlate

RD-2026-0048 (CVE-2019-13945, a Siemens S7-1200 finding) is also open in the pipeline. It does not enter
this assessment. Different product, different vulnerability, no shared infrastructure with the
CVE-2026-4471 cluster. The analyst records that it was considered and set aside. A correlation that
includes everything open is not a correlation.

## The escalation product

LT-2026-0007 leaves the Long Table as a single consolidated assessment:

- The vulnerability: CVE-2026-4471, CVSS 9.1, vendor notified 2026-04-14, ninety-day window closing
  2026-07-13, no vendor response recorded.
- The activity: exploitation traffic from 94.23.117.8 (AS16276) against 10.44.12.0/24 from approximately
  2026-04-28.
- The basis: one vetted Society source, one independent anonymous tip, one automated sensor observation;
  source lineage stated so the corroboration is not overcounted.
- Confidence: high on the activity, with the anonymous input's standing recorded separately.
- Determination: escalate.

The raw findings and the MISP events remain in the store. The consolidated view is what leaves.

## What the Long Table does not do

The Long Table does not decide the response. Whether the water treatment operator is contacted, whether
the Watch is asked to carry anything, whether the vendor window is allowed to run, are determinations made
beyond the Long Table on the assessment it produces. The Long Table establishes what is happening and how
well it is supported. What is done about it is not its function.

## Case record status

| Field         | Value                                                    |
|---------------|----------------------------------------------------------|
| Status        | Escalated as consolidated assessment                     |
| Assessment    | LT-2026-0007                                             |
| Inputs        | RD-2026-0047-A, QR-2026-0031, RD-2026-0049, QR-2026-0032 |
| Set aside     | RD-2026-0048 (non-correlating, different product)        |
| Determination | Escalate; response is determined beyond the Long Table   |

The assessment is escalated beyond the Long Table; the case is not closed with it. The correlation stays
open here, so that further inputs against the same cluster attach to it rather than starting a new one.
Last updated: 31 May 2026
