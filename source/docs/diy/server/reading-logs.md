# Reading server logs

Logs are evidence. The question is not whether something was logged but whether the pattern warrants investigation. Most authentication noise is automated and uninteresting; a few signal patterns are not.

## Authentication logs

`/var/log/auth.log` (Debian/Ubuntu) or `journalctl -u sshd` is where SSH authentication attempts appear.

Repeated `Failed password for root` from the same source IP is a targeted brute-force attempt. Root exists on every Linux system; its name is never a secret. Password authentication on SSH eliminates this attack surface entirely. If password authentication is still enabled, the volume of these entries reflects the level of exposure.

The same message from many different source IPs indicates a distributed attempt, spreading a credential list across multiple sources. Rate limiting on individual IPs provides less protection here; disabling password authentication does.

`Invalid user` before the username means the account does not exist on the server. A long run of these, with varying usernames (admin, test, ubuntu, pi, oracle), is an automated scan probing for default accounts. The probe itself is not an intrusion. A successful `Accepted publickey` or `Accepted password` from the same source shortly after would be.

`Accepted publickey` from a source IP outside the expected range is the highest-value finding in the SSH log. A key the server trusts was used from somewhere unexpected. This is not noise. It warrants investigation before any other explanation is accepted.

`sudo: username : USER=root ; COMMAND=/bin/bash` indicates a user ran a root shell through sudo. Outside normal maintenance windows, or from an account without a clear operational reason for unrestricted root access, this event is worth investigating. Combined with an unusual source IP in the SSH log shortly before, it suggests the account was the entry point for escalation.

## System integrity

`debsums -a` (Debian/Ubuntu) and `rpm -Va` (RHEL/CentOS) verify installed package files against expected checksums. Clean output is no output. Results showing modified system binaries, particularly ls, ps, netstat, top, and find, are a rootkit indicator. These are the binaries most commonly replaced to conceal an attacker's presence: a modified `ps` that omits certain processes, a modified `ls` that omits certain files.

A positive result does not necessarily mean a rootkit. Packages installed outside the package manager, manually compiled software, or mismatches from a partial upgrade also produce results. The distinction is in which files are affected. Core system utilities are not modified by normal operation.

## Cron and persistence

`crontab -l` for each user, plus `/etc/cron.d/`, `/etc/cron.daily/`, `/etc/cron.hourly/`, and `/var/spool/cron/crontabs/`. Cron is a common persistence mechanism. Jobs that download content from external URLs, commands that pipe output through a shell interpreter, or entries added after the server's provisioning date are the patterns worth flagging.

Modification timestamps on cron files are one signal; comparison against a file integrity baseline is more reliable and harder to fake.

## Centralised log forwarding

Logs on a compromised server can be modified or deleted by a root-level attacker. Logs already forwarded to a remote destination cannot. An investigation that relies on off-server copies has a more trustworthy timeline than one that depends on what was left on the machine.

The pattern worth looking for in centralised logs: authentication success following a period of failures from the same source, then a gap in log entries from the server, then later entries from a different source IP. The gap is the attacker modifying or deleting local logs; the earlier entries survived because they were already forwarded. An attacker who owns the machine does not own what has already left it.
Last updated: 29 May 2026
