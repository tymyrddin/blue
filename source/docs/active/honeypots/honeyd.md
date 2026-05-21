# Honeyd

Simulates entire networks of virtual systems on a single host. Each virtual system can have its own
personality (OS fingerprint), open ports, and service scripts. Useful for populating an address range
with plausible-looking targets.

## Installation (Debian/Ubuntu)

```bash
sudo apt install honeyd
```

## Configuration

Edit `/etc/honeypot/honeyd.conf`:

```
create default
set default personality "Windows XP"
bind 10.0.0.1 default
add default tcp port 22 "sh /etc/honeyd/scripts/fake-ssh.sh"
```

The `"Windows XP"` personality attracts automated scanners probing for legacy Windows
vulnerabilities: EternalBlue (MS17-010), older SMB weaknesses, and Mirai-variant bots that include
Windows XP fingerprints in their target lists. It remains useful for observing opportunistic and
botnet-driven scanning. For research focused on current threat actors, a Windows 10 or Windows Server
2019 personality is likely to surface more representative traffic. Honeyd ships with many personality
definitions; the choice depends on what attacker behaviour the deployment aims to observe.

## Usage

```bash
sudo honeyd -d -f /etc/honeyd.conf
```

## Integration

* Syslog: add `log syslog` to the config.
* fail2ban: filter SSH attempts with:

```
[honeyd-ssh]  
enabled = true  
filter = sshd  
logpath = /var/log/syslog
```
