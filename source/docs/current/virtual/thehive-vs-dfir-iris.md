# TheHive project vs DFIR-IRIS

## Choosing a platform

CVE Numbering Authorities (CNAs) need robust incident response platforms to handle vulnerability reports, assign CVE IDs, and coordinate responsible disclosure. While the exact platform used by the DIVD CNA is not publicly disclosed, we can make an informed guess based on requirements for:

* Case management to track multiple vulnerability reports simultaneously.
* Collaboration features for working with researchers, vendors, and internal analysts.
* Security and auditability, ensuring sensitive vulnerability information is protected.
* Integration capabilities with threat intelligence platforms and automation tools.

Two prominent platforms in this space are [DFIR-IRIS](https://docs.dfir-iris.org/latest/), an open-source digital forensics and incident response platform, and [TheHive Project](https://docs.strangebee.com/thehive/overview/), a polished enterprise-ready solution. Both have features that a CNA like DIVD would require, though they differ in architecture, deployment, and operational characteristics.

## Core features comparison

### DFIR-IRIS

* Case management: Supports multiple concurrent investigations with templates and real-time collaboration.
* Forensic analysis: Integrates with VirusTotal, MISP, WebHooks, and IntelOwl for enrichment.
* Automation: Custom modules and scripts allow workflow automation and evidence collection.
* Access control: [Granular RBAC and case-level permissions](https://docs.dfir-iris.org/operations/access_control/).
* Extensibility: Modular architecture supports custom integrations.

### TheHive (Commercial)

* Case management: Centralized platform with customizable templates and workflows.
* Alert management: Aggregates alerts from email, SIEMs, and threat intelligence feeds.
* Collaboration: Task assignments, comments, and case merging for coordinated workflows.
* Automation: Integrated with Cortex for automated analysis and response.
* Security: Enterprise-grade protections, regular updates, and commercial support.

## Security considerations

| Aspect                  | DFIR-IRIS                                                                                               | TheHive Commercial                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Authentication & Access | Basic RBAC                                                                                              | LDAP/AD integration, granular roles                                   |
| Data Protection         | Secure attachment handling                                                                              | Clustered storage, enterprise-grade encryption                        |
| Audit Logging           | Basic tracking                                                                                          | Comprehensive activity logging                                        |
| Security Track Record   | [Multiple disclosed vulnerabilities](https://docs.dfir-iris.org/latest/security-advisories/) (RCE, XSS) | Limited public vulnerability history, commercial support for patching |

DIVD CNA would need strong audit logging and controlled access. TheHive Commercial offers these features natively, while DFIR-IRIS can provide them but requires more administrative hardening.

## Integration & extensibility

| Integration         | DFIR-IRIS             | TheHive Commercial            |
| ------------------- | --------------------- | ----------------------------- |
| Threat Intelligence | MISP via modules      | Native MISP integration       |
| Analysis Tools      | Custom Python modules | Cortex with 200+ analyzers    |
| API                 | Full-featured         | Comprehensive REST APIs       |
| SIEM                | Receives alerts       | Pre-built SIEM connectors     |
| Custom Integrations | HTTP request nodes    | Extensive integration options |

CNAs need smooth coordination with vendors, threat intel feeds, and automation pipelines. Both platforms deliver this, but TheHive’s Cortex ecosystem is more turnkey, while DFIR-IRIS depends on building or adopting modules.

## Example integrations (DFIR-IRIS modules from GitHub)

DFIR-IRIS maintains a [public repository of modules](https://github.com/dfir-iris/iris-web). Notable examples that would be useful in a CNA context include:

* iris-misp: Tight MISP integration (import/export of indicators and correlations).
* iris-virustotal: Direct enrichment of files, hashes, and URLs against VirusTotal.
* iris-shodan: Automated lookups of IPs and domains via Shodan.
* iris-intelowl: Connects to IntelOwl for multi-source enrichment.
* iris-crowdstrike (community module): Integration with CrowdStrike Falcon Intel API.

These provide ready-made enrichment for vulnerability reports and reduce manual triage.


## Deployment & scalability

| Aspect      | DFIR-IRIS                    | TheHive Commercial                                    |
| ----------- | ---------------------------- | ----------------------------------------------------- |
| Deployment  | Docker-based microservices   | Modular, cluster-ready with Cassandra & Elasticsearch |
| Scalability | Good for small teams         | Optimized for large CNA operations                    |
| Maintenance | Requires technical expertise | Moderate to high for clustered environments           |
| Flexibility | High via custom modules      | Moderate through templates and API                    |

DIVD could deploy DFIR-IRIS via Docker for cost-efficiency and flexibility, but TheHive Commercial offers proven scalability for larger CNA workloads.

## Cost considerations

| Aspect         | DFIR-IRIS                 | TheHive Commercial                    |
| -------------- | ------------------------- | ------------------------------------- |
| Licensing      | Open-source, free         | Commercial, €20,400+/year for 5 users |
| Implementation | Docker expertise required | Polished deployment, licensing cost   |
| Maintenance    | Community support         | Dedicated commercial support          |

DIVD is a non-profit initiative, so cost efficiency matters. DFIR-IRIS aligns with open-source budgets, but TheHive’s commercial support may be attractive if guaranteed uptime and SLA-backed support are required.


## Informed guess: What DIVD CNA might use

* Primary choice: DFIR-IRIS, adapted with custom modules and MISP integration.

  * Open-source matches DIVD’s non-profit nature.
  * Flexible enough for bespoke CNA workflows.
  * Securely hostable in-house with Docker.

* Alternative: TheHive Commercial, if DIVD prioritises:

  * Enterprise-grade audit and access controls.
  * High-availability clustered deployment.
  * Professional support for handling a high vulnerability report volume.

DIVD CNA most likely balances cost, flexibility, and security. DFIR-IRIS is the strong candidate for in-house adaptation, while TheHive Commercial represents the polished but more expensive option.

