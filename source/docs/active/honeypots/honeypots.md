# Honeypots: baited and logged

## Why use a honeypot?

Whether defending a home NAS or a small organisation's file server, honeypots help:

* Detect intrusions before they cause harm.
* Study attacker tactics without putting live systems at risk.
* Waste attacker time and bandwidth.
* Trigger alerts for unauthorised activity, ideally before damage occurs.

Even modest setups benefit. Home networks and small office gateways appear on Shodan within hours of
going online.

## What to deploy

There are several types of honeypot, from a minimal decoy to a full attack playground. The choice
depends on how much attacker interaction is useful to collect and how much risk is acceptable.

### Low-interaction honeypots

These simulate basic services (SSH, HTTP) without fully running them. Lightweight, easy to deploy,
and safe to operate.

* Honeyd: simulates entire networks of systems on a single host.
* Cowrie: fake SSH/Telnet server that logs every command.
* Dionaea: malware collection via vulnerable service emulation.

Good for:

* Home routers and NAS devices.
* Small office gateways.
* Raspberry Pi installations.

### High-interaction honeypots

These run real operating systems and services. More realistic, more informative, more risk.

* OpenCanary: low overhead, logs to syslog.
* T-Pot: all-in-one platform running multiple honeypots via Docker.
* Cuckoo Sandbox: malware analysis and detonation environment.

Good for:

* Security research.
* Blue teams with an isolated VLAN to work in.
* Anyone willing to manage the isolation carefully.

High-interaction honeypots can be turned against the defender if improperly isolated. Sandbox.

## Tools

* [Honeyd](honeyd.md): simulates multiple systems on a single host
* [Cowrie](cowrie.md): SSH/Telnet honeypot with detailed session logging
* [Dionaea](dionaea.md): malware collection via vulnerable service emulation
* [OpenCanary](opencanary.md): low-overhead, multi-protocol honeypot
* [T-Pot](tpot.md): all-in-one platform running multiple honeypots via Docker
* [Cuckoo](cuckoo.md): malware analysis sandbox

## Where to place honeypots

Strategic placement matters:

* DMZ: external-facing honeypots attract outside attackers.
* Internal network: catches compromised insiders or lateral movement.
* IoT subnet: devices that have no legitimate reason to probe internal hosts.

Be clear about what each honeypot is simulating, and avoid placing them on ports your actual services use.

## Integration and alerting

A honeypot only generates value if it is monitored:

* Log to Syslog, Splunk, or ELK.
* Use fail2ban to block IPs that probe the honeypot.
* Set up email or Slack alerts on activity.
* Tag honeypot traffic in Suricata or Zeek for correlation.

## Honeypots in small environments

Home and small business networks are common botnet recruitment targets and see regular brute-force
attempts. Honeypots provide:

* Early warning of activity that is not visible in normal logs.
* Threat intelligence about what automated attacks are actually doing.

A Raspberry Pi, an old laptop, or an unused VM is sufficient.

## What a honeypot is not

* Not a replacement for patching and hardening.
* Not a replacement for good logging on real systems.
* Not a firewall substitute.

Bait. Useful bait, but bait.
