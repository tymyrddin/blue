# git-secrets implementation

Runbook for configuring secret scanning across all Golem Trust repositories. Ludmilla Katzenzungen implemented this after reviewing Carrot's 47-page report. She was, in her words, "appalled but not surprised." This runbook covers two layers: pre-commit hooks on developer machines using git-secrets, and CI/CD pipeline scanning using TruffleHog.

## What we are scanning for

The primary targets are:

- AWS access key and secret key patterns (`AKIA...`)
- Generic high-entropy strings that look like API keys or tokens
- Patterns matching known secret formats: Vault tokens, Stripe keys, Fastmail app passwords, GitHub personal access tokens
- PostgreSQL connection strings containing credentials
- Private key material (PEM headers)

The `production-db-passwords.txt` file that prompted all of this is not a pattern we need to scan for specifically; it is gone and its existence is not spoken of.

## git-secrets installation

Install `git-secrets` on each developer machine. On Debian or Ubuntu:

```
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install
```

On macOS (for any team members working from Überwald on a laptop):

```
brew install git-secrets
```

## Configuring git-secrets globally

Run the following once per developer machine to install the hooks globally so that new repositories get them automatically:

```
git secrets --install ~/.git-templates/git-secrets
git config --global init.templateDir ~/.git-templates/git-secrets
```

For existing repositories, install the hooks individually:

```
cd /path/to/repo
git secrets --install
```

Register the AWS provider (covers AWS key patterns):

```
git secrets --register-aws --global
```

Add custom patterns for Golem Trust-specific secrets. These should be added globally on each developer machine:

```
git secrets --add --global 'vault:s\.[A-Za-z0-9]{24}'
git secrets --add --global 'postgresql://[^:]+:[^@]+@'
git secrets --add --global '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'
git secrets --add --global 'sk_live_[0-9a-zA-Z]{24}'
```

Add allowed patterns for false positives that appear legitimately in code (test fixtures, documentation examples). Allowed patterns are regular expressions matched against the full line:

```
git secrets --add --global --allowed 'VAULT_TOKEN=s\.EXAMPLE'
git secrets --add --global --allowed 'postgresql://app:changeme@localhost'
```

Adjust the allowed list as false positives are encountered. Do not add an allowed pattern without discussing it with Carrot first.

## Testing the hook

Create a test file with a fake secret and attempt to commit it:

```
echo "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" > /tmp/test-secret.txt
git add /tmp/test-secret.txt
git commit -m "test"
```

The commit should be rejected with a message identifying the matched pattern. If it is not rejected, the hook is not installed correctly. Run `git secrets --install` in the repository again.

Remove the test file: `rm /tmp/test-secret.txt`.

## Scanning history

To scan the full commit history of a repository for secrets that may already be present:

```
git secrets --scan-history
```

This was the first thing Ludmilla did after installation. The results informed the remainder of Carrot's report. Run this on any repository that predates the git-secrets implementation or that has been imported from an external source.

If secrets are found in history, the affected credentials must be rotated immediately before addressing the history itself. Rotating the credential is urgent; cleaning the history can wait until the credential is safe. Do not spend time cleaning history while a live credential is compromised.

To remove secrets from Git history after rotating the credentials, use `git filter-repo`. This is a destructive operation that rewrites history and requires a force push. All team members must re-clone the repository afterwards. Coordinate with Carrot before proceeding.

## TruffleHog in CI/CD

TruffleHog runs as a step in the CI/CD pipeline for every pull request and push to main. Configure it in the Gitea Actions workflow file at `.gitea/workflows/security.yml` in each repository:

```
name: Secret scanning

on:
  push:
    branches: [main]
  pull_request:

jobs:
  trufflehog:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified
```

The `--only-verified` flag reduces false positives by only reporting secrets that TruffleHog can confirm are valid against the relevant service. Remove this flag if unverified findings are also required, but expect more noise.

The scan runs on the diff between the base branch and the current head, so it catches secrets introduced in the current change set. It does not re-scan existing history on every run; the `--scan-history` step above covers that for newly onboarded repositories.

## Responding to a scan failure

If TruffleHog fails a pipeline build:

1. Do not attempt to defeat the scanner by obfuscating the secret. This has been suggested once. The suggestion was not well received.
2. Rotate the credential immediately.
3. Remove the secret from the code and replace it with a reference to Vault or an environment variable that the deployment system populates at runtime.
4. If the secret was committed to a branch that has not been merged, rewrite the branch history to remove it: `git rebase -i` to edit or drop the offending commit, then force-push the branch.
5. If the secret was committed to main, coordinate with Carrot. The response depends on how long the secret was exposed and whether it was ever publicly visible.
6. File an entry in the internal incident log regardless of severity.

## Onboarding new repositories

When a new repository is created:

1. Install git-secrets hooks: `git secrets --install`
2. Add the `.gitea/workflows/security.yml` pipeline file from the template repository
3. Run `git secrets --scan-history` on any imported code
4. Confirm with Ludmilla that the configuration is in place before the first push to main

Ludmilla reviews new repository configurations as part of code review. If she asks whether git-secrets is configured, the answer should be yes and demonstrable.