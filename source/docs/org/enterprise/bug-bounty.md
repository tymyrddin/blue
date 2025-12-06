# The Bug Bounty programme

Adora Belle makes an announcement at the all-hands meeting: "We're starting a bug bounty programme. We're going to 
pay security researchers to break into our systems."

Uncomfortable silence.

"Before you panic," she continues, "this is controlled. Rules of engagement. Specific scope. Responsible disclosure. 
And we pay well. Better we find problems and fix them than have real attackers exploit them."

Mr. Teatime, the new red team lead (reformed assassin, legitimately employed), nods approvingly. "Smart. Use the 
hacker community as extended security team."

## What they built

Carrot and Angua set up the bug bounty programme on HackerOne and Intigriti (European platform preference). Scope 
includes all `*.golemtrust.am` domains, customer-facing applications, APIs, and mobile applications.

Out of scope: physical attacks, social engineering (except against designated test accounts), attacks against 
customer data, DDoS.

Rewards:

- Critical: €5.000 - €15.000
- High: €1.000 - €5.000
- Medium: €500 - €1.000
- Low: €100 - €500
- All valid reports get Golem Trust swag

Dedicated bug bounty environment: replica of production without real customer data. Researchers test against 
realistic systems without risk to operations.

Triage process: researcher submits finding → Angua reviews within 24 hours → validate/replicate → severity assessment 
→ assign to team → fix → verify → reward → disclose.

First month results:

- 47 submissions
- 12 valid vulnerabilities
- 8 low, 3 medium, 1 high
- €4.200 paid out
- Average fix time: 3.7 days

Top finding: IDOR in customer portal allowing access to other customers' non-sensitive metadata. €3.000 reward. Fixed 
in 4 hours. Researcher impressed by response speed.

The programme becomes a talent pipeline. Three researchers are later hired as security engineers.

## Runbooks

* Bug bounty environment setup
* Triage procedures
* Severity assessment
* Remediation workflows
* Researcher communication
* Payment processes

## Related

[Responsible disclosure programme](https://purple.tymyrddin.dev/docs/secops/sirt/disclosure)

