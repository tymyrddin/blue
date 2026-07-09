# Alternative tools

Otto Chriek is preparing for the ISO 27001 audit. One of the required documents is a vendor register: every piece of software used in production, its licence, its country of incorporation, and any known supply chain risks.

He produces the register. It is long.

"Interesting," he says, in the way that vampires say things when they are not actually interesting. "StrongDM is American. Cloudflare is American. Sigstore is hosted by a US non-profit. The Renovate Bot is maintained by a company recently acquired by a US firm." He photographs each entry for the record.

Ludmilla, who has been reading over his shoulder, points at the bottom of the list. "Same document as startup phase. We want to know what we move to if we have to."

Cheery adds it to the risk register as a medium-risk finding: "Concentration of dependencies on US-incorporated vendors for critical pipeline and access control components."

This is the scale-up edition of that document.

## Framing

The [startup alternative-tools document](../startup/alternative-tools.md) covers Keycloak, Vault, Graylog, Teleport, 
and the core infrastructure. This document covers the additional tooling introduced during the scale-up phase: 
zero-trust networking, container security, CI/CD, configuration management, compliance scanning, and the GeoDNS layer.

The same preferences apply: open source first, European where possible, and no tool should be irreplaceable if its 
vendor changes direction.

## Zero-trust networking

Current: [Headscale](https://github.com/juanfont/headscale/releases) (self-hosted Tailscale control plane)

Headscale is an open source reimplementation of the Tailscale control plane under the BSD 3-Clause licence. The 
project is maintained by a Spanish developer (Juan Font) and community contributors. The underlying data plane uses 
WireGuard, which is part of the Linux kernel. There is no commercial entity behind Headscale itself; the risk is 
abandonment.

[Netbird](https://github.com/netbirdio/netbird/releases) is a German company (NetBird GmbH, Berlin) building an open 
source WireGuard-based mesh VPN under the BSD 3-Clause licence. It provides a self-hosted control plane with a 
management UI, OIDC/SSO integration, and access policies. The functionality is closer to a full Tailscale replacement 
than Headscale, which requires Tailscale clients. Netbird has its own client software and does not depend on 
Tailscale's proprietary client builds.

[Nebula](https://github.com/slackhq/nebula/releases) is a WireGuard-based overlay network from Slack, open source 
under the MIT licence. It has no commercial entity and no control plane UI; configuration is file-based. Less 
operational convenience than Headscale or Netbird, but the simplicity reduces the attack surface.

Netbird is the preferred alternative if Headscale is abandoned or if the Tailscale client dependency becomes a concern.

## Database access control

Current: [StrongDM](https://www.strongdm.com/)

StrongDM is a US company. It is not open source; the entire product is commercial SaaS with an agent component. The 
audit logging (7-year WORM retention on Hetzner Object Storage) is the feature most difficult to replace.

[Teleport Database Access](https://goteleport.com/docs/upcoming-releases/) extends the existing Teleport deployment to proxy database connections with the same 
session recording and RBAC model used for SSH access. Teleport is already deployed; adding database access avoids 
the StrongDM dependency entirely. The limitation is that Teleport database access lacks the query-level logging that 
StrongDM provides; it records session metadata but not individual SQL statements.

[Pgaudit](https://github.com/pgaudit/pgaudit/releases) is a PostgreSQL extension (Apache 2.0 / PostgreSQL licence) that logs all SQL statements at the database level. It does not provide the proxy architecture or multi-database support of StrongDM, but it provides query-level audit trails without any external dependency. Combined with Teleport's session recording and Graylog centralisation, pgaudit covers the audit requirement at zero additional cost. This combination is the most likely replacement path if StrongDM becomes untenable.

## Container registry

Current: [Harbor](https://github.com/goharbor/harbor/releases) (CNCF graduated project)

Harbor is a CNCF graduated project under the Apache 2.0 licence, originally created by VMware and now community-maintained. There is no licence concern. It is listed here because its complexity is significant and simpler alternatives exist.

[Zot](https://github.com/project-zot/zot/releases) is a CNCF sandbox OCI-native registry under the Apache 2.0 licence. It is significantly simpler than Harbor: no built-in vulnerability scanning, no web UI equivalent to Harbor's, no proxy caching. It stores OCI artefacts and serves the distribution API. For organisations that handle scanning and signing outside the registry, Zot is a minimal, auditable alternative.

[Gitea Container Registry](https://github.com/go-gitea/gitea/releases) ships as part of Gitea, the self-hosted git platform. If the CI/CD platform were migrated to Gitea or Forgejo (see below), the container registry comes with it at no additional operational cost.

Harbor's integrated Trivy scanning is genuinely useful; any replacement would require Trivy to move entirely into the pipeline.

## Image signing

Current: [Cosign](https://github.com/sigstore/cosign/releases) (Sigstore project)

Cosign is maintained by the Sigstore project, a collaboration between Linux Foundation, Red Hat, Google, and Purdue University. The transparency log (Rekor) is operated by Sigstore, which is US non-profit-hosted infrastructure. Keyless signing via Fulcio depends on this infrastructure.

The risk is not the licence (Apache 2.0) but the hosted infrastructure dependency. If Rekor is unavailable, keyless signing fails. Mitigation: the key-based signing workflow (used for manual approvals of base images) does not depend on Rekor and continues to function independently.

[Notation](https://github.com/notaryproject/notation/releases) (Notary v2, CNCF) is the alternative image signing standard, backed by Docker and Microsoft. It uses OCI artefact manifests like Cosign but with a different trust model. Notation does not require Sigstore's transparency infrastructure; it uses standard X.509 trust chains instead. Less operationally convenient for pipeline signing, but eliminates the Rekor dependency.

A self-hosted Rekor instance is also possible for organisations with stricter data residency requirements; the Sigstore project publishes the server software under Apache 2.0.

## Kubernetes admission control

Current: [Kyverno](https://github.com/kyverno/kyverno/releases) (CNCF incubating)

Kyverno is Apache 2.0 and a CNCF incubating project. There is no licence concern. Its policies are plain YAML, which is the principal reason it was chosen over OPA/Gatekeeper.

[OPA Gatekeeper](https://github.com/open-policy-agent/gatekeeper/releases) is the other major option, also CNCF and Apache 2.0. Policies are written in Rego, a purpose-built policy language that is more expressive than Kyverno's YAML model but significantly harder to read and write. Rego's expressiveness becomes an advantage for complex multi-resource policies that Kyverno cannot handle cleanly. The teams at Golem Trust have no Rego experience; this is the realistic migration cost.

[Kubewarden](https://github.com/kubewarden/kubewarden-controller/releases) is a CNCF sandbox admission controller from SUSE (Germany). Policies are WebAssembly modules, which can be written in any language that compiles to WASM. This is technically interesting and provides strong policy isolation, but the toolchain is less mature than either Kyverno or Gatekeeper.

## SBOM tooling

Current: [Syft](https://github.com/anchore/syft/releases) and [Grype](https://github.com/anchore/grype/releases) (Anchore, US)

Both Syft and Grype are open source under the Apache 2.0 licence. The concern is not the licence but the company 
behind them; Anchore is US-incorporated and venture-backed.

[Trivy](https://github.com/aquasecurity/trivy/releases) generates SBOMs in CycloneDX and SPDX formats in addition to 
its vulnerability scanning role, which is already in use. Consolidating SBOM generation into Trivy would eliminate 
the Syft dependency; the output formats are equivalent. Grype and Trivy use different vulnerability databases; 
running both provides cross-validation but adds pipeline complexity.

[cdxgen](https://github.com/CycloneDX/cdxgen/releases) is an OWASP project (Apache 2.0) for generating CycloneDX SBOMs 
from source code. It supports more language ecosystems than Syft for source-level 
analysis. Useful if SBOM requirements extend to the application dependency graph.

## CI/CD platform

Current: [GitLab CE](https://about.gitlab.com/releases/categories/releases/)

GitLab CE is available under the MIT licence for the community edition. GitLab Inc. is a US-incorporated company and 
has a history of moving features from CE to the paid editions. The CI/CD features currently in use are all CE. The 
risk is that future pipeline security features land in paid editions only.

[Forgejo](https://codeberg.org/forgejo/forgejo/releases) is a French community fork of Gitea (itself a fork of Gogs), 
maintained under the Codeberg e.V. association in Germany, under the MIT licence. It includes a built-in CI system 
called Forgejo Actions, which is compatible with GitHub Actions workflow syntax. The migration cost from GitLab CI 
to Forgejo Actions is moderate: pipeline syntax differs, but the concepts map directly. Forgejo has no equivalent 
to GitLab's SAST template integration.

[Woodpecker CI](https://github.com/woodpecker-ci/woodpecker/releases) is a German-maintained open source CI system 
(Apache 2.0) that can attach to Gitea, Forgejo, or GitLab as a source control backend. It is simpler than GitLab CI 
and lacks the integrated security scanning templates, but it pairs naturally with a Forgejo migration.

A Forgejo plus Woodpecker CI stack would be fully European, fully open source, and operationally simpler than GitLab 
CE. The tradeoff is manual integration of SAST, Dependency-Check, and TruffleHog where GitLab CE provides templates.

## Dependency management

Current: [Renovate Bot](https://github.com/renovatebot/renovate/releases)

Renovate was acquired by Mend (US) in 2022. The core tool remains open source under the AGPL licence, and self-hosted 
deployment (as configured at Golem Trust) does not involve Mend's infrastructure. The licence concern is limited to 
the AGPL copyleft terms, which do not affect internal use.

[Dependabot](https://docs.github.com/en/code-security/dependabot) is GitHub-native and not suitable for self-hosted GitLab or Forgejo deployments.

There is no strong European alternative to Renovate at equivalent capability. If Renovate's licence becomes a 
problem, the practical path is to keep using the last AGPL-compatible version and patch it locally. For the current 
deployment scale, the complexity of dependency update automation is low enough that a simple cron-based script 
querying the PyPI/npm/Go module APIs would cover the majority of Renovate's value.

## Configuration management

Current: [Ansible](https://github.com/ansible/ansible/releases)

Ansible is maintained by Red Hat (IBM), open source under the GPL 2.0 licence. Red Hat and IBM are US companies. The licence has not changed and the project is well-established. There is no near-term risk.

[SaltStack](https://github.com/saltstack/salt/releases) (Apache 2.0, now owned by VMware/Broadcom) is the main alternative. It is more powerful than Ansible for large-scale deployments but significantly more complex. The licence trajectory under Broadcom is not reassuring.

For simpler configuration needs, [cloud-init](https://cloud-init.io/) (GPLv3 / Apache 2.0) combined with shell scripts handles server initialisation without a dedicated configuration management tool. It does not cover drift detection or idempotent re-application.

Ansible has no compelling European alternative at equivalent maturity. The risk profile is acceptable: the licence is strong copyleft (GPL), the project is too foundational to be abandoned, and the self-hosted deployment model means IBM has no operational leverage over the running infrastructure.

## Compliance scanning

Current: [OpenSCAP](https://github.com/OpenSCAP/openscap/releases)

OpenSCAP is maintained by Red Hat under the LGPL licence and is the reference implementation of the SCAP standard. There is no realistic alternative for SCAP-based CIS benchmark assessment.

[Lynis](https://github.com/CISOfy/lynis/releases) is a Dutch security auditing tool (GPL 3.0) from CISOfy, based in the Netherlands. It does not use SCAP profiles but performs similar hardening checks and produces human-readable reports. It is lighter-weight than OpenSCAP and does not require the full `scap-security-guide` package. Lynis is better suited to ad-hoc manual hardening checks; OpenSCAP is better suited to automated compliance assessment against a defined profile for audit purposes. The two are complementary.

[SecureCodeBox](https://github.com/secureCodeBox/secureCodeBox/releases) is a German open source security scanning orchestration platform (Apache 2.0) from iteratec GmbH in Munich. It orchestrates multiple scanners (including Trivy, Nikto, and nmap) as Kubernetes jobs and feeds results into DefectDojo. It is more relevant as an alternative to the overall scanning pipeline than to OpenSCAP specifically.

## Vulnerability tracking

Current: [DefectDojo](https://github.com/DefectDojo/django-DefectDojo/releases)

DefectDojo is an OWASP project under the BSD 3-Clause licence. The project is US-maintained but fully open source with no commercial entity driving licence changes. There is no near-term risk.

[Faraday](https://github.com/infobyte/faraday/releases) is an Argentine open source vulnerability management platform (GPL 3.0). It covers similar functionality to DefectDojo but with a stronger penetration testing workflow focus. For Golem Trust's use case (aggregating automated scan results from Wazuh, Trivy, and OpenSCAP), DefectDojo's import API support is better matched.

## GeoDNS and load balancing

Current: [Cloudflare](https://www.cloudflare.com/)

Cloudflare is a US company. The concern is not its current behaviour but its position as a single point of control over Golem Trust's external DNS, TLS termination, and DDoS mitigation. A Cloudflare account suspension or a US government order to Cloudflare would take down the external-facing services.

[Bunny.net](https://bunny.net/) is Slovenian (BunnyWay d.o.o., Ljubljana) and provides CDN, DNS, and load balancing services with European-majority infrastructure. It is a credible Cloudflare replacement for DNS routing and CDN, though its DDoS mitigation capacity is smaller than Cloudflare's.

[Infomaniak](https://www.infomaniak.com/) is Swiss and provides DNS hosting with GeoDNS capability. It has no CDN equivalent to Cloudflare's but covers the DNS failover use case cleanly.

For the GeoDNS and load balancing role specifically, running an authoritative DNS server on the Frankfurt monitor instance (already deployed for the failover health check) and handling DNS failover via standard NS record updates is a viable self-hosted option. It removes the Cloudflare dependency at the cost of eliminating Cloudflare's DDoS mitigation, which would need to be replaced separately.

## Related

- [Alternative tools: startup phase](../startup/alternative-tools.md)
