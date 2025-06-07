# Notes on navigating GDPR requirements on Google Cloud

## Certifications & legal frameworks 

- ISO 27018: Focuses on privacy in cloud services, aligning with GDPR encryption and consent requirements.  
- Data Processing Terms: Incorporate GDPR obligations and SCCs for international transfers.  

## Data residency & control

- Data Regions: Customers pin data to specific geographies (e.g., Belgium, Netherlands).  
- Default Encryption: All data encrypted at rest and in transit; CMEK (Customer-Managed Encryption Keys) optional.  
- Access Transparency: Logs Google staff access to customer data for auditability.  

## Subprocessor transparency

- Publicly lists subprocessors (e.g., Google subsidiaries, third-party vendors) with service-specific details.  
- Requires subcontractors to meet GDPR standards via contractual clauses.  

## Breach notification & tools

- Security Command Center: Provides unified threat detection and compliance monitoring.  
- Incident Response: 24/7 security team with documented workflows for breach containment.  

## Data location

- Configurable Services: Many GCP services (e.g., BigQuery, Cloud Storage) let customers pin data to specific Regions (e.g., Belgium, Netherlands) or Multi-Regions (e.g., EU).  
- AI/ML Data: Vertex AI and other AI services may process data globally unless using Assured Workloads to restrict locations.  

## Jurisdiction

- Assured Workloads: For strict residency (e.g., EU-only), this feature enforces Resource Location Policies at the folder or project level.  
- Data Transfers: Google’s Service Terms incorporate SCCs and ISO 27018 for international transfers.  

## How to verify

- Google Cloud Console: Review resource locations under "IAM & Admin" > "Resource Location."  
- Assured Workloads Dashboard: Monitor compliance with geo-restrictions.

## Detailed documentation
 
- [GDPR Resources](https://cloud.google.com/privacy/gdpr)
- [Assured Workloads Guide](https://cloud.google.com/assured-workloads/docs/data-residency)
