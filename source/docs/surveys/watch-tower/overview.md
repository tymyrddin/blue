# Firmware vulnerability intelligence

Watch Tower does not look for threats.

That distinction is not a limitation. The Lamplighter looks for threats. The Establishment's Quiet Room
responds to them. Watch Tower's role is different: it takes findings that have already been made, enriches
them with threat context, scores them against what is known to be actively exploited, and produces
intelligence that tells the Office whether a vulnerability is theoretical or immediately relevant.

The difference between those two things is the difference between a fire risk and a fire.

## What it is

Watch Tower is an intelligence platform for industrial control systems and embedded infrastructure. It
ingests firmware vulnerability findings and runs them through a pipeline that cross-references known
exploitation campaigns, CVE severity data, and live exploitation probability scores. By the time a finding
reaches an analyst, it carries enough context to support a decision.

The platform is built around [MISP](https://github.com/MISP/MISP/releases) with
[Shuffle](https://github.com/shuffle/shuffle) handling orchestration. It runs on the Office's own
infrastructure. CVE enrichment queries cve.circl.lu via MISP modules; triage checks CISA KEV and EPSS
externally. Findings themselves do not leave the local stack.

## Why OT and embedded systems

Industrial control systems and embedded devices share a characteristic that makes them particularly
relevant to the Office: they are long-lived, frequently unmonitored, and almost never updated. A
vulnerability in a device deployed in 2018 is still a vulnerability in 2026. If it is being actively
exploited, the organisations running those devices may not know.

Watch Tower's focus on OT and embedded firmware reflects the Office's assessment that this class of
system represents both a significant exposure and a significant blind spot for the city's critical
infrastructure.

## Pipeline at a glance

Findings arrive as structured data. Shuffle creates a MISP event for each finding, enriches it with CVE
data from CIRCL, checks it against CISA's Known Exploited Vulnerabilities catalogue, and scores it using
EPSS exploitation probability. An analyst reviews the enriched event and makes a determination.

The platform does not make decisions. It produces scored, contextualised intelligence and puts it in front
of a person who does.

## Relationship with the Anvil

Watch Tower and the Civil Observers' Society's Anvil project operate in the same territory from different
directions. The Anvil extracts firmware artefacts and builds fingerprints. Watch Tower takes those findings
and places them in threat context. Neither body formally reports to the other. The information moves anyway,
because both sides find the exchange useful.

The Office does not describe this relationship in writing.
Last updated: 29 May 2026
