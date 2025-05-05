# Securing hosted code repositories: Best practices

Hosting code on platforms like GitHub or GitLab comes with risks—exposed secrets, compromised accounts, or malicious 
commits can lead to serious breaches. Here’s how to lock things down properly.

## Enforce strong access controls

Require Multi-Factor Authentication (MFA) for everyone—no exceptions. Prefer hardware security keys (like YubiKeys) 
over SMS codes. Restrict admin rights to only those who truly need them, and audit permissions regularly to catch 
outdated access.

Example:

```bash
# List all org members (GitHub CLI)  
gh api /orgs/{your-org}/members --jq '.[].login'
```

## Hunt for secrets before they leak

Even careful teams accidentally commit API keys or passwords. A single exposed cloud key can lead to a costly breach. Use:

* GitHub’s built-in secret scanning (checks for AWS keys, Slack tokens, etc.)
* Pre-commit hooks like git-secrets to block leaks before they happen
* Weekly scans of your repo history with tools like truffleHog

## Lock down branches

Prevent risky changes with branch protection rules. Apply these rules to all branches, including for admins.

* Require signed commits (PGP/GPG verified)
* Block force pushes—no rewriting history
* Mandate pull request reviews (at least two approvals)
* Require CI/CD checks to pass before merging

## Manage dependencies

Outdated libraries are a top attack vector. Automate:

* Security alerts (GitHub Dependabot or Renovate)
* Patch updates (auto-merge minor version bumps)
* Monthly reviews of major upgrades

Example config (`.github/dependabot.yml`)

```yaml
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

## Prepare for the worst

* Backup critical repos (use git clone --mirror)
* Monitor audit logs for suspicious access
* Have an incident plan for when leaks happen

## More

* [GitHub’s security best practices](https://docs.github.com/en/code-security/getting-started/github-security-features)
* [Mozilla’s hard-earned GitHub rules](https://wiki.mozilla.org/GitHub/Repository_Security)