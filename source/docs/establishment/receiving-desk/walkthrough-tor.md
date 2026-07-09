# Anonymous submission, reliability ceiling

![Globaleaks onion](/_static/images/receiving-desk-globaleaks.png)

A submission arrives via the Tor onion service. No researcher identity. No contact address.
The intake log records the channel and the date. Nothing else about the origin is recorded,
because the channel is not designed to record it.
This walkthrough follows one case from receipt to routing.

## The submission

A message arrives through the onion service. The submission form accepts plain text.
No metadata beyond timestamp is retained.

```
I work at a company that does infrastructure maintenance for several city districts.
My employer was contracted to install network equipment at three water treatment sites
last quarter. The equipment was not new. I recognised the model: Acme Industrial
Gateway v2.3.1. I looked it up afterward. CVE-2026-4471.

I do not know if the devices are exposed externally. I was not hired to find that out.
I am telling you because nobody else will.

No name. No contact.
```

## Case record: RD-2026-0049

Receipt:

| Field              | Value                                 |
|--------------------|---------------------------------------|
| Date of receipt    | 2026-05-28                            |
| Channel            | Tor onion service                     |
| Researcher         | Not recorded                          |
| Vetting status     | Not applicable                        |
| Acknowledgment     | Via onion service only                |

### Initial classification

Source taxonomy: Other. The channel does not permit source identification.

Reliability: 2. This is the ceiling for anonymous material without corroboration.
The submission is internally consistent. The CVE reference is accurate. The claim
of insider knowledge is plausible and not verifiable. None of that changes the ceiling.
Reliability 2 reflects the channel, not a judgement about the submitter.

The submission gains significance when placed alongside RD-2026-0047-A, currently in
the Long Table pipeline: the same CVE, the same product, the same target sector, from
an independent and uncorrelated source. That correlation is the Long Table's to make,
not the Receiving Desk's. The note is flagged.

### Triage determination

The submission describes specific deployments of vulnerable firmware at known
infrastructure sites. Intelligence layer. Routes to the Long Table.

No signals material is present. No pcap, no traffic observations, no IP addresses.
Single routing.

### Correlation note

The CVE and product in this submission match RD-2026-0047-A, currently open in the
Long Table pipeline. The Receiving Desk notes the overlap. Whether the two cases
warrant correlation and what that does to the reliability score is the Long Table's
determination. Flagged in the routing note.

## Routing

### Long Table (RD-2026-0049)

The submission is passed to the Long Table with the reliability classification
(Other, 2, anonymous channel) and the correlation note referencing RD-2026-0047-A.

The Long Table receives: CVE identifier, product and version, sector (water treatment,
city districts), and the note that the submitter claimed direct knowledge of the
installation. No contact details. No researcher record.

## Submitter notification

A case reference is posted to the onion service submission endpoint:

```
Case reference: RD-2026-0049.
No further contact will be initiated from this desk.
The reference may be used to follow up via this service.
```

No email. No timeline commitments. The anonymous channel does not carry the identified
submitter timeline. The reference is the only record of the transaction.

## Case record status after routing

| Field        | Value                                               |
|--------------|-----------------------------------------------------|
| Status       | Routed, open                                        |
| Routes to    | Long Table                                          |
| Reference    | Posted to onion service                             |
| Researcher   | Not recorded                                        |
| Correlation  | Flagged: overlaps RD-2026-0047-A (Long Table)       |

The case remains open until the Long Table records a determination. The Receiving Desk
has no further contact with the submitter unless they return via the onion service with
the case reference. If they do, the response goes through the same channel.
Last updated: 29 May 2026
