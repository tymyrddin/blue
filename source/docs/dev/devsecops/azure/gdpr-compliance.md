# Azure data protection: Notes on meeting GDPR Requirements

## Certifications & legal frameworks 

- ISO 27001/27701: Covers information security and privacy management, including GDPR requirements.  
- Azure GDPR Blueprint: Offers preconfigured policies and architectures for GDPR alignment (e.g., data subject request workflows).  

## Data residency & control 

- EU Data Boundaries: Services like Azure SQL Database and Blob Storage allow EU-only data residency.  
- Encryption: Azure Key Vault for customer-managed keys; Azure Disk Encryption for VMs.  
- Access Controls: Azure AD Conditional Access enforces MFA and adaptive policies based on user risk.  

## Subprocessor transparency 

- Lists subprocessors by service and region, including Microsoft subsidiaries and third parties.  
- DPAs include SCCs for non-EEA transfers.  

## Breach notification & tools

- Azure Security Center: Monitors threats and triggers alerts for potential breaches.  
- Microsoft Compliance Manager: Tracks GDPR compliance progress with actionable insights.  

## Data location

- Regional Services: Most services (e.g., Azure VMs, Blob Storage) allow customers to select a Region (e.g., Germany West Central). Data remains within the chosen Geo (group of Regions) unless replicated for resilience.  
- Exceptions: Some services (e.g., Azure CDN, Microsoft Entra ID) operate globally and may store metadata outside selected Geos.  

## Jurisdiction

- GDPR Compliance: Azure’s Data Processing Terms align with GDPR. Subprocessors are listed publicly and bound by SCCs.  
- Sovereign Clouds: Azure offers isolated environments for regulated sectors (e.g., Azure China operated by 21Vianet, Azure Government for U.S. public sector).  

## How to verify

- Azure Portal: Check resource deployment locations under "Properties."  
- Microsoft Compliance Manager: Track data residency compliance and subprocessor details.

## Detailed documentation
 
- [Trust Center](https://www.microsoft.com/en-us/trustcenter/privacy/gdpr)
- [Data Residency Documentation](https://azure.microsoft.com/en-us/explore/global-infrastructure/data-residency).
