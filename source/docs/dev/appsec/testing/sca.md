# Software composition analysis

Most production applications include far more [third-party code](../libraries/overview.md) than first-party code. The ratio for a typical Node.js or Python application is often 10:1 or higher when transitive dependencies are counted. SCA tools scan those dependencies for known vulnerabilities.

## Direct and transitive dependencies

Direct dependencies are the packages listed in `requirements.txt`, `package.json`, or `go.mod`. Transitive dependencies are the packages those packages depend on. A vulnerability in a transitive dependency three levels deep is still exploitable; SCA tools traverse the full dependency tree.

A new CVE can make a previously-clean dependency tree vulnerable without any code changes. Continuous monitoring provides ongoing visibility.

## Tools

Snyk: commercial with a generous free tier; integrates with GitHub, GitLab, CI/CD pipelines; monitors repositories continuously and sends alerts on new CVEs; provides fix PRs for some vulnerabilities.

OWASP Dependency-Check: open-source; cross-platform; works against Java, .NET, Python, Node.js, and others; produces reports in HTML, JSON, and other formats.

Dependency-Track: open-source platform from OWASP; ingests SBOMs (Software Bill of Materials) in CycloneDX or SPDX format; provides a dashboard for tracking vulnerabilities across multiple projects.

`pip-audit` (Python), `npm audit` (Node.js), `cargo audit` (Rust), `govulncheck` (Go): ecosystem-native tools that check against the relevant vulnerability database without requiring a separate service.

## SBOM

A Software Bill of Materials is a machine-readable inventory of all components in a software product. CycloneDX and SPDX are the dominant standards. SBOMs are increasingly required for government procurement (US Executive Order 14028) and in regulated industries. Generating an SBOM at build time and tracking it alongside the build artefact provides the input for downstream vulnerability analysis.

```bash
# generating a CycloneDX SBOM for a Python project
pip install cyclonedx-bom
cyclonedx-py -r requirements.txt -o sbom.json --format json
```
Last updated: 10 July 2026
