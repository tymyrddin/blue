# Supply chain hardening

Modern applications contain far more third-party code than first-party code. For most production systems, the majority
of code running came from package registries, base images, and CI tooling that the team did not write and rarely
inspects. Supply chain attacks exploit that asymmetry. They compromise something it depends on: a widely-used npm
package, a base container image, a GitHub Action, a Terraform module. The payload arrives through the normal
deployment pipeline, signed and verified by the same tooling that handles legitimate code.

## The four stages

The supply chain runs from registry through build to artefact storage to deployment. Each stage has a different attack
pattern, and securing one does not secure the others.

At the registry: typosquatted packages, compromised maintainer credentials, malicious new releases of packages the team
already trusts. The application's dependency file requests the package by name; the attack targets what that name
resolves to.

At build time: malicious CI actions, postinstall scripts that run during dependency installation, build secrets exposed
in environment variables that a compromised step can read. A GitHub Action with repository write access can modify
source before the build runs.

At artefact storage: container images pinned to a mutable tag, compiled artefacts in an object store that lacks write
protection. An image tagged `latest` is re-pulled at whatever the tag currently points to.

At deployment: admission controllers that accept images from any registry, Terraform modules sourced from public
repositories without version pinning.

## Locking and pinning

Version pinning is the most basic control and frequently skipped for transitive dependencies. Exact version
specifications (`requests==2.31.0` in pip, a committed `package-lock.json` for npm) lock both direct and transitive
versions. `npm ci` installs from the lockfile exactly; `npm install` re-resolves semver ranges against the current
registry state. In CI environments, `npm ci` is the appropriate command.

For container images, pinning to a digest makes tampering visible:

```text
FROM python:3.12-slim@sha256:4a3f1f3b2e8c...
```

A tag can be updated silently. A digest cannot. The build fails loudly if the image has been replaced.

Subresource Integrity attributes on CDN-hosted scripts catch tampering between the registry and the browser:

```text
<script src="https://cdn.example/lib.js"
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

## Private registries and admission controls

Routing dependency pulls through a private registry (Nexus, Artifactory, ECR mirror) inserts a controlled layer between
the application and public sources. Dependencies are cached at a known point; new versions enter only through a
promotion process. A package that appeared overnight in the public registry does not automatically reach the build.

Kubernetes admission controllers enforce registry restrictions at deployment time:

```yaml
# Kyverno policy: restrict image sources
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-image-registries
spec:
  validationFailureAction: Enforce
  rules:
    - name: validate-registries
      match:
        any:
          - resources:
              kinds: [ Pod ]
      validate:
        message: "Images must be pulled from registry.example.internal"
        pattern:
          spec:
            containers:
              - image: "registry.example.internal/*"
```

A pod attempting to pull from a public registry fails admission. The attempt is logged with the pod metadata and the
identity that submitted it.

## Build provenance

Knowing what an artefact contains is one question. Knowing that the build process producing it was unmodified is
another.

SLSA (Supply-chain Levels for Software Artefacts) provides a graduated framework for provenance attestation. At level 2,
the build service generates a signed attestation recording what inputs produced the artefact. At level 3, the build
environment is hardened and the attestation is non-falsifiable even by the repository owner.

Cosign verifies container image signatures and provenance attestations:

```bash
cosign verify \
  --certificate-identity-regexp "^https://github.com/org/repo/" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  registry.example.internal/app:v1.2.3
```

A promotion pipeline that requires a valid provenance attestation before deploying to production cannot accept a
tampered artefact: the signature will not match.

## SBOM as an incident response tool

A Software Bill of Materials records every component in a deployed artefact: library names, versions, and the dependency
paths that include them. Generated at build time using Syft or CycloneDX and stored alongside the artefact, it answers a
question that otherwise requires manual inspection.

When a critical CVE drops against a specific library version, the question "do we have this running in production?"
becomes answerable in seconds:

```bash
# Generate an SBOM for a container image
syft registry.example.internal/app:v1.2.3 -o cyclonedx-json > app-sbom.json

# Query for a specific component
jq '.components[] | select(.name == "log4j-core") | {name, version}' app-sbom.json
```

Without an SBOM, the answer requires running every deployed artefact against the CVE database manually. Incidents rarely
have that kind of time.

## Detecting supply chain activity

A compromised postinstall script typically does one of: exfiltrate environment variables (credentials, tokens, CI
secrets) via HTTP to an external endpoint, modify the installed package tree to add a backdoor, or schedule a persistent
job. Network monitoring at the build agent catches the exfiltration:

```bash
# Monitor outbound connections during npm install using eBPF
bpftrace -e 'tracepoint:syscalls:sys_enter_connect { printf("%s connect attempt\n", comm); }'
```

Running dependency installs behind an egress proxy that allows only the package registry and blocks everything else
turns a postinstall exfiltration attempt into a visible, logged failure rather than a silent success.

Build-time scanning catches known-vulnerable versions before the artefact reaches any environment:

```bash
trivy fs --severity HIGH,CRITICAL --exit-code 1 .
```

The `--exit-code 1` flag fails the build on critical findings.

## Related

- [Dependency security overview](../../dev/appsec/libraries/overview.md)
- [npm dependency security](../../dev/appsec/libraries/npm.md)
- [PyPI dependency security](../../dev/appsec/libraries/pypi.md)
- [Container security gaps](../../diy/containers/failures.md)
- [Containers and Kubernetes evasion](../evasion/containers.md)
