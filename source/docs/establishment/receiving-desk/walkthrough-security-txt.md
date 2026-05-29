# Standard submission, unvetted researcher

![Security text on onion](/_static/images/receiving-desk-txt.png)

A standard submission arrives via the security.txt contact address. The researcher is
identified but not on the vetting register. The finding is single-category.
This walkthrough follows one case from receipt to routing.

## The submission

An unencrypted email arrives at the address published in `security.txt`. No PGP. The sender
is identifiable by address and signs with a name.

```
To:      security@desk.establishment.internal
From:    j.marsh@independentresearch.net
Subject: Vulnerability report: Siemens S7-1200 exposed at city infrastructure IP

I found a Siemens S7-1200 PLC running firmware v4.1 at 185.44.23.107 with port 102
(S7comm) open to the internet. CVE-2019-13945 applies: authentication bypass via a
crafted S7comm packet allows arbitrary read/write to memory areas without credentials.

The IP resolves to a range registered to Ankh-Morpork Municipal Utilities. I did not
attempt to connect or probe beyond banner identification.

I am reporting this because the device controls something and should not be reachable
this way.

J. Marsh
```

## Case record: RD-2026-0048

Receipt:

| Field              | Value                                      |
|--------------------|--------------------------------------------|
| Date of receipt    | 2026-05-28                                 |
| Channel            | security.txt (unencrypted email)           |
| Researcher         | J. Marsh                                   |
| Vetting status     | Not on register                            |
| Acknowledgment due | 2026-05-30 (two working days)              |

### Initial classification

Source taxonomy: Other. J. Marsh is not on the Receiving Desk's researcher register.
First submission from this address.

Reliability: 2. Identified submitter with a verifiable email address, but no track record
and no corroborating data. The CVE is real and applies to the stated firmware version.
The IP is in a range registered to the utility. Neither of these facts requires the
submitter's account to be accurate; they are consistent with it.

Reliability 2 is the appropriate starting point for an unvetted, single-source,
unverified submission that nonetheless contains no obvious inconsistencies.

### Triage determination

The finding describes a specific device at a specific address running vulnerable firmware
in a utility network. This is intelligence: an observable about deployed infrastructure
with a known vulnerability. It routes to the Long Table for correlation against existing
infrastructure knowledge and actor activity.

It is not a signals-layer finding. There is no traffic, no pcap, no observed exploitation.
If the Long Table's correlation work subsequently generates a signals question, that is the
Long Table's routing decision.

Single routing. No split required.

### Vetting note

J. Marsh identified themselves, provided a verifiable contact address, described the
method (banner identification only, no active probing), and reported to the correct
channel. The submission follows responsible disclosure practice.

If the finding is confirmed by the Long Table, the vetting question is worth raising:
whether J. Marsh warrants basic vetting and entry to the register. That is not a
Receiving Desk determination. Flagged in the case record for follow-up.

## Routing

### Long Table (RD-2026-0048)

The finding is passed to the Long Table with the reliability classification (Other, 2)
and the source taxonomy attached. The Long Table receives: CVE identifier, affected
product and version, IP address, registered operator, method of identification, and
the vetting note.

The Long Table is advised that independent corroboration would lift the reliability
score. Whether to seek corroboration is the Long Table's operational decision.

## Researcher notification

Acknowledgement sent to J. Marsh on 2026-05-28:

```
Subject: RE: Vulnerability report: Siemens S7-1200 exposed at city infrastructure IP

Receipt confirmed. Case reference: RD-2026-0048.
Triage determination due by 2026-06-09.
Escalation status due by 2026-06-27.

The Receiving Desk does not confirm routing decisions or downstream handling.
```

## Case record status after routing

| Field                   | Value                                    |
|-------------------------|------------------------------------------|
| Status                  | Routed, open                             |
| Routes to               | Long Table                               |
| Acknowledgment sent     | 2026-05-28                               |
| Triage determination by | 2026-06-09                               |
| Escalation status by    | 2026-06-27                               |
| Researcher              | J. Marsh (unencrypted email, no vetting) |
| Vetting flag            | Raised, pending Long Table confirmation  |

The case remains open until the Long Table records a determination. The vetting flag
is a note, not an action. No contact is made with J. Marsh beyond the acknowledgement
unless the escalation status requires it.
