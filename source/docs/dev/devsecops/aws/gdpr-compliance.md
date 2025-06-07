# AWS data protection: GDPR roadmap notes

## Certifications & legal frameworks

- CISPE Code of Conduct: 107 AWS services comply with this GDPR-aligned code, ensuring infrastructure-level data protection for EU customers.  
- Standard Contractual Clauses (SCCs): Automatically applied for data transfers outside the EEA, validated post-Schrems II ruling.  
- ISO 27001/27017/27018: Certifies security controls for cloud services and personal data protection.  

## Data residency & control

- EU Regions: Customers select storage locations (e.g., Frankfurt, Ireland); data does not leave chosen regions without explicit consent.  
- Encryption: AES-256 for data at rest, TLS for transit. Customers manage keys via AWS KMS or use AWS-managed keys.  
- Access Governance: AWS IAM and CloudTrail enable granular permissions and audit trails for GDPR Article 30 record-keeping.  

## Subprocessor transparency

- Publicly lists subprocessors (e.g., infrastructure support, third-party services) with regional dependencies.  
- Requires subcontractors to adhere to AWS DPA terms, including GDPR obligations.  

## Breach notification & tools 

- 72-Hour Notification: AWS commits to alert customers of breaches affecting their data per GDPR Article 33.  
- AWS Artifact: Provides on-demand access to compliance reports (e.g., SOC 3, ISO) for audits. 

## Data location

- Regions & Availability Zones: AWS organizes infrastructure into geographically isolated Regions (e.g., EU Frankfurt, US East). Each Region contains multiple Availability Zones (AZs) for redundancy. Data stored in a Region does not leave it without explicit customer action.  
- Local Zones: For stricter residency requirements (e.g., GDPR), AWS offers Local Zones (e.g., Berlin, Warsaw) that keep data within specific metro areas. These are extensions of parent Regions but enforce data locality via guardrails like SCPs (Service Control Policies).  

## Jurisdiction

- Legal Compliance: AWS adheres to local laws where data resides. For example:  
  - EU Regions comply with GDPR and CISPE Code of Conduct.  
  - AWS GovCloud (US) follows U.S. government standards (e.g., FedRAMP).  
- Data Transfer: Cross-border transfers use SCCs (Standard Contractual Clauses) or AWS Data Processing Addendum (DPA) for GDPR compliance.  

## How to verify

- AWS Artifact: Download compliance reports (e.g., ISO 27001, SOC 3) for audit trails.  
- AWS Control Tower: Enforce data residency policies via SCPs (e.g., blocking S3 uploads to non-EU Regions).  

## Detailed documentation

- [GDPR Center](https://aws.amazon.com/compliance/gdpr-center/)
- [Global Infrastructure Map](https://aws.amazon.com/about-aws/global-infrastructure/)




