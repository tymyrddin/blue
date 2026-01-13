# Human encoding correlation logic

Translate understanding of attacks into a structured format that drives monitoring and alerts.

## Purpose

Encoding correlation logic in human-readable rules ensures each correlation:

* Observes the correct events from the right log sources
* Applies events in proper sequence
* Uses only relevant decoded fields
* Remains insulated from irrelevant noise

It bridges the gap between [conceptual detection](human-backbone.md) and operational implementation.

## What encoding defines

Each correlation explicitly specifies:

* Event selection: Which log messages matter
* Sequence and state: Required event order and inter-event relationships
* Field usage: Decoded fields contributing to detection
* Boundaries: Signals or sources explicitly excluded to reduce false positives
* Confidence: Level parameter reflects observation certainty or step progression

This makes rules precise, human-readable, and consistently implementable across environments.

## Multi-stage BGP attack
                                     
[encoded_multi_stage_bgp_attack.xml](https://github.com/ninabarzh/red-lantern-detection/blob/main/wazuh/correlations/encoded_multi_stage_bgp_attack.xml)

* Step 1: BMP announcement observed (level 5)
* Step 2: RPKI validation confirmed (level 7)
* Step 3: Optional router acceptance observed (level 8)
* Step 4: BMP withdrawal observed (level 10)
* Required sources: BMP + RPKI validator logs
* Optional sources: Router syslog for operational acceptance
* Fields: Strictly follow input map (bmp.*, rpki.*, router.*)
* Event correlation: Sequencing enforced via `<event_correlation>`
* Confidence and severity: Reflected in level parameter
* Timeframes: Can be defined per step according to operational context

No enrichment or derived fields are introduced. Detection is purely observable-event-driven.

## ROA poisoning

[encoded_roa_poisoning.xml](https://github.com/ninabarzh/red-lantern-detection/blob/main/wazuh/correlations/encoded_roa_poisoning.xml)

* Step 1: ROA creation observed (level 5)
* Step 2: Multi-validator confirmation (level 7, medium-to-high confidence)
* Optional Step 3: Authentication logs enrich context (level 8)
* Required sources: RPKI validator logs only — no BMP, no router syslog
* Timeframe: Flexible to accommodate asynchronous validator updates

Confidence is explicitly reflected via rule levels.

## RPKI cover hijack

[encoded_rpki_cover_hijack.xml](https://github.com/ninabarzh/red-lantern-detection/blob/main/wazuh/correlations/encoded_rpki_cover_hijack.xml)

* Step 1: BMP announcement (announce) triggers correlation (level 5)
* Step 2: RPKI validation confirms trust legitimacy (level 7)
* Step 3: Optional withdrawal completes correlation, raising alert confidence (level 8)
* Required sources: BMP + RPKI validator logs
* Optional sources: Historical ROA changes
* Router syslog: Not required; optional for context only
* Timeframes: Asymmetric to allow delayed withdrawals or validator reporting

## Benefits

* Aligns detection intent with operational implementation
* Provides a reference for testing with synthetic or historical events
* Serves as documentation for analysts and developers
* Ensures traceable, auditable correlation outcomes
* Boundaries prevent false positives in operational monitoring

## Relationship to other artefacts

* [Correlation input map](https://github.com/ninabarzh/red-lantern-detection/blob/main/correlations/correlation-input-map.md): Defines log sources, decoders, and fields feeding each correlation
* [Detection rules](https://github.com/ninabarzh/red-lantern-detection/tree/main/wazuh): Implements the human-readable logic
* [Signals and temporal considerations](human-backbone.md): Provides observables, limits, and attack context

This approach ensures detection is consistent, traceable, and grounded in observable network events and trust signals.
