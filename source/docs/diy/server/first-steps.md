# Server hardening sequence

A server provisioned without additional configuration presents more attack surface than it needs to. The controls below close the most significant exposures first. The sequence reflects priority: each can be applied independently, but earlier steps close more exposure per hour spent than later ones.

## SSH key authentication

A server that accepts password authentication over SSH can be attacked by anyone who can reach port 22. There is no credential to steal beforehand; the attacker only needs a working password, and automated tools try thousands. Key authentication removes this entirely. A server that accepts only keys cannot be broken into by guessing credentials, regardless of how many attempts are made.

Disabling root login removes the known target. Root exists on every Linux system; its username is never a secret. Forcing attackers to first compromise an unprivileged account before attempting privilege escalation narrows the path, though it does not close it.

The dependency order is significant. Key authentication needs to work on at least one non-root account before the password path is closed. Getting this backwards produces a locked server. The [SSH hardening runbook](runbooks/harden-ssh.md) covers the full `sshd_config` settings.

## Inbound traffic restriction

A server that exposes only the ports it actually needs has less attack surface than one that exposes everything. The [firewall page](firewall.md) covers tool selection; the immediate question is what this server legitimately accepts from the network.

A web server needs 80 and 443. An SSH server needs 22, or wherever SSH has been moved. Database ports, admin panel ports, and internal API ports rarely belong on the public internet. Default-deny inbound with explicit permits is the right model; the alternative is hoping nothing reachable will be exploited.

An existing server is worth auditing with `ss -tulnp` before tightening rules, to see what is actually listening rather than what was intended.

## Automatic security updates

Unpatched software is a common entry point. A server waiting for manual updates accumulates known CVEs for weeks or months at a time. Enabling automatic security updates is a reasonable default for a team without a dedicated patching process.

On Debian/Ubuntu:

```
apt-get install unattended-upgrades
dpkg-reconfigure unattended-upgrades
```

The risk from automatic updates, a breaking change in a security patch, is real but smaller than the risk of running known-vulnerable software indefinitely.

## Administrative account scope

An administrative account with `ALL=(ALL) ALL` in sudoers is effectively root with an extra step. Compromising the account means compromising root. Scoping sudo to the commands actually needed means a compromised account can do damage only within that scope.

The [sudo runbook](runbooks/sudo.md) covers configuration. Programs with shell escape features in the allowed list, including vim, less, more, nmap, python, and perl, can be used to break out of the intended scope into a full shell. These belong out of sudoers on production machines.

## Log forwarding

Local logs can be modified or deleted by a root-level attacker. Logs already forwarded to a remote destination cannot. [Centralised logging](runbooks/centralised-logging.md) covers the setup; the point is to establish off-server copies before an incident, not during one.

An incident investigated with centralised log copies has a reconstructable timeline. An incident investigated with only local logs, after a root-level compromise with time to modify them, frequently has nothing useful left.

## File integrity baseline

File integrity monitoring requires a clean starting point. The baseline is only trustworthy if it was taken immediately after provisioning, before any external exposure. A baseline built on a system that was already compromised faithfully records the compromised state and will report it as clean.

[Samhain](runbooks/samhain.md) covers the setup. The baseline creation step needs to happen before the server goes into service.

## Package minimisation

Every service running on a server is a potential entry point. A server running only what it needs has less to audit and less to patch. Services installed for convenience and left running are a common source of exposure that accumulates silently.

`ss -tulnp` shows what is currently listening. Anything present without a clear operational purpose is worth questioning.
