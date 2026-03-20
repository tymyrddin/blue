# Pre-commit hooks

Runbook for deploying and managing pre-commit hooks on developer workstations. Pre-commit hooks run locally before code is committed to git, catching issues at the earliest possible point in the development cycle. A secret caught before it reaches the repository never needs to be rotated. A vulnerability flagged before a commit is pushed is a notification to one developer; the same issue caught after a merge is a pipeline failure that delays everyone.

The incident that prompted this security programme involved a hardcoded production database password committed to a public repository. The CI pipeline's TruffleHog scanner detected it within 30 seconds of the push. A pre-commit hook would have caught it before the push occurred at all.

## pre-commit framework

Golem Trust uses the `pre-commit` framework to manage hooks. It handles hook installation, version management, and running hooks in isolated virtual environments. The same configuration file is committed to each repository, so developers who clone the repository can install the hooks with a single command.

Install the `pre-commit` binary on developer workstations:

```
pip install pre-commit
```

Or via pipx if the workstation uses managed Python environments:

```
pipx install pre-commit
```

Verify: `pre-commit --version`

## Repository configuration

Add a `.pre-commit-config.yaml` file to each repository. This file defines the hooks that run on every `git commit`. A standard configuration for Golem Trust repositories:

```
repos:
  - repo: https://github.com/trufflesecurity/trufflehog
    rev: v3.88.0
    hooks:
      - id: trufflehog
        name: TruffleHog secret detection
        entry: trufflehog git file://. --since-commit HEAD --only-verified --fail
        language: golang
        pass_filenames: false

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: detect-private-key
        name: Detect private keys
      - id: check-added-large-files
        args: ['--maxkb=1024']
      - id: check-merge-conflict
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: check-yaml
      - id: check-json

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.24.0
    hooks:
      - id: gitleaks
        name: Gitleaks secret scanning
```

Two secret scanners are run in parallel: TruffleHog (with verification against live APIs) and Gitleaks (pattern-based, catches secrets before they can be verified). The redundancy is intentional. TruffleHog with `--only-verified` misses rotated credentials that still exist in history; Gitleaks catches those on pattern alone.

`detect-private-key` from the standard hooks set catches raw PEM-format private key blocks without needing TruffleHog or Gitleaks. A cheap second check for the most obvious class of credential leak.

`check-added-large-files` with a 1MB limit prevents accidental commits of binary files, database dumps, or other large assets that do not belong in git.

## Hook installation

After the `.pre-commit-config.yaml` file is present in a repository, each developer installs the hooks once per clone:

```
pre-commit install
```

This installs a `pre-commit` script into `.git/hooks/pre-commit`. From that point forward, every `git commit` in that repository runs the configured hooks before the commit is allowed.

To install hooks in all repositories at once on a new workstation, run from the developer's project root:

```
find ~/Development -name ".pre-commit-config.yaml" -exec sh -c \
  'cd "$(dirname "$1")" && pre-commit install' _ {} \;
```

## Updating hooks

Hook versions are pinned in `.pre-commit-config.yaml` by tag (`rev: v3.88.0`). To update all hooks to their latest versions:

```
pre-commit autoupdate
```

Commit the resulting changes to `.pre-commit-config.yaml`. Renovate Bot also monitors pre-commit hook versions and opens merge requests when updates are available (configured via `renovate.json` with the `pre-commit` manager enabled).

## Developer onboarding checklist

New developers joining Golem Trust complete the following before their first commit:

1. Install `pre-commit`: `pip install pre-commit` or `pipx install pre-commit`
2. Clone the repository
3. Run `pre-commit install` in the repository root
4. Verify hooks are active: `pre-commit run --all-files` (first run downloads hook dependencies; subsequent runs are fast)
5. Confirm TruffleHog and Gitleaks are listed in the output

The checklist is part of the new developer onboarding documentation. Cheery reviews new accounts in GitLab monthly and flags any that have been committing without pre-commit hooks installed (detectable by the absence of a `pre-commit` signature in the git hook call log, or by checking whether the developer's commits have triggered TruffleHog CI failures that the local hook would have caught).

## Bypassing hooks

Developers can bypass pre-commit hooks with `git commit --no-verify`. This is occasionally necessary (for example, when committing intentional test fixtures that include fake credential patterns).

Any bypass must be immediately followed by a comment in the commit message explaining why the bypass was used. GitLab CI will still run TruffleHog and Gitleaks on the pipeline; a bypass locally does not prevent detection in CI.

Repeated use of `--no-verify` without justification is treated as a policy violation. Angua monitors commit messages for bypass patterns in the Graylog pipeline log stream.

## Custom Gitleaks rules

Add a `.gitleaks.toml` to repositories that have custom secret formats (such as Golem Trust's own API keys):

```
[extend]
useDefault = true

[[rules]]
id = "golemtrust-api-key"
description = "Golem Trust internal API key"
regex = '''ht_[a-zA-Z0-9]{32,}'''
keywords = ["ht_"]
```

This ensures that internal API keys are caught by pattern matching even before TruffleHog's verification step.
