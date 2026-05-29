# The server hardening stack

Server hardening controls fall into four layers: access and authentication, which determines who can reach the system and how; network exposure, which controls what services are reachable in the first place; process and filesystem confinement, which limits what a process can do even after it has started; and detection and recovery, which addresses what happens when something gets through. The layers are not sequential. Several controls in later layers compensate for gaps that earlier layers cannot close.

## Access and authentication

### Disabling root and using SSH keys

[Disabling direct root login](runbooks/disable-root.md) over SSH forces an attacker to compromise a regular user account before attempting privilege escalation. It narrows the target but does not eliminate it: a compromised sudo user is one command away from root if sudo is not scoped.

[SSH key authentication](runbooks/harden-ssh.md) removes the password brute-force attack surface entirely. A server that accepts only key-based authentication cannot be broken into by guessing credentials, regardless of how many attempts an attacker makes. [Fail2ban](runbooks/fail2ban.md) rate-limits authentication attempts and issues temporary bans on repeated failures, which is useful for services that cannot drop passwords entirely (web auth, mail auth, admin panels), but it is a rate-limiter, not a substitute for strong authentication. Against a distributed brute force using many source IPs, it provides limited protection. Key auth removes the need for it on SSH.

### sudo and least privilege

[Sudo](runbooks/sudo.md) scoped to specific commands limits what a compromised user account can escalate to. An account with unrestricted `ALL=(ALL) ALL` in sudoers is effectively root with an extra step. Restricting sudo to the commands a user actually needs means a compromised account can cause damage only within that scope.

Two gaps persist. Programs with shell escape features (`vim`, `less`, `more`, `emacs`) can be used to break out of a restricted command scope into a full shell. And user-owned scripts granted sudo privileges can be edited by the user to include arbitrary commands. Both paths are addressed by using `sudoedit` for file editing, restricting script ownership to root, and auditing the sudoers file periodically.

### PAM

PAM sits beneath authentication for local logins, sudo, and other services. It enforces password complexity, prevents reuse of recent passwords, and can restrict which users are permitted to authenticate via specific services. A server relying on SSH key auth still benefits from PAM for console access and for services that use local credentials.

PAM has no visibility into SSH key authentication. Key management (rotation, revocation, controlling which keys are authorised) is handled entirely through `authorized_keys` files and is outside PAM's scope.

## Network exposure

### Firewall and service minimisation

A [firewall](firewall.md) restricts which ports and protocols reach the server. It limits the attack surface to the services that are explicitly permitted. What it does not do is protect against a successful connection to a permitted port: a firewall that allows SSH does not prevent a successful SSH login.

Service minimisation addresses what the firewall cannot. A service that is not running cannot be exploited, regardless of firewall rules. [Auditing running services](runbooks/systemctl.md) and disabling those that serve no purpose reduces the number of permitted ports that carry real exposure.

The gap neither control addresses is lateral movement after access. Once an attacker is inside a permitted service, firewall rules between external hosts and the server no longer apply. Egress filtering and internal network segmentation are the relevant controls there, but they operate at a different layer.

## Process and filesystem confinement

### DAC and ACL

Discretionary access control through standard Unix permissions and ACLs controls which users and processes can read, write, or execute files. It is the baseline layer and the one most often misconfigured. SUID and SGID bits on executables grant the process the owner's privileges rather than the caller's; a root-owned SUID binary that an attacker can influence becomes a privilege escalation path.

DAC is enforced by the kernel but scoped to the identity of the calling user or process. A process running as root has no DAC restriction. An attacker who gains root through any path bypasses DAC entirely.

### MAC

Mandatory access control through SELinux or AppArmor operates independently of DAC and independently of the running user. A process confined by an AppArmor profile cannot access files outside the paths that profile allows, even if the process runs as root. SELinux applies labels to every subject and object on the system and enforces policy at the kernel level.

MAC is what closes the gap DAC leaves open. A web server process compromised through a vulnerability in the application can be prevented by MAC from reading `/etc/shadow`, writing to system directories, or spawning shells, regardless of what user it runs as. The control is only as good as its profiles: a permissive or incomplete MAC profile for a service provides little protection for that service specifically.

## Detection and recovery

### File integrity monitoring

[Samhain](runbooks/samhain.md) maintains a cryptographically verified baseline of the filesystem and alerts on changes to binaries, configuration files, SUID executables, and running processes. It is a detection control, not a prevention one. Its value is catching an attacker who has already succeeded but is still present: modified system binaries, new SUID files, hidden processes.

The baseline requires a clean initial state. A baseline built on a system that is already compromised is not a reliable reference. And an attacker with root access can attempt to subvert the monitoring itself, which is why Samhain supports [stealth operation](runbooks/samhain.md) and remote log forwarding.

### Log monitoring and centralisation

[Log monitoring](runbooks/log-commands.md) captures authentication events, sudo use, service starts and stops, and configuration changes as they happen. [Centralised logging](runbooks/centralised-logging.md) sends those logs off the server to a remote destination, out of reach of a root-level attacker who can modify or delete local logs. Logs that have already been forwarded are harder to reach.

Logs are only useful when someone or something is watching them. Centralisation creates the foundation for alerting and correlation; the monitoring layer on top of it is outside the scope of these pages.

### Backup and configuration management

[Backup](../incidents/backup.md) is the recovery control the rest of the stack assumes exists. Prevention and detection controls reduce the likelihood and impact of an incident; backup determines whether the system can be restored when they fail. An untested backup is an unknown quantity.

Configuration under version control means a compromised or broken configuration can be identified and rolled back. Combined with backup, it separates the state of the operating system (data backup) from the state of its configuration (version control), allowing either to be restored independently.

## What the stack does not address

A compromised administrator credential with an authorised SSH key and unrestricted sudo makes the entire stack above irrelevant. The controls assume the credentials used to administer the server are not themselves compromised. Key management, credential hygiene, and out-of-band authentication for administrative access are the controls that protect that assumption, and they operate mostly outside what a single server can enforce about itself.

Kernel vulnerabilities and unpatched software expose the server regardless of configuration hardening. The stack described here controls configuration; it depends on the software underneath being kept current.

Physical access bypasses all of it. A server that can be booted from external media or whose storage can be removed has no meaningful access control at the operating system level. Physical security is the layer the entire stack sits on.

Supply chain compromise, a backdoored package, a tampered base image, or a malicious dependency, can introduce an attacker before any of these controls are applied. Verifying package signatures, using known-good base images, and maintaining an inventory of installed software reduce but do not eliminate that surface.
