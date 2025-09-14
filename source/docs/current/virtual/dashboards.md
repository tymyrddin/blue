# Dashboards and tracking

For a CNA (CVE Numbering Authority), a dashboard is not merely a visual tool; it is the operational nerve centre of the 
vulnerability disclosure process. From a systems engineering standpoint, it is the primary Human-System Interface (HSI) 
for a complex data pipeline that ingests, processes, and outputs critical security information. Its purpose is to 
provide situational awareness, enable decision-making, and ensure the traceability and auditability of every action 
within the CNA's scope.

## Core purpose and functional requirements

The primary function of the tracking system is to transform raw vulnerability reports into actionable, structured data and to manage their lifecycle. 

The core functional requirements are:

*   Situational awareness & monitoring: To provide a real-time overview of the entire workload, including incoming report volume, workload distribution across analysts, and overall processing latency.
*   Progress tracking & state management: To track the status of each case through a defined workflow (e.g., `Received` → `Triaged` → `Vendor Notified` → `CVE ID Assigned` → `Public Disclosure`).
*   Prioritisation & resource allocation: To automatically identify and flag cases requiring immediate attention based on key metrics such as calculated severity (e.g., CVSS score), affected system prevalence, and evidence of active exploitation.
*   Coordination facilitation: To serve as the single source of truth for analyst-to-analyst handovers and for tracking communications with external entities, such as vendors or researchers.

## System architecture and data flow

The dashboard is the front-end for an underlying data processing system. Its architecture must be designed for integrity and reliability.

*   Data ingestion layer: The point where reports enter the system. This can be through automated feeds (e.g., encrypted email parsers, API integrations with partner platforms) or manual entry. All ingestion channels must log a receipt confirmation.
*   Data processing & normalisation layer: Incoming data is parsed and structured into consistent fields (e.g., `Affected Product`, `Version`, `Vulnerability Type`, `Reporter PGP Key`). This ensures all cases are evaluated against identical criteria.
*   Data storage & schema: The heart of the system is a structured database. Each case must be a unique object with a full audit trail, logging every state change, note added, and email sent, along with timestamps and the analyst responsible.
*   Presentation & analytics layer (The Dashboard): This layer consumes the normalised data to present visualisations—such as queues, timelines, and priority charts—that are updated in near-real-time.

## Key tooling considerations

The selection and implementation of tools must meet the stringent requirements of a CNA's mission.

*   [TheHive Project or DFIR-IRIS](thehive-vs-dfir-iris.md): Security Incident Response Platforms designed for case management and collaboration. Customisable workflows and integrated analytics make it highly suitable for tracking vulnerability disclosure cases from initiation to closure.
*   [MISP (Malware Information Sharing Platform & Threat Sharing)](https://www.misp-project.org/): While renowned for threat intelligence sharing, MISP's core functionality is built around storing and correlating indicators of compromise and can be adapted to structure and share vulnerability information, especially concerning widespread campaigns.
*   [ELK or OpenSearch stack](elk-vs-open-search.md): These stacks can be engineered to ingest all case data, enabling the creation of highly customised, complex dashboards in Kibana for deep analysis and reporting.

## Operational best practices

Engineering the system correctly is only half the solution; it must be governed by robust operational procedures.

*   Standardised taxonomies and workflows: Implement and enforce consistent definitions for statuses, severity levels, and tags (e.g., `awaiting-vendor-response`, `requires-cve-id`). This ensures analytical consistency regardless of which analyst handles the case.
*   Configurable alerting and filtering: The system must proactively surface work based on rules. High-severity cases should be promoted to a dedicated queue, and cases stagnating in a state (e.g., `vendor-notified` for 14 days) should trigger alerts for follow-up.
*   Maintain a full audit trail: The principle of traceability is paramount. Every modification to a case record—every status change, edited field, or added comment—must be immutably logged with a user identifier and timestamp. This is critical for post-incident reviews and handling disputes.
*   Role-based access control (RBAC): Access to the dashboard and underlying data must be granular. Analysts may have edit rights, while external partners may have a restricted view of only their relevant cases.
