# Policy as code with OPA

Otto Chriek is frustrated. He's been preparing for ISO 27001 certification, and evidence collection is consuming his existence.

"I need proof that developers cannot deploy to production without approval," he says at a security team meeting. "I 
have policies written. I have procedures documented. But how do I prove they're enforced?"

"You audit logs manually?" Ludmilla suggests.

"I have been. For six months. It's tedious. I've checked 2,847 deployments manually. This doesn't scale."

Dr. Crucible leans forward. "What if policies were code? Automatically enforced. Impossible to bypass. Every action 
checked against policy. Audit trail automatic."

"Policy as code?" Otto's eyes light up. As a vampire, his eyes lighting up is somewhat disconcerting.

## What they built

Dr. Crucible and Ludmilla deploy [Open Policy Agent](https://github.com/open-policy-agent/opa/releases) as the policy 
enforcement layer. OPA integrates everywhere: Kubernetes admission control, Terraform validation, CI/CD pipelines, 
API gateway authorisation.

Policies written in Rego language. Example: all Royal Bank databases must have encryption enabled. If Terraform tries 
to create database without encryption, OPA denies it. Build fails. No exceptions.

Another policy: production access requires two approvals. If someone tries to access production via StrongDM without 
approvals, OPA rejects the request. Automatically.

Kubernetes admission control: OPA Gatekeeper validates every resource before it's created. Pod without resource 
limits? Denied. Container running as root? Denied. Image from unapproved registry? Denied.

Policy testing uses OPA's built-in test framework. Policies are code, so they get unit tests. CI/CD runs tests on 
every policy change.

Audit trail is complete. Every policy decision logged with full context: who, what, when, why denied/allowed. Otto 
can generate compliance reports automatically.

Evidence collection time drops from days to minutes. Auditors love it. "This is how compliance should work," the 
ISO auditor says.

## Runbooks

* OPA deployment
* Rego policy development
* Gatekeeper configuration
* Policy testing
* Audit reporting
* Integration patterns

## Related

[Audits and assessments](https://purple.tymyrddin.dev/docs/audits/)
