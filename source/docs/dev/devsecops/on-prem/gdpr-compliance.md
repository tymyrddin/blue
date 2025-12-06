# GDPR compliance Hetzner (On-Prem/Alternative Cloud)

## Certifications & legal frameworks

- ISO 27001: Certifies ISMS for data centers in Germany (Nuremberg, Falkenstein) and Finland.  
- SCCs for Non-EU Locations: Covers US (Virginia, Oregon) and Singapore data centers.  

## Data residency & control

- EU-First Policy: Most services hosted in Germany/Finland; non-EU cloud servers require opt-in.  
- Pseudonymisation: IP addresses anonymized in logs (e.g., `123.123.123.XXX`).  
- Customer-Managed Encryption: Users must encrypt data on rented servers; no native key management.  

## Subprocessor transparency

- Discloses subcontractors (e.g., payment processors, debt collection) with GDPR-compliant contracts.  
- Limits non-EU data transfers to cloud server content only; account data remains in the EU.  

## Breach notification & tools

- DPA Terms: Requires customers to handle breach notifications for their server data.  
- Log Retention: Apache logs configurable by customers; default backups stored for 14 days.

## Data location

- EU-Centric: Most Hetzner servers and cloud services are hosted in Germany (Falkenstein, Nuremberg) or Finland, with optional U.S./Singapore locations (opt-in required).  
- Object Storage: S3-compatible storage defaults to EU data centers.  

## Jurisdiction

- GDPR Compliance: Hetzner’s DPA aligns with GDPR Art. 28. Subprocessors are disclosed in appendices.  
- Local Laws: German data protection laws (e.g., BDSG) apply to EU-hosted data.  

## How to verify

- Hetzner Cloud Console: Check server locations under "Projects" > "Location."  
- DPA Documentation: Review subprocessor lists and data transfer clauses.  

## Detailed documentation
 
- Hetzner: [DPA Template](https://www.hetzner.com/AV/DPA_en.pdf) 
