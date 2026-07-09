# Exposure

A startup running its own infrastructure faces two kinds of attacker: opportunistic and targeted. The distinction drives
which controls are worth the effort.

## Opportunistic attackers

The large majority of attacks on small organisations are opportunistic. An automated scanner finds an SSH port with
password authentication enabled and runs a credential list against it. A script checks for an open mail relay and begins
sending spam through it. A bot enumerates web paths looking for `.env` files, exposed admin panels, or unpatched
installations.

Opportunistic attackers are not interested in any particular organisation. They are looking for easy wins. A server that
does not offer easy wins gets skipped for one that does. Closing the common exposures removes an organisation from most
automated attack paths.

Common opportunistic vectors against small infrastructure:

- SSH with password authentication enabled (automated brute force and credential stuffing)
- Services exposed to the internet that have no business being there (databases, admin panels, internal APIs)
- Mail servers misconfigured as open relays (immediate blocklisting)
- Web applications running software with known CVEs (automated exploitation)
- Credentials committed to version control or left in accessible configuration files

None of these require a sophisticated attacker. All of them are preventable.

## Targeted attackers

A targeted attacker has a specific organisation or dataset in mind and is willing to invest more effort: a phishing
email to compromise a developer's credentials, which gives access to a private repository, which contains credentials
for a production server.

The controls in this section reduce how far a targeted attack can reach but do not stop a well-resourced, motivated
adversary. They raise the cost enough that many attackers move on, limit what can be reached from a single compromised
credential, and preserve enough evidence that an incident can be reconstructed after the fact.

## Incident patterns

Across small organisations, incidents that cause real damage cluster around a few patterns.

Credential compromise. A developer reuses a password exposed in an unrelated breach. An SSH key is committed to a public
repository. A cloud access key is left in a container image. The credential is found and used to access production.

Misconfigured services. An internal database is reachable from the internet because a firewall rule was added for
debugging and never removed. A staging environment shares credentials with production. A mail server was configured
permissively to fix a delivery problem and never tightened.

Unpatched software. A web application runs on a PHP version with a known remote code execution vulnerability. A
container image was built months ago and the base OS has accumulated CVEs.

Post-compromise persistence. An attacker who gains access installs a cron job or modifies a system binary. Without file
integrity monitoring and log forwarding, the presence goes undetected until the attacker uses it again.

## Priority

The controls worth applying first close the opportunistic attack surface: disable password authentication on SSH,
restrict inbound network access to only what each service legitimately needs, keep software patched, and ensure logs are
forwarded somewhere an attacker who owns the server cannot reach.

Detection comes second: the ability to know something went wrong and reconstruct what happened. An incident that cannot
be detected is worse than one that can, even when the initial compromise is the same.

Credential management is ongoing: who has access to what, what happens when someone leaves, and where credentials are
stored.
Last updated: 29 May 2026
