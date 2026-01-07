# Principles

Define the ethical and methodological constraints governing fingerprint generation and handling in the Fingerprint Forge. These principles are mandatory operational rules, not guidelines.

## Offline derivation

All fingerprints must be derived from safe, offline artefacts.

* Sources include firmware images, network captures, protocol traces, and mirrors.
* Artefacts from live systems, production infrastructure, or externally reachable devices must never be used.
* Every fingerprint must be reproducible in a controlled, offline environment.

If it cannot be derived offline, it does not belong in the Forge.

## Passive detection only

The Forge performs observation, correlation, and normalisation, never active exploitation.

* No scanning, probing, or remote interaction is permitted.
* Fingerprints capture behaviour, structure, or metadata visible without touching a live system.
* Unsafe or ambiguous artefacts are documented but never deployed in any detection system.

## Traceability and provenance

Every fingerprint is fully traceable to its source, the Obsidian Desk, or other verified artefact repositories.

* Each artefact must be logged with acquisition method, original format, and version.
* Transformations applied during fingerprint derivation must be documented in detail.
* Confidence levels (observed, inferred, correlated) must be recorded explicitly.

Traceability ensures that every correlation or identifier produced by the Forge is verifiable and reproducible.

## Internal operational notes and guidelines

The Forge imposes strict process constraints to prevent misuse or error.

* All data ingestion is passive or derived from offline artefacts.
* Artefacts are preserved in their original form; all transformations are documented.
* Fingerprints are versioned and tracked over time.
* No fingerprint is considered stable until validated across multiple sources.

The Forge produces hypotheses, correlations, and identifiers, not attribution claims.

## Relationship to Anvil

The Fingerprint Forge operates in a defined workflow with Anvil:

* Anvil extracts artefacts.
* Fingerprint Forge correlates, normalises, and stabilises them.
* Any step requiring execution, emulation, or live interaction belongs upstream or downstream, not in the Forge.

If a fingerprint cannot be justified without touching a live system, it does not belong in the Forge.

## TL;DR

1. Derive fingerprints offline.
2. Observe passively; never exploit.
3. Record provenance and transformations.
4. Mark unsafe or ambiguous artefacts explicitly.
5. Produce stable, verifiable identifiers for downstream use.

The Forge is a controlled environment for understanding, not interacting with, industrial systems. It is where raw artefacts become structured, trustworthy fingerprints.
