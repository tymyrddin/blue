# Ticketing and workflow tools

From a systems engineering standpoint, the ticketing system is the central orchestrator of the CNA's operational 
Vulnerability Disclosure Lifecycle. It is the platform that transforms an ad-hoc stream of vulnerability reports into a structured, 
measurable, and auditable workflow. Its primary function is to ensure that every report is processed with 
consistency, accountability, and traceability from initial receipt through to CVE assignment and public disclosure.

## Core purpose and functional requirements

The ticketing system acts as the system of record, designed to fulfil several critical requirements:

*   Process standardisation and enforcement: To provide a definitive, structured workflow that guides every vulnerability case through a series of validated states (e.g., `Triage` → `Validation` → `Vendor Coordination` → `CVE ID Assignment` → `Publication`), ensuring no critical step is missed.
*   Audit trail and compliance: To maintain an immutable, timestamped record of every action taken, every piece of evidence added, and every communication sent. This is non-negotiable for internal reviews, dispute resolution, and demonstrating compliance with disclosure policies.
*   Resource coordination and assignment: To clearly assign ownership of tasks and cases to specific analysts, preventing work duplication and ensuring accountability. The system must provide visibility into team workload and case ageing.
*   Metrics and continuous improvement: To serve as a data source for quantifying key performance indicators (KPIs), such as mean time to triage, time in vendor coordination, and overall throughput, enabling data-driven process refinement.

## System architecture and data flow

The ticketing system is the central hub in the CNA's data architecture, interfacing with multiple other subsystems.

*   Ingestion interface: The point of entry for new reports. This can be a web form, a dedicated email address (with emails automatically converted into tickets), or an API integration with an external platform, ensuring all inputs are captured.
*   Data schema and workflow engine: The core of the system. This defines the mandatory fields (e.g., `CVSS Score`, `Affected Product`, `Reporter Contact`), the permissible state transitions, and the rules that govern them (e.g., a ticket cannot move to `CVE Assigned` without the CVE ID field being populated).
*   Integration layer: The system must interface with other tools, such as sending alerts to a messaging platform on high-priority events, creating commits in a version control system for advisory drafting, or pushing final CVE records to a public website.
*   Storage and archival: All ticket data, including its complete history, must be stored in a resilient database and archived securely at the end of its lifecycle to meet retention policies.

## Key tooling considerations

The choice of platform involves a trade-off between formality, integration capabilities, and overhead.

Git-based issue tracking systems:

*   GitLab Issues / GitHub Issues: These tools are ideal for CNAs with a strong DevSecOps culture. They provide tight integration with code repositories, allowing analysts to easily link tickets to patches, advisories, and other artefacts. Their workflow is typically more lightweight and agile.
*   Trac: An open-source project that integrates a wiki and issue tracking system, with the ability to link tickets directly to version control commits.

Lightweight and custom solutions:

*   Structured Spreadsheets or Internal Databases: While less automated, a well-designed spreadsheet or simple database with enforced field templates can serve as a minimal viable product (MVP) for nascent programmes. This approach requires strict procedural discipline to maintain data integrity and is not recommended for scale.

## Operational best practices

The effectiveness of the tool is contingent upon its disciplined use and governance.

*   Enforce a standardised data schema: Define and mandate the use of consistent fields across all tickets (e.g., `Report ID`, `CVE ID`, `Affected Versions`, `Status`, `Assignee`, `Vendor Status`). This consistency is prerequisite for reliable reporting and analysis.
*   Implement clear Role-Based Access Control (RBAC): Define permissions meticulously. Analysts may have edit rights, vendors may have a restricted view on their specific cases, and auditors may have read-only access to all historical data.
*   Assign unambiguous ownership: Every active ticket must have a single, named individual assigned to it. This eliminates ambiguity and ensures progress is driven forward. Use group inboxes or rotation policies for initial triage to distribute workload fairly.
*   Conduct periodic process reviews: The workflow is not static. Hold regular retrospectives to analyse metrics and refine templates, state definitions, and automation rules to eliminate bottlenecks and improve efficiency. The system itself must be subject to a continuous improvement feedback loop.
