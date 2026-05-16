# Securing CI/CD pipelines

CI/CD pipelines automate software builds, testing, and deployment. They also introduce a concentrated attack surface: a
pipeline with write access to production environments, container registries, and secret stores represents significant
lateral movement potential. Attackers who compromise a pipeline can inject malicious code into artefacts, exfiltrate
secrets, or deploy backdoored builds to production.

## Pipeline isolation and least privilege

Running CI/CD jobs in ephemeral, sandboxed environments (GitHub Actions isolated runners, Kubernetes pods with
restricted permissions) limits the blast radius of a compromised job. A job that runs in a shared, persistent
environment can access artefacts from other jobs, residual credentials, and potentially the host system.

RBAC on pipeline permissions restricts which jobs can deploy, which can access secrets, and which can modify pipeline
configuration. The principle is the same as for any other system: the minimum access needed for the job to run, not the
maximum that is convenient.

## Secrets management

Credentials hardcoded in pipeline scripts are committed to source control, visible in pipeline logs, and accessible to
any user with read access to the repository. Secrets managers (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault,
GCP Secret Manager) inject secrets at runtime without storing them in the pipeline definition. Short-lived, scoped
credentials generated at job start and expiring at job end reduce the exposure window further.

Log output from CI/CD jobs is worth auditing: secret values passed as environment variables sometimes appear in stack
traces, debug output, or process listings.

## Code integrity and artefact signing

Commit signing (GPG or SSH signing) verifies that commits were made by a key holder with access to a specific key. It
prevents trivially spoofed commits but does not prevent a compromised key from producing signed commits. Protected
branches that require signed commits and restrict direct pushes close the most obvious injection paths.

Artefact integrity verification with Sigstore/cosign extends the signing chain to container images and build artefacts.
A pipeline that signs images at build time and a deployment system that verifies signatures before deploying provides a
mechanism to detect artefacts modified after the signing step.

## Secure build environments

Minimal base images for build containers reduce the installed toolchain to what the build actually needs, which reduces
both the CVE surface and the post-compromise utility of a compromised build container.

Vulnerability scanning at build time (Trivy, Grype) catches known CVEs in base images and dependencies before artefacts
are pushed to a registry. Blocking the build on critical findings prevents vulnerable artefacts from reaching production
silently.

## Analysis integration

SAST (Semgrep, CodeQL) and SCA (Snyk, Dependabot) in pull requests surface findings while a developer still has context
on the code being changed. DAST (OWASP ZAP) in staging environments tests the running application before promotion to
production.

## Immutable deployments

Versioned, immutable artefacts (container images tagged with a commit SHA rather than `latest`, VM images built by the
pipeline) provide a clear deployment history and make rollback deterministic. Rolling back a mutable deployment that was
modified in place is difficult to reason about; rolling back to a previous immutable artefact is not.

## Related

- [Docker](docker.md)
- [Code and Git](git.md)
- [Supply-chain Levels for Software artefacts (SLSA)](artefacts.md)
- [AWS: Basis for a secure AWS deployment pipeline](../aws/pipeline.md)
- [Azure: Foundation for a secure Azure deployment pipeline](../azure/pipeline.md)
- [GCP: Foundation for a secure GCP deployment pipeline](../gcp/pipeline.md)
- [On-prem: Secure on-premises CI/CD pipeline (Hetzner, Finland)](../on-prem/pipeline.md)
