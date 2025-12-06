# The maintenance account compromise

Angua's nose twitches. It's 2:47. Again. She's noticing a pattern: Attackers seem to prefer this time. Most of 
Ankh-Morpork is asleep. The City Watch is changing shifts. Even the Thieves' Guild takes a tea break.

Her monitor shows an alert: unusual SSH login to `merchants-guild-app-02`. The maintenance account. Fifteen 
failed attempts over thirty seconds, then success. Source IP from Tsort.

She doesn't hesitate. Disables the account in Keycloak. Checks Graylog for lateral movement. Calls Carrot.

"Eight minutes from detection to containment," Carrot says later, reviewing her response. "Excellent work. But we 
shouldn't have maintenance accounts with passwords at all."

Investigation reveals the account is legacy, created in the early warehouse days. Password: `MaintenancePass123`. 
Never rotated. Used by scripts, applications, and three different third-party vendors.

"This is what we're fixing next," Carrot declares.

## What they built

Carrot and Ponder deploy [Teleport](https://goteleport.com/docs/upcoming-releases/) as their bastion host. Single 
access point for all infrastructure. SSH access, kubectl for Kubernetes (not deployed yet but planned), 
database access, everything goes through Teleport.

Certificate-based authentication only. No more passwords for infrastructure access. Vault's SSH secrets engine 
generates short-lived certificates (1-hour TTL). Each session is unique.

Session recording is mandatory. Vimes insisted. "If someone's going to access the Patrician's systems, I want a 
recording I can review in court."

Role-based access control defines who can access what. Developers get dev and staging. System administrators get 
everything, with MFA requirements. Golem operators (Mr. Pump and his team) get infrastructure nodes with 
certificate-based auth.

Production access requires approval. Request via Teleport's web UI, manager approval, security approval, valid 
for 4 hours, reason required. Everything audited.

Legacy maintenance accounts are deleted. Scripts are refactored to use application identities with Vault-issued 
certificates. Third-party vendors get dedicated accounts with strict access controls.

The attacker never returns. Probably moved to easier targets.

## Runbooks

* Teleport deployment
* Vault SSH secrets engine configuration
* Certificate-based authentication setup
* Approval workflows
* Session recording
* RBAC policy examples
* Migration from password-based access

