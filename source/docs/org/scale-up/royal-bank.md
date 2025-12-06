# The Royal Bank requirements

Mr. Bent arrives at the warehouse at precisely 9:00 in the morning. He carries a leather portfolio containing 347 
pages of security questionnaires, compliance requirements, and technical specifications. His mustache is waxed to 
geometric perfection.

"Mr. Stibbons, Ms. Dearheart," he begins, settling into a chair with ruler-straight posture, "the Royal Bank of 
Ankh-Morpork is considering your services. However, we have certain... requirements."

He opens the portfolio and hands here a document. Adora Belle's eyes widen.

- Section 47, subsection 12b: "No user shall have implicit trust on the production network. All access must be 
explicitly granted, time-limited, and audited."
- Section 89, subsection 3a: "Network segmentation must prevent lateral movement. Compromising one system shall not 
grant access to others."
- Section 103, subsection 7c: "All administrative sessions must be recorded and retained for seven years."

"This," says Adora Belle after Mr. Bent leaves, "changes everything. We need a proper zero-trust architecture."

## What they built

Ponder researches options and chooses [Tailscale](https://github.com/tailscale/tailscale/releases) with self-hosted 
[Headscale](https://headscale.net/stable/about/releases/) as their control plane. They deploy custom DERP servers 
in Finland (fsn1) and Germany (nbg1) for relay traffic.

Every service requires explicit ACL entries. No implicit trust. The SOC team can access logging infrastructure. 
Banking operations personnel can access Royal Bank systems, but only with MFA and device compliance checks (disk 
encrypted, firewall enabled, OS updated).

Device posture checks run before allowing connections. Nodes must meet security requirements, or they are denied access.

[StrongDM](https://docs.strongdm.com/changelog/release-notes) is deployed for database access specifically. Mr. Bent's 
audit requirements are strict: every database query must be logged, access must be time-limited and approval-gated, 
and credentials must never be shared.

Applications no longer connect directly to databases. They request access via StrongDM. Approval workflow: manager 
approval plus security approval. Time limit: 4 hours default. All queries logged to Graylog. Automatic credential 
rotation after each session.

Keycloak federates with the Bank's identity provider via SAML 2.0. Bank employees authenticate using their existing 
credentials. Just-in-time provisioning creates Golem Trust accounts automatically. Quarterly access reviews ensure 
permissions stay current.

Mr. Bent's return audit three months later: "Acceptable. The minus from my previous assessment is removed. Grade: A."

## Runbooks

* Headscale deployment
* DERP server setup
* ACL configuration
* Device posture checks
* StrongDM deployment
* Database access workflows
* SAML federation
* Approval automation.

