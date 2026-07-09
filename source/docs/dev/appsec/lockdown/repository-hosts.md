# Securing hosted code repositories

Code hosting platforms (GitHub, GitLab) introduce specific risks: secrets committed to history, compromised
accounts with write access, and malicious commits that slip through review. The controls that address these
are well-understood; the gap is usually in consistent application.

## Authentication and access

Multi-factor authentication for all organisation members reduces the impact of a compromised password.
Hardware security keys (YubiKey, FIDO2) are more resistant to phishing than TOTP or SMS codes. Admin
rights are worth auditing regularly: access accumulates, and periodic review catches accounts whose scope
has outgrown their current role.

```bash
# List all org members (GitHub CLI)
gh api /orgs/{your-org}/members --jq '.[].login'
```

## Detecting committed secrets

Secrets reach repositories through inattention: an API key in a config file, a password in a
test fixture. GitHub's built-in secret scanning covers a broad pattern library (AWS keys, Slack tokens, and
others). Pre-commit hooks via `git-secrets` block common patterns before they reach the remote. Periodic
scans of [repository history](../testing/secrets.md) with tools like truffleHog surface anything that slipped through earlier.

## Branch protection

Branch protection rules prevent a class of risky changes before they merge. Signed commits (PGP/GPG)
establish a chain of authorship. Blocking force pushes preserves history. Requiring pull request reviews
(at minimum two approvals) adds a second pair of eyes. CI/CD checks as a merge prerequisite ensure that
automated tests ran and passed on the code as written.

## Dependency management

Outdated [libraries](../libraries/overview.md) are a common entry point. Dependabot or Renovate raise pull requests automatically when
new versions are available, with auto-merge configured for minor patch updates that pass CI. Major version
upgrades warrant periodic manual review.

```yaml
# .github/dependabot.yml
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

## Backup and incident readiness

Mirroring critical repositories (`git clone --mirror`) provides a recovery path if the hosted copy is
deleted or corrupted. Audit logs record access events; reviewing them periodically surfaces unexpected
access patterns. An incident plan covering the steps for when a secret leaks (rotation, scope assessment,
notification) is considerably easier to follow when it exists before the event.
