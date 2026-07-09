# Offline firmware scanning with verified chain of custody

The Sceptical Engine is the Society's tooling arm. It builds and maintains the instruments the Anvil's
research requires and that the Society's disclosure work depends on. The principal instrument is
[vulnforge](https://github.com/tymyrddin/vulnforge).

The name is literal. The Engine is sceptical: of the AI model's proposed findings, of its own confidence
scores, of unverified outputs from any stage in the pipeline. It was named after the design principle
rather than despite it.

## Why the Society built it

The Society's firmware research requires scanning and analysing material that is sensitive: firmware from
industrial control systems, embedded devices in critical infrastructure, platforms where a data leak during
analysis would constitute a second vulnerability. Off-the-shelf scanners either require network connectivity
to function, send data to vendor infrastructure for processing, or produce findings that cannot be verified
independently of the tool that generated them.

None of these properties are acceptable for the Society's work. A scanner that phones home while analysing
sensitive firmware is not a tool for responsible disclosure. It is an exposure.

The Society needed a scanner that ran offline, used local models, kept everything on the host, and produced
a chain of custody that a responsible disclosure report could be built from. Nothing available did all of
these things. The Sceptical Engine built one.

## The design principle

The model is not the system. vulnforge treats the AI model as one subsystem among several, with a defined
role and defined limits. The model proposes candidate vulnerabilities. It does not confirm them, severity-
rate them, or pass them directly to the output stage.

Confirmation is the sandbox's job. The sandbox executes relevant code in an isolated environment and
observes actual behaviour. If observed behaviour is consistent with the model's proposal, the finding is
confirmed. If not, it is not, regardless of how confident the model appeared.

Every step from ingestion to verdict is recorded in a tamper-evident audit log. The log cannot be edited
without the edit being visible. The chain of custody from initial scan to disclosure report is complete and
verifiable.

This is the Society's research ethos expressed as engineering: do not trust the model, check the code,
document everything.

## What it produces

vulnforge produces finding records: the proposed vulnerability, the verification result, the evidence from
sandbox execution, and the full audit trail. These records are the evidentiary basis for disclosure reports.
A finding accompanied by a tamper-evident chain of custody from initial analysis through verified
confirmation is a case. A finding without that chain is a claim.

The Sceptical Engine produces cases.

## Relationship with the Anvil

The Anvil extracts firmware artefacts. The Sceptical Engine processes code and binary components pulled from
those artefacts through a verification pipeline. The two projects work in sequence: the Anvil produces the
material, the Engine produces the findings, the disclosure process handles both. Findings from the Engine
also feed the Watch Tower's intelligence pipeline, where they are enriched with threat context and scored
against known exploitation data.

The Society does not route findings to the Watch Tower directly. The Office receives Society disclosures as
one recipient among many, alongside vendors and CSIRTs. What happens after that is not in the Society's
documentation.
Last updated: 29 May 2026
