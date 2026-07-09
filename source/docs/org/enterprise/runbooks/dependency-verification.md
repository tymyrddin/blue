# Dependency verification

The JavaScript library incident is how Ludmilla explains dependency verification to every new engineer on the team. A popular library's maintainer account was compromised, malicious code was pushed to the registry, and thousands of applications downloaded it automatically via their update tooling. Golem Trust used that library in twenty-three applications. They got lucky: the malicious version was detected and pulled within hours, before any of those applications rebuilt. But Renovate Bot was configured to update dependencies automatically, and if a build had run during that window, the malicious code would have entered the supply chain. The dependency verification step is the control that would have caught it. This runbook covers the hash database, the Tekton Task that performs verification, the alert path for mismatches, and the Renovate Bot integration that keeps the database current.

## Hash database structure

The hash database is a Git repository at `gitlab.golems.internal/golem-trust/dependency-hashes`. It contains one directory per language ecosystem, and within each directory one file per package, named `<package-name>-<version>.sha256`.

```
dependency-hashes/
  go/
    github.com-gin-gonic-gin-v1.9.1.sha256
    github.com-stretchr-testify-v1.9.0.sha256
  npm/
    axios-1.6.8.sha256
    lodash-4.17.21.sha256
  python/
    requests-2.31.0.sha256
    cryptography-42.0.5.sha256
```

Each `.sha256` file contains a single line: the SHA-256 hash of the canonical distribution archive for that package version. For Go modules this is the zip archive as downloaded by `go mod download`. For npm packages it is the tarball. For Python packages it is the wheel file from PyPI.

The repository uses signed commits. Every commit to the hash database must be GPG-signed by a member of Ludmilla's team. The branch protection rule on `main` requires two code reviews and Ludmilla's explicit approval for any merge.

## Adding a new dependency to the hash database

When a new dependency is introduced, the engineer submitting the application PR must also submit a PR to the hash database. The process:

Download the package archive and compute its hash:

```
go mod download -json github.com/example/newlib@v1.2.3 | \
  jq -r '.Zip' | xargs sha256sum | awk '{print $1}' \
  > go/github.com-example-newlib-v1.2.3.sha256
```

For npm:

```
npm pack example-newlib@1.2.3 --dry-run --json | \
  jq -r '.[0].filename' | xargs sha256sum | awk '{print $1}' \
  > npm/example-newlib-1.2.3.sha256
```

For Python:

```
pip download --no-deps --dest /tmp/pkgs requests==2.31.0
sha256sum /tmp/pkgs/requests-2.31.0-*.whl | awk '{print $1}' \
  > python/requests-2.31.0.sha256
```

Open a PR against `dependency-hashes` with these files, referencing the application PR that introduces the dependency. Two members of Ludmilla's team review the hash (independently downloading and verifying it themselves), and Ludmilla merges.

## Verification Task in Tekton

The `golemtrust-verify-deps` Task runs after source checkout and before the build. It checks every direct and transitive dependency declared in the project's lock files against the hash database.

The Task clones the hash database, then runs the language-specific verification script:

```
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: golemtrust-verify-deps
  namespace: tekton-pipelines
spec:
  workspaces:
    - name: source
      mountPath: /workspace/source
  steps:
    - name: clone-hash-db
      image: harbor.golems.internal/tools/git:2.44.0
      command:
        - git
      args:
        - clone
        - --depth=1
        - https://gitlab.golems.internal/golem-trust/dependency-hashes.git
        - /workspace/source/.hash-db

    - name: verify
      image: harbor.golems.internal/tools/golemtrust-dep-verify:1.3.0
      script: |
        #!/bin/sh
        set -e
        /usr/local/bin/verify-deps \
          --hash-db /workspace/source/.hash-db \
          --source /workspace/source/src \
          --alert-webhook ${MISMATCH_WEBHOOK_URL}
      env:
        - name: MISMATCH_WEBHOOK_URL
          valueFrom:
            secretKeyRef:
              name: dep-verify-secrets
              key: mismatch-webhook-url
```

The `verify-deps` tool is maintained in `golem-trust/tools/dep-verify`. It reads the project's lock files (go.sum, package-lock.json, requirements.txt, or poetry.lock), resolves each entry to its archive hash, and compares against the hash database.

## Hash mismatch response

A hash mismatch is not treated as a routine build failure. It is treated as a potential supply chain attack until proved otherwise.

When a mismatch is detected, `verify-deps` does three things simultaneously: it exits with a non-zero status (which fails the Tekton Task and stops the pipeline), it fires an alert via PagerDuty to Cheery's personal alert queue, and it posts a message to the `#supply-chain-alerts` Slack channel with the package name, the version, the expected hash, and the observed hash.

Cheery's initial response checklist:

- Confirm the mismatch is real: download the package independently from the upstream registry and compute the hash manually
- Check whether the upstream package has been flagged on the OSS security feeds (Snyk, OSV, GitHub Advisory Database)
- Determine when the hash last verified correctly, to establish a time window for the compromise
- Notify Ludmilla regardless of preliminary assessment
- If the package appears to have been tampered with, escalate to Sam Vimes Jr. and trigger the supply chain incident response process

A mismatch caused by a legitimate package update (the version was bumped without updating the hash database) will become apparent quickly because the new version will be visible in the upstream registry's changelog. The resolution is to update the hash database via the standard PR process. This case should still be reviewed by Ludmilla, because the more interesting question is why the lock file changed without a corresponding hash database PR.

## Renovate Bot integration

Renovate Bot is configured to open PRs updating dependency versions. When it updates a dependency, it also opens a corresponding PR against the hash database, populating the new hash automatically using the same download-and-hash procedure described above.

The Renovate Bot configuration in `.renovaterc.json` includes a `postUpdateOptions` hook that calls the hash generation script:

```
{
  "extends": ["golem-trust:default"],
  "postUpdateOptions": ["golemtrust-hash-update"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": false,
      "additionalBranchPrefix": "renovate/"
    }
  ]
}
```

The `golemtrust-hash-update` option is a custom Renovate plugin defined in the `golem-trust/renovate-config` repository. It ensures that no Renovate PR can be merged without a corresponding hash database PR, because the hash database PR is listed as a required check on the application repository.

## How this would have caught the JavaScript library incident

The malicious version of the library was distributed as a new patch release. When Renovate Bot generated its update PR, it would also have generated a hash database PR. The hash in that PR would have been computed from the malicious archive. A reviewer who independently downloaded and hashed the package would have observed a hash that matched the malicious package, but the security community's rapid flagging of the compromised version would also have been visible in the package's GitHub issues and npm advisory feed before the PR could clear its two-review requirement. More critically, even if the PR had somehow cleared review, Ludmilla's final approval acts as a human gate. The window between a package being compromised and being pulled from registries is typically hours; the window for a hash database PR to clear review and Ludmilla's approval is also typically hours, but they overlap in a way that makes simultaneous exploitation improbable.
Last updated: 20 March 2026
