# Securing Continuous Integration (CI) and Continuous Delivery (CD)

CI/CD pipelines automate software builds, testing, and deployment, but they also introduce security risks if not properly hardened. Attackers can exploit weak pipelines to inject malicious code, steal secrets, or compromise deployment environments. Securing CI/CD requires a combination of access controls, code integrity checks, and runtime protections.

1. Pipeline isolation & least privilege
   * Run CI/CD jobs in ephemeral, sandboxed environments (e.g., GitHub Actions isolated runners, Kubernetes pods).
   * Restrict pipeline permissions using role-based access control (RBAC).
 2. Secrets management
    * Never hardcode credentials in pipeline scripts—use secrets managers (Vault, AWS Secrets Manager, Azure Key Vault).
    * Rotate secrets automatically and audit access.
3. Code integrity & signing
   * Enforce commit signing (GPG, S/MIME) to prevent unauthorized changes.
   * Verify artifact integrity with Sigstore/cosign for container images and binaries.
4. Secure build environments
   * Use minimal, hardened base images for containers.
   * Scan for vulnerabilities during builds (Trivy, Grype).
5. Dynamic & static analysis
   * SAST (Semgrep, CodeQL) and SCA (Snyk, Dependabot) in pull requests.
   * DAST (OWASP ZAP) in staging environments before production.
6. Immutable deployments & rollback plans
   * Deploy versioned, immutable artifacts (containers, VM images).
   * Test rollback procedures to recover from compromised releases.

## How?

* [Docker](docker.md)
* [Code and Git](git.md)
* [Supply-chain Levels for Software Artifacts (SLSA)](artifacts.md)
