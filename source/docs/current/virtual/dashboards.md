# Dashboards and tracking

The dashboard is the operational nerve centre of the vulnerability disclosure process. From a systems engineering standpoint, it is the primary Human-System Interface (HSI) for a complex data pipeline that ingests, processes, and outputs critical security information. Its purpose is to provide situational awareness, enable decision-making, and ensure the traceability and auditability of every action within scope.

## Core purpose and functional requirements

The primary function of the tracking system is to transform raw vulnerability reports into actionable, structured data and to manage their lifecycle.

The core functional requirements are:

* Situational awareness & monitoring: To provide a real-time overview of the entire workload, including incoming report volume, workload distribution across analysts, and overall processing latency.
* Progress tracking & state management: To track the status of each case through a defined workflow (e.g., `Received` → `Triaged` → `Vendor Notified` → `CVE ID Assigned` → `Public Disclosure`).
* Prioritisation & resource allocation: To automatically identify and flag cases requiring immediate attention based on key metrics such as calculated severity (for example [CVSS scoring, v3.1 or v4.0](https://www.first.org/cvss/)), affected system prevalence, and evidence of active exploitation.
* Coordination facilitation: To serve as the single source of truth for analyst-to-analyst handovers and for tracking communications with external entities, such as vendors or researchers.

## System architecture and data flow

The dashboard is the front-end for an underlying data processing system. Its architecture must be designed for integrity and reliability.

* Data ingestion layer: The point where reports enter the system. This can be through automated feeds (e.g., encrypted email parsers, API integrations with partner platforms) or manual entry. All ingestion channels must log a receipt confirmation.
* Data processing & normalisation layer: Incoming data is parsed and structured into consistent fields (e.g., `Affected Product`, `Version`, `Vulnerability Type`, `Reporter PGP Key`). This ensures all cases are evaluated against identical criteria.
* Data storage & schema: The heart of the system is a structured database. Each case must be a unique object with a full audit trail, logging every state change, note added, and email sent, along with timestamps and the analyst responsible.
* Presentation & analytics layer (The Dashboard): This layer consumes the normalised data to present visualisations—such as queues, timelines, and priority charts—that are updated in near-real-time.

## Key tooling considerations

The selection and implementation of tools must meet the stringent requirements of a CNA's mission.

* [TheHive Project or DFIR-IRIS](thehive-vs-dfir-iris.md): Security Incident Response Platforms designed for case management and collaboration. Customisable workflows and integrated analytics make them highly suitable for tracking vulnerability disclosure cases from initiation to closure.
* [MISP (Malware Information Sharing Platform & Threat Sharing)](https://www.misp-project.org/): While renowned for threat intelligence sharing, MISP's core functionality is built around storing and correlating indicators of compromise.
* [ELK or OpenSearch stack](elk-vs-open-search.md): These stacks can be engineered to ingest all case data, enabling the creation of highly customised, complex dashboards in Kibana or OpenSearch Dashboards. Important licensing note: since 2021, Elastic components are under [Elastic License v2 / SSPL](https://www.elastic.co/licensing/elastic-license) while [OpenSearch remains Apache 2.0](https://opensearch.org/downloads/). Assess licensing, feature parity, and compatibility before committing.

## Operational best practices

Engineering the system correctly is only half the solution; it must be governed by robust operational procedures.

* Standardised taxonomies and workflows: Implement and enforce consistent definitions for statuses, severity levels, and tags (e.g., `awaiting-vendor-response`, `requires-cve-id`). This ensures analytical consistency regardless of which analyst handles the case.
* Configurable alerting and filtering: The system must proactively surface work based on rules. High-severity cases should be promoted to a dedicated queue, and cases stagnating in a state (e.g., `vendor-notified` for 14 days) should trigger alerts for follow-up.
* Maintain a full audit trail: The principle of traceability is paramount. Every modification to a case record—every status change, edited field, or added comment—must be immutably logged with a user identifier and timestamp. This is critical for post-incident reviews and handling disputes.
* Role-based access control (RBAC): Access to the dashboard and underlying data must be granular. Analysts may have edit rights, while external partners may have a restricted view of only their relevant cases.
* Retention and evidence storage: Raw captures, firmware images, and signed hashes should be retained in write-once storage with lifecycle policies. Keep audit trails for at least the period mandated by local regulation (for example, [NIS2 requires incident reporting and evidence retention](https://www.nis2-cyber.com/incident-reporting)).
* Operational metrics: Define and track measurable indicators such as mean triage time, evidence completeness, and coordination cycles with vendors. These metrics ensure dashboards are not only visual but also decision-support tools.

## NIS2 evidence checklist

| Evidence item                                                   | Why required under NIS2 / EU law                                                                                          | Where to store / how to label                                                                                              |
|-----------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Report receipt confirmation                                     | NIS2 requires logging of when an incident (vulnerability) is first reported.                                              | Label: `report_receipt_<case_id>_<timestamp>`. Store in case record; retain for full incident life.                        |
| Reporter metadata (name / organisation; anonymised if required) | Needed to assess threat, potential liability and for communicating with vendor or national CSIRT. Comply with GDPR.       | Stored under `reporter_<case_id>`; pseudonymise if data contains personal identifiers.                                     |
| Firmware / software version + SHA-256 hash                      | To verify exactly which version is affected — necessary for repeatability and patch verification.                         | Label: `firmwarehash_<device>_<version>_<sha256>`. In evidence repository with restricted access.                          |
| Baseline capture (network / serial / other relevant telemetry)  | Provides reference state baseline; essential for determining abnormal behaviour.                                          | Label: `baseline_<case_id>_<timestamp>`. Stored in write-once storage.                                                     |
| Trigger / proof capture (PCAPs, serial logs, etc.)              | Shows the behaviour that constitutes the vulnerability. Needed for vendor / regulator.                                    | Label: `trigger_<case_id>_<event>_<timestamp>`. Keep raw and decoded forms.                                                |
| Console / serial debug logs                                     | May show internal error messages, crashing routines, or resource exhaustion. Helps to distinguish DoS vs full compromise. | Label: `serialconsole_<case_id>_<timestamp>`. Secure storage.                                                              |
| Change logs / status updates                                    | To show what steps CNA took: vendor contact, mitigation tracking; this is part of auditability.                           | Label: `status_<case_id>_<step>_<timestamp>`. Logged in case history.                                                      |
| Vendor / researcher correspondence logs                         | Required to prove communication and coordination — often requested by CSIRTs/regulators.                                  | Label: `comm_vendor_<case_id>_<timestamp>`. Secure, access-controlled storage.                                             |
| Patch / mitigation evidence                                     | To demonstrate that the vulnerability has been addressed under your test conditions. Essential for closing case.          | Label: `patchtest_<case_id>_pre_post_<timestamp>`. Include firmware version, captured behaviour pre- and post- mitigation. |
| Chain-of-custody statement                                      | NIS2 & ENISA expect evidence to be handled in a traceable manner; who handled what, when.                                 | Label: `custody_<case_id>_<timestamp>`. Signed or logged.                                                                  |

Aim to have the minimal evidence packet assembled within 72 hours of initial report if required under NIS2 (depending on national implementation). Failing that, at least confirm which items are pending, and timeline for completion.
