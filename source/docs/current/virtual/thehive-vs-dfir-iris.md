# TheHive project vs DFIR-IRIS

## Choosing a platform

CVE Numbering Authorities (CNAs) need robust incident response platforms to handle vulnerability reports, assign CVE IDs, and coordinate responsible disclosure. While the exact platform used by the DIVD CNA is not publicly disclosed, we can make an informed guess based on requirements for:

- Case management to track multiple vulnerability reports simultaneously.
- Collaboration features for working with researchers, vendors, and internal analysts.
- Security and auditability, ensuring sensitive vulnerability information is protected.
- Integration capabilities with threat intelligence platforms and automation tools.

Two prominent platforms in this space are [DFIR-IRIS](https://docs.dfir-iris.org/latest/), an open-source digital 
forensics and incident response platform, and [TheHive Project](https://docs.strangebee.com/thehive/overview/), a 
polished enterprise-ready solution. Both have features that a CNA like DIVD would require, though they differ in 
architecture, deployment, and operational characteristics.

## Core features comparison

### DFIR-IRIS

* Case management: Supports multiple concurrent investigations with templates and real-time collaboration.
* Forensic analysis: Integrates with VirusTotal, MISP, WebHooks, and IntelOwl for enrichment.
* Automation: Custom modules and scripts allow workflow automation and evidence collection.
* [Access control](https://docs.dfir-iris.org/operations/access_control/): Granular RBAC and case-level permissions.
* Extensibility: Modular architecture supports custom integrations.

### TheHive (Commercial)

* Case Management: Centralized platform with customizable templates and workflows.
* Alert Management: Aggregates alerts from email, SIEMs, and threat intelligence feeds.
* Collaboration: Task assignments, comments, and case merging for coordinated workflows.
* Automation: Integrated with Cortex for automated analysis and response.
* Security: Enterprise-grade protections, regular updates, and support.

## Security considerations

| Aspect                  | DFIR-IRIS                                                                                               | TheHive Commercial                                                    |
|-------------------------|---------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| Authentication & Access | Basic RBAC                                                                                              | LDAP/AD integration, granular roles                                   |
| Data Protection         | Secure attachment handling                                                                              | Clustered storage, enterprise-grade encryption                        |
| Audit Logging           | Basic tracking                                                                                          | Comprehensive activity logging                                        |
| Security Track Record   | [Multiple disclosed vulnerabilities](https://docs.dfir-iris.org/latest/security-advisories/) (RCE, XSS) | Limited public vulnerability history, commercial support for patching |

Speculative: DIVD likely prioritises strong audit logging and secure access. TheHive Commercial offers more enterprise-ready security features, but DFIR-IRIS could be adapted if in-house expertise is high.

## Integration & extensibility

| Integration         | DFIR-IRIS             | TheHive Commercial            |
|---------------------|-----------------------|-------------------------------|
| Threat Intelligence | MISP via modules      | Native MISP integration       |
| Analysis Tools      | Custom Python modules | Cortex with 200+ analyzers    |
| API                 | Full-featured         | Comprehensive REST APIs       |
| SIEM                | Receives alerts       | Pre-built SIEM connectors     |
| Custom Integrations | HTTP request nodes    | Extensive integration options |

Speculative: Given the need to coordinate across vendors, threat intel, and internal workflows, DIVD would value 
tight MISP integration and automated analysis. Both platforms support this, though TheHive's integrations are more 
polished.

## Deployment & scalability

| Aspect      | DFIR-IRIS                    | TheHive Commercial                                    |
|-------------|------------------------------|-------------------------------------------------------|
| Deployment  | Docker-based microservices   | Modular, cluster-ready with Cassandra & Elasticsearch |
| Scalability | Good for small teams         | Optimized for large CNA operations                    |
| Maintenance | Requires technical expertise | Moderate to high for clustered environments           |
| Flexibility | High via custom modules      | Moderate through templates and API                    |

Speculative: DIVD may use a Docker-based deployment (DFIR-IRIS) for flexibility and cost-efficiency, or TheHive 
Commercial if enterprise-grade scalability and support are priorities.

## Cost considerations

| Aspect         | DFIR-IRIS                 | TheHive Commercial                    |
|----------------|---------------------------|---------------------------------------|
| Licensing      | Open-source, free         | Commercial, €20,400+/year for 5 users |
| Implementation | Docker expertise required | Polished deployment, licensing cost   |
| Maintenance    | Community support         | Dedicated commercial support          |

Speculative: DIVD is a non-profit initiative, so cost efficiency is important. DFIR-IRIS aligns with open-source 
budgets, but TheHive's commercial support could be justified if reliability and security assurance are top priorities.

## Informed guess: What DIVD CNA might use

- Primary Choice: Likely DFIR-IRIS, adapted with custom modules and MISP integration. Reasoning:
  - Open-source aligns with DIVD's non-profit nature.
  - Highly flexible for unique CNA workflows.
  - Can be hosted securely in-house with Docker.
- Alternative/Commercial Option: TheHive Commercial could be used if DIVD prioritises:
  - Enterprise-grade security features.
  - Clustered high-availability deployments.
  - Professional support for managing a growing volume of vulnerability reports.

DIVD CNA probably balances cost, flexibility, and security. DFIR-IRIS is a strong candidate for 
in-house adaptation, while TheHive Commercial represents a more polished but costlier alternative.

