# Secrets in version control

Secrets end up in git for the same reason they end up anywhere they do not belong: convenience, habit, and the absence of friction in the wrong place. A developer who needs an API key to run the application locally reaches for the nearest persistent location. `.env` files, configuration templates, and test fixtures are the most common paths.

Once a secret is in git history, it is available to everyone with access to the repository, and to anyone who had access before the secret was removed from the working tree. Removing the file in a later commit does not help; the secret remains in every earlier commit. If the repository was ever public or shared, rotation is the only meaningful response.

## Pre-commit detection

Catching secrets before they reach the repository is more tractable than recovering from them afterwards. Two tools are commonly used:

`detect-secrets` (Yelp) scans staged content for high-entropy strings and known secret patterns. It maintains a baseline file (`secrets.baseline`) that records known false positives so the hook does not block on them:

```bash
pip install detect-secrets
detect-secrets scan > .secrets.baseline
```

Adding as a pre-commit hook via `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ["--baseline", ".secrets.baseline"]
```

`gitleaks` scans for secrets across the full commit history as well as staged content, which is useful for auditing repositories that predate the hook:

```bash
gitleaks detect --source . --verbose
```

Running `gitleaks` on a repository before making it public is a low-cost check.

## .gitignore patterns

Common files that carry secrets:

```
.env
.env.*
*.pem
*.key
*.p12
*.pfx
credentials.json
secrets.json
config/secrets.*
```

The `.gitignore` entry is a soft control: it prevents accidental staging but does not catch files with other names, and it does nothing for secrets inlined into source files. Pre-commit hooks provide a harder check.

## If a secret was committed

The steps, in order:

1. Rotate the secret immediately. Assume it has been seen, regardless of how quickly the commit was caught or how limited the repository access appeared to be.
2. Remove from history using `git filter-repo` (the supported replacement for `git filter-branch`):

```bash
pip install git-filter-repo
git filter-repo --path-glob '*.env' --invert-paths
```

or, for a string value that appears across multiple files:

```bash
git filter-repo --replace-text <(echo 'ACTUAL_SECRET==>REMOVED')
```

3. Force-push the rewritten history and notify any collaborators who have cloned the repository, since their local clones still contain the old history.

History rewriting removes the secret from the repository going forward. It does not remove it from any forks, clones, or caches that existed before the rewrite.

## Commit signing

Signed commits allow a repository to verify that a commit was made by a specific key holder, not just someone with push access. This is relevant for supply chain integrity: an attacker with access to a CI token can push unsigned commits that are otherwise indistinguishable from legitimate ones.

SSH signing is the simpler option (GPG is an alternative but requires more infrastructure):

```bash
git config commit.gpgsign true
git config gpg.format ssh
git config user.signingkey ~/.ssh/github-key-ed25519.pub
```

Repositories on GitHub and GitLab can be configured to require signed commits on protected branches. The `allowed_signers` file maps email addresses to public keys for local verification:

```
user@example.com ssh-ed25519 AAAA...
```

```bash
git config gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
git log --show-signature
```

Signed commits are a signal, not a guarantee: if the signing key itself is compromised, signed commits from that key are not trustworthy. Key management and revocation matter as much as the signing mechanism.
Last updated: 17 May 2026
