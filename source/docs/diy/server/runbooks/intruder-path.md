# Compromise investigation: what to look for

Investigation runbook. A checklist of what an intruder typically does after gaining access, and the traces each step leaves. Used to work out whether a server has been compromised and how far the intruder got. It assumes a suspected compromise is already being investigated; for the first containment decisions, see [the first hour](../../incidents/first-hour.md).

## When to use

When a server is suspected of being compromised and the question is what the intruder did. Alongside [log reading](log-commands.md) and a [file integrity check](samhain.md).

## Risk

On a compromised server, the system's own tools may have been replaced to hide the intruder. `ps`, `ls`, `netstat`, `top`, and `ifconfig` are common targets. Output from these on a suspect host can be misleading. Where it counts, inspect from a [trusted live environment](brm.md).

## The typical path, and its traces

An intruder who gets in through a vulnerability usually follows a recognisable sequence. Each step leaves something to look for.

### Privilege escalation

The intruder wants root, to install software, reach data, or clear their tracks. Check for accounts that have gained superuser rights:

```
awk -F: '$3 == 0 {print $1}' /etc/passwd      # every account with uid 0
```

More than one result (just `root` is normal) is a finding.

### New accounts

Some intruders add an account, occasionally with no password. Check for recently added or password-less accounts:

```
sudo lastb                                     # failed logins
sudo awk -F: '$2 == "" {print $1}' /etc/shadow # accounts with no password
```

Compare `/etc/passwd` against a known-good list if one exists.

### Network capture

An intruder collecting credentials from the network puts an interface into promiscuous mode. Check for it:

```
ip link | grep -i promisc
```

### Hidden files and tools

Sniffer binaries, their config, and captured data are often hidden in `/dev`, which should contain device nodes:

```
find /dev -type f
```

Any regular file here is a finding.

### Replaced binaries

A more careful intruder replaces system binaries to conceal their presence: `su`, `ifconfig`, `ls`, `ps`, `find`, `netstat`, `top`. A [file integrity check](samhain.md) detects these. Without a baseline, package verification is the fallback:

```
debsums -c                 # Debian/Ubuntu: report changed package files
rpm -Va                    # RHEL/CentOS: same
```

Changes to core utilities like `ls` and `ps` are a rootkit indicator.

## Reconstructing the timeline

The events that matter most for reconstructing what happened:

- Logins and logouts, and from where (`last`, auth log)
- User and group changes (account creation, group membership)
- Service starts and stops
- Configuration changes
- Shutdowns and restarts

Web and FTP servers keep their own logs separate from syslog; include those.

## Done

Each item above has been checked. The findings establish whether a compromise occurred and, where it did, what the intruder reached. The results feed the containment and recovery decisions.

## Follow-up

- For containment, evidence preservation, and escalation, see [the first hour](../../incidents/first-hour.md).
- Recovery from a confirmed compromise generally means a rebuild from [verified backups](../../incidents/runbooks/backup-verification.md).
Last updated: 10 July 2026
