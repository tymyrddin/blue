# Preventing and handling API breaches

## Why API security matters

API breaches can cripple organizations, leading to:

* Sensitive data leaks (customer PII, financial records)
* Reputational damage and loss of trust
* Regulatory fines (GDPR, CCPA, HIPAA violations)
* Service disruptions from attacks like DDoS or data corruption

## API security checklist

Authentication

* Enforce MFA for admin endpoints
* Use short-lived JWT tokens (30min expiry)

Data Handling

* Mask sensitive fields (SSNs, passwords) in logs
* Rate limit by IP/user (prevent brute force)

Infrastructure

* WAF rules for API endpoints (block SQLi/XSS)
* Regular secret rotation (API keys, DB creds)

## Incident response plan

Have a playbook for:

* Token revocation
* False positive handling
* Breach disclosure timelines
