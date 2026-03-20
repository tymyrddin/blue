# Internal dependency mirror

Golem Trust mirrors 237 critical open-source packages internally. The mirror lives at `packages.golemtrust.am`, served by a dedicated Gitea instance. The selection criterion is straightforward: any package that appears as a dependency (direct or transitive) in three or more Golem Trust applications is a mirror candidate. Ludmilla's team manages the mirror. The goal is resilience: if an upstream registry goes down, or if an upstream package is compromised and pulled, Golem Trust's builds continue against the last known-good version in the mirror. This runbook covers the mirror scope, the update procedure, the upstream compromise response, the per-ecosystem proxy configuration, and the Hetzner Object Storage archival setup.

## Mirror scope

The 237 packages currently mirrored are listed in `golem-trust/platform/mirror/packages.yaml`. The file is the authoritative source; the Gitea instance is populated from it. A package is added to the mirror via a PR to `packages.yaml`, requiring two reviews and Ludmilla's approval.

```
packages:
  go:
    - module: github.com/gin-gonic/gin
      versions: ["v1.9.1", "v1.9.0"]
    - module: github.com/stretchr/testify
      versions: ["v1.9.0", "v1.8.4"]
  npm:
    - name: axios
      versions: ["1.6.8", "1.6.7"]
    - name: lodash
      versions: ["4.17.21"]
  python:
    - name: requests
      versions: ["2.31.0", "2.30.0"]
    - name: cryptography
      versions: ["42.0.5", "42.0.4"]
```

Old versions are retained for two years to support reproducible builds. A package version is never deleted from the mirror within that window.

## Automated weekly update

A weekly CronJob in the build cluster pulls new versions from upstream for each mirrored package. The job runs on Monday at 02:00 UTC, outside business hours, so that any anomalies are visible to Ludmilla's team at the start of the working week.

The job performs these steps for each package:

1. Check the upstream registry for versions not yet in the mirror
2. Download each new version's archive
3. Compute its SHA-256 hash
4. Compare the hash against the expected hash in the dependency hash database (if the package is in the hash database; all mirrored packages should be)
5. If the hash matches, stage the new version in the mirror's staging area
6. Emit a summary report to the `#mirror-updates` Slack channel

The staged versions are not yet available to builds. Ludmilla's team reviews the weekly report on Monday morning, checking for unexpected new versions, unusual file sizes, or any advisory activity on OSV or the GitHub Advisory Database for the packages updated. After review, a team member runs the promotion script:

```
./scripts/promote-staged-versions.sh --week 2026-03-16
```

This moves staged packages to the live mirror and updates the Gitea indices.

## Upstream compromise response

If a mirrored package changes unexpectedly at the upstream registry, the hash verification step in the weekly job will detect the discrepancy and halt promotion for that package. The specific alert condition is: the hash of the upstream archive for a version that is already in the mirror does not match the hash stored in the mirror. This is not a new version; it is the same version identifier with different content, which should not be possible in a correctly operating registry.

When this condition is detected:

The mirror for that package is frozen at the last promoted version. No further updates are applied until Ludmilla explicitly clears the freeze.

An immediate alert fires to Cheery and Ludmilla via PagerDuty.

All builds that depend on the affected package continue to use the frozen mirror version. The frozen version is the last known-good state and is safe to build against.

Ludmilla and Cheery investigate: is the change reflected in the package's changelog or issue tracker? Is there a security advisory? Is the upstream maintainer aware? If the change cannot be explained by legitimate upstream activity, Sam Vimes Jr. is notified and the supply chain incident response procedure is invoked.

To manually freeze or unfreeze a package:

```
./scripts/mirror-freeze.sh --package npm/axios --action freeze --reason "Unexpected hash change in v1.6.8, under investigation"
./scripts/mirror-freeze.sh --package npm/axios --action unfreeze --reason "Confirmed legitimate security patch, hash database updated"
```

Freeze status and reasons are logged to the mirror's audit trail in Gitea.

## Proxy configuration per language ecosystem

Applications are configured to use the internal mirror as their primary registry. The mirror transparently proxies requests it cannot serve (packages not in the mirror scope) to the upstream registry.

Go module proxy (set in the application's CI environment and in developer workstation setup documentation):

```
GOPROXY=https://packages.golemtrust.am/go,direct
GONOSUMCHECK=packages.golemtrust.am
GONOSUMDB=packages.golemtrust.am
```

npm registry (in each repository's `.npmrc`):

```
registry=https://packages.golemtrust.am/npm/
always-auth=false
```

Python pip (in `pip.conf` within the Docker build context, or in the Tekton Task environment):

```
[global]
index-url = https://packages.golemtrust.am/python/simple/
trusted-host = packages.golemtrust.am
```

For repositories that use Poetry, the equivalent `pyproject.toml` configuration:

```
[[tool.poetry.source]]
name = "golemtrust-mirror"
url = "https://packages.golemtrust.am/python/simple/"
priority = "primary"
```

The mirror's Gitea instance uses client certificate authentication for write operations. Read operations for packages accept the standard Golem Trust SSO token.

## Hetzner Object Storage archival

The mirror's package archives are stored on Hetzner Object Storage in the bucket `golemtrust-package-mirror`. The bucket has versioning enabled. Each package archive is stored at a path following the convention `<ecosystem>/<package-name>/<version>/<filename>`. The Gitea instance is stateless with respect to package content; it reads from and writes to Object Storage directly.

Old versions are retained for exactly two years from their first mirror date. A monthly CronJob identifies versions older than two years and removes them from both the Object Storage bucket and the Gitea index, but only if:

- The version is not referenced in any currently deployed application's lock file (checked via a query to the internal CMDB)
- Ludmilla's team has confirmed the package is no longer required for reproducible builds of any artefact still in Harbor

Cheery reviews the deletion candidates list before the CronJob proceeds with actual deletion.

To verify the current mirror health and coverage:

```
./scripts/mirror-health.sh --report
```

The report shows: total packages mirrored, packages frozen, packages pending promotion, and the date of the last successful weekly update cycle.
