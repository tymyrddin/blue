# CNA-relevant insights

A ddistilled view of what can be learned from the imaginative reverse-engineered validations of the four CVEs 
([Wolfbox EV chargers](wolfbox-cluster.md), [Level-2 EV charger firmware](micro-scada-x.md), 
[Hitachi ICCP stack](micro-scada.md), and [IH-IN-16A-S smart plugs)](haat-smartplug.md). 

## Lab infrastructure is central

Across all validations, a consistent pattern emerges: segregated, controlled lab environments are essential. VLANs, SPAN ports, air-gapped networks, and dedicated PCs/SBCs allow deterministic observation without contaminating production systems.

The CNA lab is not optional theatre; it is the backbone of reliable PoC validation. Setting up isolation and mirroring early avoids scrambling mid-investigation when devices crash or misbehave.

## Deterministic baseline collection matters

All CVE validations emphasised firmware hashing, passive captures, serial logs, and endpoint enumeration before active testing.

Establishing reproducible baselines ensures that any observed behaviour (crash, reboot, malformed response) can be clearly attributed to the test action and not a prior unknown state.

## Incremental and bounded testing

Each validation avoided aggressive fuzzing as a first step. Incremental, controlled interactions were preferred:

* Observing auth/session flows
* Low-intensity parsing fuzzing
* Stepwise replay of advisory-informed sequences

Incremental validation reduces risk of bricking devices, maintains evidentiary integrity, and makes the PoC reproducible. Aggressive fuzzing is a later stage, not the first.

## Emulation versus hardware

There is a recurring trade-off:

* Emulation: Fast iteration, safe from mains power or watchdog interference, useful for initial static analysis and minor repros.
* Hardware: Needed for timing-sensitive or power-sensitive crashes, watchdog resets, and real-world interactions.

CNAs must plan validation in two stages: first emulation for speed and safety, then hardware for confirmation.

## Evidence-centric workflow

Every validation shows a rigorous approach to logging, naming, versioning, and repository control. Each artefact (pcap, firmware, console log) is timestamped, checksummed, and stored in a traceable hierarchy.

The CNA role is as much about defensible evidence as it is about finding faults. Reproducible capture is more valuable than exploit execution.

## Decision points define workflow flexibility

Across CVEs, the following choices appeared frequently:

* Depth of static analysis
* Stubbed services vs. live cloud dependencies
* Aggressive vs. conservative active probing
* VM isolation of analysis tools
* Choice of hardware or emulation

Every validation requires documented forks. Understanding alternative paths prepares a CNA to respond when environment or access limitations change.

## Patterns in attack surfaces

By observing these CVEs:

* Edge devices (chargers, plugs, meters) often fail in parsing routines or session/auth handling.
* ICS protocols (ICCP, DNP3, Modbus) fail in input validation and timestamp handling.
* Home IoT often fails in weak authentication and cloud dependency assumptions.

These patterns inform future PoC scope, device selection, and mitigation priorities. CNAs can focus lab validation on these recurring weak points.

## Conservative reproducibility over exploit demonstration

All observed PoC paths favour observation and documentation over executing live attacks, particularly where vendor coordination or regulatory obligations exist.

CNA validation is about proving behaviour safely, not producing working exploits. The metric is reproducible evidence, not the power of the exploit itself.

## TL;DR

1. Lab isolation and infrastructure discipline are non-negotiable.
2. Baseline capture + incremental testing = reproducibility.
3. Emulation accelerates, hardware confirms.
4. Evidence handling dominates workflow.
5. Decision points and alternatives must be mapped.
6. Recurring vulnerabilities cluster in parsing, authentication, and timestamp handling.
7. Safe observation trumps exploit execution.
