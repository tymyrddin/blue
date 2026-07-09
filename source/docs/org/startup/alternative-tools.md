# Alternative tools

Cheery Littlebottom adds a line to the risk register: "Single-vendor dependency on US-incorporated open core software with proprietary licensing options." She shows it to Adora Belle.

"Which tools specifically?"

Cheery hands over a list. It includes HashiCorp Vault, Teleport, and Graylog, all of which changed their licences in the 
two years prior to Golem Trust adopting them. "They're open source today," Cheery says. "They were more open source 
last year."

Ludmilla looks up from her corner. "At the Überwald Engineering Guild we had a policy. If the company is American and 
the software is successful, wait three years and they will change the licence. We used European alternatives where we 
could."

Adora Belle looks at the list for a long moment. "We're not changing everything. But I want to know what we'd move 
to if we had to. Document it."

This is that document.

## Framing

The tools in current use were chosen for practical reasons: maturity, documentation, and the skills of the people 
available at the time. This document does not argue for replacing them; it maps the alternatives. If a licence 
changes, a vendor is acquired, or a project is abandoned, this is where you look next.

Preference is given to open source projects. Strong preference is given to projects with European origins, 
European maintainers, or European-based companies, on the grounds that they are more likely to fall under European 
data protection law, less likely to receive US National Security Letters, and, as Ludmilla puts it, "more likely 
to understand why we do things the way we do."

## Identity and access

Current: [Keycloak](https://github.com/keycloak/keycloak/releases)

[Authentik](https://github.com/goauthentik/authentik/releases) is the closest European alternative. It is open 
source (MIT licence), written by a German developer, and actively maintained. The user interface is more approachable 
than Keycloak's. It supports OIDC, SAML, LDAP, and RADIUS, covers most of what Keycloak provides, and adds 
flow-based authentication policy that Keycloak's authentication flows do not match cleanly. The main gap is enterprise 
support; Authentik is a smaller project and community support is the primary channel.

[Zitadel](https://github.com/zitadel/zitadel/releases) is Swiss. It is open source (Apache 2.0) and built cloud-native 
from the start, unlike Keycloak which carries significant legacy. Zitadel's hosted offering is EU-resident. For 
self-hosted deployments it uses PostgreSQL natively, which aligns with the existing database infrastructure.

Either would require re-implementing the golem authentication SPI. Authentik's flow system makes custom authentication 
steps easier to implement than Keycloak's SPI model; the golem chem verification logic would be a Python-based flow 
stage.

## Password management

Current: [Vaultwarden](https://github.com/dani-garcia/vaultwarden/releases) (Bitwarden-compatible)

[Passbolt](https://github.com/passbolt/passbolt_api/releases) is a Luxembourg-based company with a fully open source 
community edition (AGPL). Unlike Vaultwarden, Passbolt is the upstream product, which means it is not subject to 
Bitwarden changing its client API. Passbolt uses PGP for end-to-end encryption. The team integration features are 
stronger than Vaultwarden's. The main limitation is that Passbolt has no personal vault; it is designed for teams.

If Vaultwarden is replaced, Passbolt is the first choice. The migration path is not automatic; password collections 
would need to be exported and re-imported.

## Secrets management

Current: [HashiCorp Vault](https://releases.hashicorp.com/vault/)

HashiCorp changed Vault's licence to the Business Source Licence (BSL 1.1) in August 2023. The BSL restricts use in 
competing products but does not affect self-hosted use by non-competing organisations. Golem Trust does not compete 
with HashiCorp. The licence change does not require immediate action.

However, the change motivated a community fork.

[OpenBao](https://github.com/openbao/openbao/releases) is the community fork of Vault under the Mozilla Public 
Licence 2.0. It is hosted by the Linux Foundation and maintained by contributors from IBM, Wallix (French), and others. 
It is API-compatible with Vault; the migration from Vault to OpenBao is a drop-in replacement of the binary. All 
existing runbooks apply without modification.

OpenBao is the preferred migration path if HashiCorp changes the Vault licence further or is acquired by a company 
whose data handling practices are incompatible with Golem Trust's obligations under Disc data protection law.

## Secret scanning

Current: [TruffleHog](https://github.com/trufflesecurity/trufflehog/releases) and [git-secrets](https://github.com/awslabs/git-secrets)

`git-secrets` is an AWS project. It works well but is not actively developed. 
[Gitleaks](https://github.com/gitleaks/gitleaks/releases) is an open source alternative under the MIT licence, written 
in Go, with a broader set of default detection rules, a more active release cadence, and a configuration format that 
is easier to extend with custom patterns. It covers both pre-commit and CI/CD scanning in a single binary.

Gitleaks does not have a clear European provenance; it is maintained by a US contributor. It is fully open source 
under MIT. If the provenance concern outweighs the practical advantage, the combination of `git-secrets` plus a 
custom rule set remains adequate.

## Centralised logging

Current: [Graylog](https://graylog.org/releases/)

Graylog changed its licence in 2022 from Apache 2.0 to the Server Side Public Licence (SSPL) for new features. 
The version deployed at Golem Trust predates some of these changes, but the trajectory is noted.

[OpenSearch](https://github.com/opensearch-project/OpenSearch/releases) with [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/releases) is the most direct replacement, given that OpenSearch is already the backend search engine for the current Graylog deployment. Replacing Graylog with OpenSearch Dashboards eliminates the SSPL component while retaining the storage layer. The main loss is Graylog's stream routing and alert condition logic, which would need to be rebuilt as OpenSearch alerting rules.

[Wazuh](https://github.com/wazuh/wazuh/releases) is a Spanish open source security platform (GPL 2.0). It combines 
log collection, SIEM, intrusion detection, and alert management into a single product. It is more opinionated than 
the current Graylog setup and would replace Graylog plus elements of the Suricata pipeline. The company is based in 
Madrid and subject to EU law.

## Metrics and dashboards

Current: [Prometheus](https://github.com/prometheus/prometheus/releases) and [Grafana](https://github.com/grafana/grafana/releases)

Prometheus is a CNCF project under the Apache 2.0 licence. There is no licence concern here; it is noted for completeness.

Grafana Labs is a Norwegian-American company. The open source edition of Grafana is AGPL. The licence has not changed. 
If it does, [Perses](https://github.com/perses/perses/releases) is a CNCF-incubating dashboard project under the Apache 
2.0 licence with Prometheus compatibility. It is early-stage but worth watching.

[VictoriaMetrics](https://github.com/VictoriaMetrics/VictoriaMetrics/releases) is an open source time series database 
(Apache 2.0) with Prometheus-compatible ingestion and query APIs. It is more resource-efficient than Prometheus at 
the same retention period and supports longer data retention without degradation. The project is fully open source with 
no licence concerns. It is a drop-in replacement for the Prometheus storage layer.

## Network security monitoring

Current: [Zeek](https://github.com/zeek/zeek/releases) and [Suricata](https://suricata.io/category/release/)

Both Zeek and Suricata are open source under BSD and GPL licences respectively. Suricata is maintained by the Open 
Information Security Foundation (OISF), a US non-profit with broad international support. Neither has a meaningful 
European alternative at the same capability level.

[Arkime](https://github.com/arkime/arkime/releases) (formerly Moloch) is a full packet capture and search system, 
open source under Apache 2.0. It complements Zeek and Suricata, providing queryable PCAP storage 
for the cases where Zeek logs are insufficient. It would replace the manual PCAP capture procedures in the current 
runbook with a searchable archive.

[ntopng](https://github.com/ntop/ntopng/releases) is an Italian network traffic analysis tool (GPL). It provides 
real-time traffic visibility and is lighter-weight than the full Zeek deployment. For smaller environments, it 
covers much of what Zeek provides without the scripting complexity.

## Infrastructure access

Current: [Teleport](https://goteleport.com/docs/upcoming-releases/)

Teleport is US-incorporated under Apache 2.0 for its open source edition. It has not changed its licence but the 
company has raised significant US venture capital, which carries acquisition risk.

[Boundary](https://www.boundaryproject.io/) is HashiCorp's equivalent product. It shares the BSL licence concern 
noted for Vault; not recommended as a replacement.

[Smallstep](https://github.com/smallstep/certificates/releases) is an open source certificate authority (Apache 2.0). 
It does not provide the full session recording and access request workflow that Teleport provides, but it covers the 
certificate issuance side cleanly and can be combined with standard OpenSSH session recording. For organisations with 
simpler access control requirements, Smallstep plus a manual approval workflow achieves most of the current Teleport 
value at lower complexity.

[Wallix Bastion](https://www.wallix.com/) is a French Privileged Access Management product. It is not open source 
in its full form, but the company is European, subject to EU law, and offers a feature set that exceeds Teleport's 
for regulated environments. Relevant if Golem Trust's compliance requirements grow to the point where a supported 
commercial PAM product is warranted.

## Backup

Current: [Restic](https://github.com/restic/restic/releases)

Restic is open source under the BSD 2-Clause licence, written by a German developer (Alexander Neumann), and has no 
commercial entity behind it. There is no licence concern. It is listed here for completeness.

[BorgBackup](https://github.com/borgbackup/borg/releases) is an alternative with similar capabilities: deduplication, 
encryption, and remote repositories. It has a long history and a strong European contributor base. The primary 
operational difference is that Borg repositories are less portable between machines without the original host's 
configuration; Restic repositories can be accessed from any machine with the password. For the current deployment, 
Restic's portability advantage is meaningful for DR scenarios.

[Kopia](https://github.com/kopia/kopia/releases) is a newer open source backup tool (Apache 2.0) with a web UI and 
faster deduplication algorithms than either Restic or Borg. It supports the same storage backends and is worth 
considering for future deployments if Restic's performance becomes a constraint.

## Cloud infrastructure

Current: [Hetzner](https://www.hetzner.com/cloud/) (German)

Hetzner is already the correct choice on European grounds. Alternatives are documented in case Hetzner is unavailable 
or a specific region requirement arises.

[Scaleway](https://www.scaleway.com/) is French (Iliad group). It covers Paris, Amsterdam, and Warsaw regions and 
offers similar instance types to Hetzner at comparable pricing. Its object storage is S3-compatible and EU-resident.

[OVHcloud](https://www.ovhcloud.com/) is French and the largest European cloud provider by capacity. It covers more 
regions than Hetzner and has stronger enterprise support. Its pricing is higher for equivalent instances.

[IONOS](https://www.ionos.co.uk/servers/vps) is German (Deutsche Telekom group). It covers Germany, UK, and US regions. 
Its API is less mature than Hetzner's or Scaleway's, but it is fully European and well-established.

Any of the three would serve as a Hetzner replacement. The runbooks assume Hetzner-specific features (private networks, 
load balancers, Storage Boxes) in several places; a migration would require updating the networking and backup storage 
configurations but not the application layer.

## Related

- [Initial threat modeling: physical and remote access](https://purple.tymyrddin.dev/docs/threat-modelling/)
Last updated: 09 July 2026
