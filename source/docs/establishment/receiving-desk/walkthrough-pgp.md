# Vetted submission, split routing

![PGP key on onion](/_static/images/receiving-desk-pgp.png)

A PGP-encrypted submission arrives. The researcher is known. The finding spans categories.
This walkthrough follows one case from receipt to routing.

## The submission

The desk's monitored inbox receives a PGP-encrypted message. The sender address matches
T. Vanholt, a Society member on the enhanced vetting register. Decryption uses the desk's
private key.

Decrypted content:

```
To:      security@desk.establishment.internal
From:    t.vanholt@civil-observers.internal
Subject: CVD submission: Acme Industrial Gateway v2.3.1

Submission type: coordinated disclosure
CVE: CVE-2026-4471
Product: Acme Industrial Gateway, firmware v2.3.1 and earlier
Vulnerability: Unauthenticated command execution in the update service.
  The update agent passes unsanitised parameters to a shell command via
  the management interface (TCP/8443). No authentication is required.
  CVSS 9.1 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H).
PoC: available, not included in this submission per standard practice.
Disclosure status: private. Vendor notified 2026-04-14. No response to date.
  Ninety-day window closes 2026-07-13.

Additional observation: exploitation traffic consistent with this vulnerability
  has been observed from 94.23.117.8 (AS16276, OVH SAS, FR) since approximately
  2026-04-28. Targets include addresses within the city's water treatment
  signalling subnet (10.44.12.0/24). Traffic pattern attached as pcap
  excerpt (vanholt-CVE-2026-4471-traffic.pcap, PGP-signed separately).

Researcher contact: t.vanholt@civil-observers.internal (PGP, same key)
Society case reference: COS-2026-0091
```

## Case record: RD-2026-0047

Receipt:

| Field              | Value                                        |
|--------------------|----------------------------------------------|
| Date of receipt    | 2026-05-28                                   |
| Channel            | PGP-encrypted email                          |
| Researcher         | T. Vanholt                                   |
| Vetting status     | Enhanced (on register)                       |
| Society reference  | COS-2026-0091                                |
| Acknowledgment due | 2026-05-30 (two working days)                |

### Initial classification

Source taxonomy: Society notification.

Reliability: 4. Vetted researcher with consistent track record. Submission includes CVE
assignment, vendor notification timeline, and corroborating traffic data. Not independently
corroborated yet, which would be required for a 5. Nothing in the submission is inconsistent
with prior Vanholt submissions.

### Triage determination

The submission contains two separable findings:

1. A firmware vulnerability with active exploitation traffic. The intelligence layer, meaning
   who is exploiting it, the infrastructure involved, and the campaign context, belongs to the
   Long Table.

2. Exploitation signals targeting the water treatment subnet. These are network observables:
   source address, pattern, timing, infrastructure. They belong to the Quiet Room regardless
   of whether the vulnerability itself is resolved.

These are not the same finding. They enter different pipelines and produce different products.
Routing them together would collapse the boundary between vulnerability intelligence and signal
analysis. They are split.

Split routing

| Sub-case       | Material                                      | Routes to   |
|----------------|-----------------------------------------------|-------------|
| RD-2026-0047-A | CVE-2026-4471 finding, CVSS, vendor timeline  | Long Table  |
| RD-2026-0047-B | pcap excerpt, source IP, subnet targeting     | Quiet Room  |

Both subcase records carry a cross-reference to the parent and to each other.

## Routing

### Long Table (RD-2026-0047-A)

The firmware finding and vendor notification status are packaged and passed to the Long Table
with the reliability classification (Society notification, 4) and the source taxonomy attached.
The pcap is not included: that travels separately via the Quiet Room path.

The Long Table receives: CVE identifier, affected product and version, CVSS vector, vendor
notification date, ninety-day window close date, and the researcher reference. Sufficient
for correlation against existing intelligence and for the Long Table to determine whether
further actor attribution work is warranted.

### Quiet Room (RD-2026-0047-B)

The pcap excerpt and the source IP observation are passed to the Quiet Room. Source taxonomy:
Society notification. Reliability: 4 at intake, subject to the Quiet Room's own scoring.
The Quiet Room does not receive the firmware finding details unless correlation work
subsequently requires them.

The Quiet Room receives: source IP (94.23.117.8), ASN (AS16276, OVH SAS, FR), target subnet
(10.44.12.0/24), approximate start date (2026-04-28), and the pcap. The routing note flags
that a related firmware vulnerability is in the Long Table pipeline under RD-2026-0047-A.

## Researcher notification

Acknowledgement sent to T. Vanholt on 2026-05-28 via PGP-encrypted reply:

```
Subject: RE: CVD submission: Acme Industrial Gateway v2.3.1

Receipt confirmed. Case reference: RD-2026-0047.
Triage determination due by 2026-06-09.
Escalation status due by 2026-06-27.

The Receiving Desk does not confirm routing decisions or downstream handling.
```

Timeline noted in case record. Triage determination clock starts from date of receipt.

## Case record status after routing

| Field                   | Value                              |
|-------------------------|------------------------------------|
| Status                  | Routed, open                       |
| Sub-cases               | RD-2026-0047-A (Long Table)        |
|                         | RD-2026-0047-B (Quiet Room)        |
| Acknowledgment sent     | 2026-05-28                         |
| Triage determination by | 2026-06-09                         |
| Escalation status by    | 2026-06-27                         |
| Researcher              | T. Vanholt (PGP, enhanced vetting) |

The case remains open until both sub-cases have a determination recorded. The Receiving Desk
does not track what the Long Table or the Quiet Room do with the material. It tracks that the
material was received, classified, and routed, and that the researcher was notified according
to the stated timeline.
