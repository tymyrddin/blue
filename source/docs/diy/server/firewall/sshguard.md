# SSHguard

[SSHguard](https://www.sshguard.net/) protects SSH and other services against brute-force attacks,
similar to [Fail2ban](fail2ban.md) but lighter and simpler to configure. It parses log output
directly from the systemd journal rather than log files and is not vulnerable to the log injection
attacks that have affected similar tools.

## Installation

```bash
# Debian/Ubuntu
apt install sshguard

# FreeBSD
pkg install sshguard
```

## Configuration

`/etc/sshguard.conf`:

```
# Firewall backend: match to the system firewall
BACKEND="/usr/lib/sshguard/sshg-fw-nft-sets"    # nftables
# BACKEND="/usr/lib/sshguard/sshg-fw-iptables"  # iptables
# BACKEND="/usr/lib/sshguard/sshg-fw-pf"        # OpenBSD pf

# Read from systemd journal
LOGREADER="LANG=C /bin/journalctl -afb -p info -n1 -t sshd -o cat"

# Attack thresholds
THRESHOLD=30         # cumulative attack score before blocking
BLOCK_TIME=120       # initial block duration in seconds (doubles on repeat offence)
DETECTION_TIME=1800  # window over which attack score accumulates
```

## Whitelist

Trusted addresses that bypass blocking go in `/etc/sshguard/whitelist`:

```
# Single address
203.0.113.1

# CIDR range
192.168.1.0/24

# IPv6
2001:db8::/32
```

## Enable and start

```bash
systemctl enable --now sshguard
```

## nftables integration

When using the nftables backend, SSHguard creates its own `sshguard` table with chains at priority
-10, processed before other nftables rules. No manual nftables changes are needed. See the
[nftables](nftables.md) page for how this fits into the broader ruleset.

## Checking blocked addresses

```bash
# View SSHguard's current block list
journalctl -u sshguard | grep "Blocking"

# For iptables backend: check the SSHguard chain
iptables -L sshguard -n
```