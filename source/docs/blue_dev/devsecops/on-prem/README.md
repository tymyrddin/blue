# Best practices for securing on-premises cloud services

Google Cloud Platform (GCP) provides robust security features, but proper configuration is critical to protect 
workloads, data, and identities. Following Google’s shared responsibility model, customers must secure their 
deployments while Google handles infrastructure security.

1. Identity & access management (IAM)
   * Enforce the least privilege – Use predefined roles (e.g., roles/viewer) instead of broad permissions.
   * Workload Identity Federation – Allow external workloads (GitHub Actions, AWS) to access GCP without service account keys.
   * MFA & Context-Aware Access – Require multifactor authentication and restrict logins based on device/user context.
   * Service Account Security – Avoid default compute engine service accounts; assign minimal permissions to custom ones.
2. Network scurity
   * VPC Service Controls – Create security perimeters to prevent data exfiltration from GCP services.
   * Cloud Armor – Block DDoS and application-layer attacks with Google's global WAF.
   * Private Google Access – Allow VMs without public IPs to access Google APIs privately.
   * Hierarchical Firewalls – Apply org-wide firewall rules to enforce consistent policies.
3. Monitoring & threat detection
   * Security Command Center – Centralized visibility into misconfigurations, vulnerabilities, and threats.
   * Cloud Audit Logs – Track all admin activities, data access, and system events.
   * Chronicle SIEM – Correlate GCP logs with enterprise-wide telemetry for threat hunting.
4. Data protection
   * Customer-Managed Encryption Keys (CMEK) – Control your own encryption keys in Cloud KMS.
   * Data Loss Prevention (DLP) – Automatically detect and redact sensitive data (PII, credentials).
   * Default Encryption – All data is encrypted at rest (AES-256) and in transit (TLS 1.2+).
5. Governance & compliance
   * Organization Policies – Enforce guardrails (e.g., "Disable public IPs on VMs").
   * Forseti Security – Automate CIS benchmark checks and policy enforcement.
   * Binary Authorization – Ensure only trusted, signed container images can be deployed.

## How?

* [Compute Engine (GCE) and VM instances](pipeline.md)
