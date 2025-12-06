# GitLab and the pipeline security

The incident happens at 3:42 on a Friday afternoon. Sam Vimes Jr. (yes, again) commits code to a public repository. 
He's working on a feature for the Merchants' Guild and needs to test database connectivity.

He hardcodes the production database password.

In a public repository.

On GitHub.

TruffleHog alerts fire within 30 seconds. Carrot's phone explodes with notifications. Angua sees the alerts in Graylog 
simultaneously.

Emergency response: password rotated via Vault in 45 seconds. Repository history rewritten. Source IP of anyone who 
cloned the repository in the last hour identified and monitored.

Damage assessment: two bot accounts scraped the password. Both now monitoring honeypot databases with fake data.

"This," says Adora Belle to Ludmilla after the incident is contained, "is why we need security built into the 
development pipeline."

## What they built

Ludmilla deploys [GitLab CE](https://about.gitlab.com/releases/categories/releases/) on a cloud instance (8 vCPU, 
16GB RAM), self-hosted, complete control, integrated security scanning.

Protected branches enforce review requirements. Main branch requires two approvals. No direct commits. No exceptions. 
Not even for Adora Belle.

Security scanning in CI/CD pipelines:

- SAST (Static Application Security Testing)
- Dependency scanning with OWASP Dependency-Check
- Container scanning with Trivy
- Secret detection with git-secrets and TruffleHog

Pipelines fail on critical vulnerabilities. No manual overrides without security review. Build artifacts include 
scan results.

Renovate Bot handles dependency updates automatically. Minor updates merge automatically after 3 days and passing 
tests. Major updates require manual review.

Developer workstations get pre-commit hooks. Scan for secrets before code reaches Git. Catch problems at the source.

Sam Vimes Jr. becomes the poster child for "why we have these policies." He takes it well. Mostly.

## Runbooks

* GitLab deployment
* Runner configuration
* SAST/DAST setup
* Security scanning integration
* Renovate Bot configuration
* Pre-commit hooks

## Related

[Development security operations](https://blue.tymyrddin.dev/docs/dev/devsecops/)

