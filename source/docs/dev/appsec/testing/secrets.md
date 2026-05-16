# Secrets detection

Credentials, API keys, and private keys committed to version control are a persistent source of breaches. They appear in git history even after the file is deleted, are copied when the repository is forked or cloned, and in the case of public repositories, are indexed by search engines within minutes of being pushed.

## Detection approaches

Pre-commit hooks run before a commit is recorded, catching secrets at the point where they would enter the repository. `detect-secrets` and `gitleaks` both provide pre-commit hooks. See [version control security](../coding/version-control.md) for setup details.

Historical scanning audits existing repositories for secrets that may have been committed before a pre-commit hook was in place:

```bash
gitleaks detect --source . --verbose
trufflehog git file://. --only-verified
```

`trufflehog` attempts to verify whether detected credentials are still valid by testing them against the relevant API, which distinguishes active secrets from rotated or expired ones.

Continuous monitoring in GitHub, GitLab, or a service like GitGuardian watches for secrets in new commits across all repositories in an organisation, often in near-real-time.

## Tools

Gitleaks: open-source; scans git history and staged content; supports pre-commit hooks; configurable rule sets.

TruffleHog: open-source; scans git history, S3 buckets, GitHub organisations; verifies credentials where possible.

GitGuardian: commercial; real-time monitoring across an organisation's repositories; integrates with Slack and JIRA for alerting.

detect-secrets: open-source from Yelp; maintains a baseline file of known false positives; suited to pre-commit integration.

## Response

When a secret is found in git history, rotation is the only effective response. Rewriting history with `git filter-repo` removes the secret from the repository going forward but does not help if the repository was ever public or widely shared. The assumption is that the secret has been seen; rotation is what makes it useless.
