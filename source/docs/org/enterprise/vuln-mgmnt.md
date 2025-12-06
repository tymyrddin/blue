# Vulnerability management at scale

Cheery has a problem. Multiple vulnerability scanners: Trivy for containers, OpenVAS for infrastructure, Wazuh for 
OS packages, custom tools for applications. Each generates reports. Reports pile up. Deduplication is manual. 
Tracking remediation is spreadsheet-based.

"We have 347 open vulnerabilities," she announces. "But 89 are duplicates. 47 are false positives. 23 have been 
fixed but not marked closed. I need a single source of truth."

Angua nods. "And I need context. Is this vulnerability actually exploitable in our environment? What's the attack 
path? What's the priority?"

"We need a vulnerability management platform," Carrot decides. "Something that integrates everything."

## What they built

Cheery deploys DefectDojo as the central vulnerability management system. Cloud server instance, PostgreSQL backend.

All scanners integrate with DefectDojo:
- Trivy uploads container scan results
- OpenVAS sends infrastructure scans
- GitLab security scans imported automatically
- Wazuh CVE detections flow in
- Manual penetration test findings added via UI

DefectDojo deduplicates findings automatically. Same CVE across multiple systems? One finding, multiple affected components.

Risk scoring combines CVSS with business context. Critical vulnerability in internet-facing Royal Bank system? 
Top priority. Medium vulnerability in internal dev tool? Lower priority.

SLA tracking enforces remediation timelines:
- Critical: 24 hours
- High: 7 days
- Medium: 30 days
- Low: 90 days or next maintenance window

Workflow automation assigns findings to teams. Container vulnerability? Goes to Ludmilla's team. Infrastructure? 
Ponder's team. Application? Respective dev team.

Integration with Jira creates tickets automatically. Developers see vulnerabilities in their normal workflow.

Monthly vulnerability reports generate automatically. Charts, graphs, trends. Progress tracking. Otto uses them for 
compliance reporting. Mr. Bent reviews them quarterly.

## Runbooks

* DefectDojo deployment
* Scanner integration
* Deduplication configuration
* SLA setup
* Workflow automation
* Reporting

