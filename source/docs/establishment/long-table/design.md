# Stack design and data flows

What the Long Table does is described in the overview. This page records the decisions needed to build
the repository that implements it.

## Domain

The Long Table processes network observables. Inputs are classified signals from the Quiet Room:
Suricata alerts, Zeek connection and DNS metadata, selective Wazuh telemetry. Enrichment needs are
different from the Watch Tower's. CVE databases and CISA KEV are not relevant here. The Watch Tower
handles those.

What is relevant:

- Passive DNS: resolve domain history, track infrastructure reuse across campaigns
- IP prefix and BGP data: attribution to network operator and geographic region
- Certificate transparency: TLS certificate history for domains and IP addresses
- File hash reputation: for samples extracted by Zeek or submitted via the Receiving Desk

## Tool constraints

European tools preferred. Dependencies on large commercial platforms to be minimised.

MISP (CIRCL, Luxembourg) is the natural base. Government-funded, community-oriented, not commercially
pressured. Already in use in the Watch Tower. The question is whether MISP's native relationship and
correlation features are sufficient for actor attribution and campaign tracking, or whether a separate
relationship layer is needed.

Shuffle is already in misp-otics-lab. Natural choice for orchestration and enrichment workflows.

OpenCTI (Filigran, France) is European but VC-backed with growing commercial direction. It provides
relationship graph and actor mapping that MISP does not handle as well natively. Decision required:
is that dependency acceptable, or can MISP galaxies and event correlation cover the requirement at
the expected event volume?

## Enrichment sources

RIPE NCC (Amsterdam): prefix, ASN, and WHOIS data. Genuinely European, not commercial.

CIRCL passive DNS (Luxembourg): same organisation as MISP. Available to MISP community members.

crt.sh: certificate transparency search. Data is public. Operated by Sectigo; the dataset is
independent of any single vendor.

## Signal delivery

Classified signals arrive from the Quiet Room as MISP events. Sharing groups govern access: the Long
Table sharing group receives material at reliability 3 or above. Classification metadata (source taxonomy,
reliability level) is stored as MISP event tags and is available for filtering at intake.

Material below the threshold does not reach the Long Table. It remains in the Quiet Room's drop log for
90 days, available for retrospective analysis but not routed in the normal course of operations.

## Open decisions

MISP alone or MISP + OpenCTI? MISP galaxies cover threat actor taxonomy. MISP objects and event
relationships cover infrastructure mapping. The gap is graph visualisation and relationship traversal
at scale. If event volume stays modest, MISP may be sufficient without a separate relationship layer.

Does the Long Table sync with the Watch Tower? If yes, what sharing group rules govern what
crosses the institutional boundary between the Office and the Establishment? The Watch Tower runs on
the Office's infrastructure. The Long Table runs on the Establishment's. These are not the same network.
