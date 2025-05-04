# Best practices for securing Azure services

Microsoft Azure’s security model also follows shared responsibility, requiring customers to secure identities, data, and workloads.

1. Azure active directory (AAD)
   * Enforce conditional access (MFA, device compliance).
   * Audit privileged roles with PIM (Privileged Identity Management).
2. Network security
   * Use NSGs and Azure Firewall to filter traffic.
   * Private Endpoints for PaaS services (avoid public exposure).
3. Monitoring & threat detection
   * Enable Azure Sentinel (SIEM) and Microsoft Defender for Cloud.
   * Monitor suspicious activity with Azure AD Identity Protection.
4. Data encryption
   * Azure Disk Encryption for VMs, TDE for SQL databases.
   * Azure Key Vault for secrets management.
5. Governance
   * Apply Azure Policy to enforce compliance (e.g., "No storage accounts with public access").

## How?

* [Foundation for a secure Azure deployment pipeline](pipeline.md)

