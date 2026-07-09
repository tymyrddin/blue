# Server hardening gaps

The scenarios below describe what becomes exploitable when a server hardening control is absent or misconfigured. The controls build on each other: a gap early in the stack often determines how far an attacker gets once they are in.

## Root SSH login enabled

The target account is known (root), its existence is guaranteed on every Linux system, and its privileges are total. Brute force or credential stuffing requires only a valid password. Any IP address that can reach port 22 can attempt authentication indefinitely, constrained only by rate limiting that may or may not be in place.

Disabling `PermitRootLogin` forces attackers to first identify a valid user account before attempting escalation. Named accounts with `sudo` scoped to what they need provide the same operational access with a smaller attack surface.

## Password authentication alongside SSH keys

Keys are deployed and working. Passwords are still accepted. A stolen password, from phishing, credential reuse, or a data breach affecting another service where the user reused credentials, bypasses the key requirement entirely. Fail2ban slows targeted brute force but a distributed attempt across many source IPs, or a single correct credential, succeeds regardless of the rate limiting in place.

Setting `PasswordAuthentication no` in `sshd_config` removes the password path once keys are confirmed working on all accounts that need access.

## Sudo with NOPASSWD for broad commands

A compromised session, an unattended terminal, a stolen session token, or a brief moment of physical access gives someone control of the user account. NOPASSWD means no additional authentication stands between that access and root. A momentary opportunity escalates immediately and silently.

Removing NOPASSWD and scoping sudo to specific named commands limits what a compromised session can do. An attacker who gets the user account gets only what that account is permitted to do.

## MAC in permissive mode

AppArmor or SELinux is installed, the service is running, and the audit log is filling up with violations. Nothing is blocked. A compromised web server process reads `/etc/shadow`, writes a cron entry, or spawns a reverse shell. The MAC framework records each violation faithfully; the attacker proceeds through them without friction. Permissive mode is intended for policy development.

Setting profiles to enforce mode after confirming that legitimate application behaviour generates no violations closes this. The log from permissive mode is the input to that confirmation.

## Root-owned SUID binary in a writable location

A root-owned binary with the SUID bit is present in a directory writable by a low-privilege user, or the binary accepts input it uses to execute commands. An attacker with low-privilege access runs the binary as their own user; it executes with root privileges, doing whatever the attacker influences it to do. SUID binaries exist for legitimate reasons; the population of them accumulates over time and is rarely audited.

Reviewing all SUID and SGID binaries, removing those that no longer serve a purpose, and confirming that none are in world-writable locations closes the unnecessary exposure. What cannot be removed can be restricted via MAC profiles.

## Local logs only, no centralised destination

A root-level compromise gives the attacker access to `/var/log`. Relevant log files are deleted, truncated, or modified. The authentication events, privilege escalations, and lateral movement steps leave no verifiable trace on the system. A forensic investigation starts with no timeline.

Forwarding logs to a remote destination as they are written means a root compromise on the server cannot reach the already-shipped entries. An attacker who controls the machine does not control what has already left it.

## FIM baseline taken post-compromise, or never taken

File integrity monitoring runs and reports clean. The system binaries were replaced before the baseline was built: `ls`, `ps`, `netstat`, and `top` have been swapped for versions that conceal the attacker's files and processes. The FIM has an accurate record of the compromised state and will report accurately against it, finding nothing. The absence of alerts is not evidence of a clean system; it is evidence the baseline matches whatever was there at baseline time.

Taking the baseline immediately after provisioning, before any external exposure, and verifying the baseline file itself against an out-of-band reference closes this. A baseline is only as trustworthy as the state it was taken on.

## Firewall blocking inbound but permitting all outbound

Ingress is controlled. Egress is open. A compromised service establishes a reverse shell to an external server, exfiltrates data to a cloud storage endpoint, or begins scanning internal network ranges. All of it goes through outbound connections the firewall never examines. Controlling what enters a network while ignoring what leaves it addresses only half the perimeter.

Explicit egress rules that permit only the traffic each service legitimately requires close this. A web server with no legitimate reason to connect to arbitrary external hosts on port 443 cannot do so under a well-scoped egress policy.
