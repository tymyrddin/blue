# Principles

Purpose: Reinforce ethics and methodology for research conducted within Anvil. These principles are not aspirational. They are operational constraints.

## All research is offline and reproducible

All analysis is performed in isolated environments with no dependency on live networks, vendor services, or external infrastructure.

* Targets are firmware images, binaries, documentation, traffic captures, or simulated devices.
* Network access is disabled or tightly controlled.
* Any result must be reproducible by another researcher using the same inputs and documented steps.

If it cannot be repeated offline, it does not count as a result. At best, it is a curiosity.

## No live systems are touched or exploited

Anvil does not interact with production systems, customer environments, or internet-exposed devices.

* No scanning, probing, or fingerprinting of live infrastructure.
* No interaction with devices outside a controlled lab or simulator.
* No “just to see what happens” experiments.

If a technique requires touching a live system to validate it, it belongs somewhere else. Anvil is not that place.

## Unsafe instructions are flagged, never executed

Some techniques are inherently destructive, destabilising, or unsafe outside tightly controlled conditions.

* Such techniques may be documented for completeness or defensive awareness.
* They are explicitly marked as unsafe, high-risk, or non-executable.
* Execution steps are not provided where they could be misused.

Anvil documents how things fail, not how to break the real world.

## Documentation is meticulous, with provenance and context

Every artefact, observation, and conclusion must be traceable.

* Sources are recorded, including firmware origin, version, hashes, and acquisition method.
* Assumptions are stated explicitly.
* Observations are separated from interpretation.

Undocumented findings are indistinguishable from guesses. Guesses do not survive handover.

## Handover to the Forge for further processing

Anvil is not the end of the pipeline.

* Outputs are prepared for downstream use in the Forge: artefacts, notes, diagrams, and extracted behaviours.
* Speculation is clearly labelled and separated from verified facts.
* Findings can be reused, challenged, or extended.

If a result cannot be handed over cleanly, it is not finished.

## TL;DR

Anvil is where material is examined, not exploited. Carelessness here poisons everything downstream.
