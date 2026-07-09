# Overview

Modern applications include far more third-party code than first-party code. The risk extends beyond
the application's own logic: every library, framework, and transitive dependency introduces potential
vulnerabilities, and supply chain attacks have made even widely-used packages a viable attack vector.
The `event-stream` npm incident and Log4Shell both demonstrated that a single dependency can compromise
an entire application stack.

## Choosing dependencies

Fewer dependencies reduce the attack surface. Lightweight frameworks pull in fewer transitive packages
than full-stack alternatives. Official SDKs from cloud providers are generally better maintained and
more security-audited than community forks.

Adoption patterns and maintenance history carry signal: active maintainers, regular releases, and a
history of prompt CVE responses reduce the risk of depending on a package. Checking the last release
date, open issue count, and historical CVEs provides a useful baseline before adding a new dependency.

## Locking and verifying

Version pinning ensures the application uses exactly what was tested. Exact version specifications
(`requests==2.31.0` in pip, lockfile commits in npm) prevent silent upgrades that introduce new
vulnerabilities. Lockfiles record both direct and transitive versions and are worth committing to version
control.

Subresource Integrity verifies that CDN-delivered scripts have not been tampered with:

```html
<script src="https://cdn.example/lib.js"
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

## Scanning and monitoring

Dependabot, Renovate, and OWASP Dependency-Check automate CVE checking and raise pull requests when
updates are available. Running these in CI means vulnerable dependencies surface before they reach
production. Generating and tracking an SBOM (Software Bill of Materials, in CycloneDX or SPDX format)
provides a complete inventory for downstream vulnerability analysis.

## Response

When a dependency reports a critical CVE, the immediate question is whether the vulnerable code path is
reachable in the application. If it is, patching or replacing the dependency is the priority. Monitoring
for unexpected network calls from installed packages can surface a compromised postinstall script or
runtime exfiltration attempt.

## Related

- [Supply chain hardening](../../../counter/app/supply-chain.md)
Last updated: 26 May 2026
