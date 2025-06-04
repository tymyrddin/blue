# Best practices for securing on-premises cloud services

## 1. Identity & Access Management (IAM): 

**Least Privilege, Maximum Paranoia**  

- Replace **default service accounts** with custom ones restricted to per-application roles. No one needs admin rights to deploy a PDF generator.  
- **Multi-Factor Authentication (MFA)**: Enforce it for all human access. SMS is better than nothing, but hardware tokens (YubiKeys) are ideal .  
- **Role-Based Access Control (RBAC)**: Map Kubernetes/OpenStack roles to team functions (e.g., `dev-readonly`, `prod-admin`).  

**Service Account Hell**  

- Rotate service account keys every 90 days—or better yet, use **short-lived certificates** (e.g., Vault-managed tokens).  
- Audit service accounts monthly. Orphaned keys are like unlocked backdoors.  

---

## 2. Network security: Assume you’re already breached

**Segmentation Over Hope**  

- **Air-gap critical workloads**: Finance and healthcare systems shouldn’t share a VLAN with the office printer.  
- **Zero Trust Networking**: Authenticate *every* request, even internal ones. Tools like **SPIFFE/SPIRE** help .  
- **Firewall Rules**:  
  - Block all inbound traffic by default. Yes, even SSH. Use jump hosts.  
  - Log all denied traffic. That mysterious midnight connection attempt from Belarus? Investigate it.  

**Encryption In Transit**  

- **TLS 1.3 everywhere**, including internal services. Self-signed certs are a last resort—use a private PKI (e.g., Smallstep).  
- **MACsec** for inter-rack traffic. Because eavesdropping isn’t just a cloud problem .  

---

## 3. Monitoring & threat detection

**Log Like Big Brother Is Watching (Because He Is)**

- Aggregate logs to a **SIEM** (e.g., Graylog/Wazuh) outside the production network. Tamper-proof storage is key.  
- **Alert on anomalies**: Failed logins at 3 AM? New sudoers entries? Investigate immediately.  

**Container-Specific Checks**  

- Use **Falco** for runtime container monitoring. That crypto miner in your `nginx` container won’t hide for long.  
- **Image Scanning**: Integrate Trivy or Anchore into your CI/CD pipeline *before* deployment .  

---

## 4. Data protection

**Encryption At Rest**

- **LUKS/KMS for disks**: Because losing an unencrypted backup drive is a GDPR nightmare waiting to happen.  
- **Key Rotation**: Automate it. Manual key rotation is as reliable as a chocolate teapot.  

**Sensitive Data Handling**

- **Data Loss Prevention (DLP)**: Scan for PII/credentials in logs and storage. Redact or pseudonymise where possible.  
- **Immutable Backups**: Use write-once storage for backups. Ransomware can’t encrypt what it can’t overwrite.  

---

## 5. Governance & compliance

**Policy As Code**

- Define security policies in **Terraform/Ansible**, not Confluence docs nobody reads. Enforce via CI/CD checks.  
- **CIS Benchmarks**: Hardened images for Linux/Windows. No, "default install" isn’t secure .  

**Binary Authorization (For Containers)**  

- Only allow signed, attested images. Use **Sigstore/Cosign** for signing, and reject anything unsigned .  
- **Continuous Validation**: Scan running containers for drift from approved baselines.  

---

## When to ignore these rules

- **Legacy systems**: Can’t air-gap that 2003-era ERP? Isolate it and monitor like a hawk.  
- **Developer experience**: Security shouldn’t cripple productivity. Use **vaulted credentials** instead of blocking Docker entirely.  

---

## How?

For a **DevSecOps pipeline** integrating these practices, follow the [On-Prem DevSecOps Pipeline](pipeline.md):  

1. **Pre-Deployment**:  
   - Scan code/images in CI (Trivy, Checkov).  
   - Sign artifacts with Sigstore.  
2. **Deployment**:  
   - Enforce policies via Kubernetes Admission Controllers (e.g., OPA/Gatekeeper).  
3. **Runtime**:  
   - Monitor with Falco/Prometheus.  
   - Automate patching (e.g., RHEL Satellite/WSUS).

Cloud-native tools work on-prem too. The goal isn’t to replicate AWS—it’s to build a **secure, auditable, and 
maintainable** system without surrendering control to Silicon Valley.  
