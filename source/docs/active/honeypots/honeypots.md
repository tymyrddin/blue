# Honeypots: Baited and logged

## Why use a honeypot?

Whether you're defending the family NAS or a small organisation's file server, honeypots help:

* Detect intrusions before they cause harm.
* Study attacker tactics without putting live systems at risk.
* Waste their time, bandwidth, and hope.
* Trigger alerts for unauthorised activity, ideally before damage occurs.

Even modest setups benefit. Just because you're not MI6 doesn't mean you're not on someone's Shodan list.

## What to deploy

There are several flavours of honeypots, from "just enough to look interesting" to "full-blown attack playground". 
Choose your spice level:

### Low-interaction honeypots

These mimic basic services (e.g. SSH, HTTP) without fully running them. Lightweight, easy to deploy, and safe as houses.

* Honeyd – Simulates entire systems.
* Cowrie – Fake SSH/Telnet server. Logs everything. Very chatty.
* Dionaea – Malware catcher posing as vulnerable services.

Perfect for:

* Home routers/NAS
* Small office gateways
* Raspberry Pis with delusions of grandeur

### High-interaction honeypots

These run real operating systems and services (sacrificial lambs with Wireshark).

* OpenCanary – Dead simple, logs to syslog.
* T-Pot – All-in-one honeypot platform, runs via Docker.
* Cuckoo Sandbox – Malware analysis and detonation (if you like to live dangerously).

Perfect for:

* Security research
* Blue teams with a masochistic streak
* Enthusiasts with an isolated VLAN and too much time
* **Warning**: High-interaction honeypots are great research tools but can be turned against you if improperly isolated. Always sandbox.

## Tools of the trade

* [Honeyd](honeyd.md) for masochists who love config files
* [Cowrie](cowrie.md) for SSH voyeurs
* [Dionaea](dionaea.md) for malware hoarders
* [OpenCanary](opencanary.md) for the terminally lazy
* [T-Pot](tpot.md) for people who think Docker is a lifestyle
* [Cuckoo](cuckoo.md) for those who enjoy playing with fire

## Where to place honeypots

Strategic placement is key:

* DMZ – External-facing honeypots bait outside attackers.
* Internal network – Catch compromised insiders or lateral movement.
* IoT subnet – Because your "smart" lightbulbs aren’t.

Be clear what you’re simulating, and don’t run honeypots on production ports unless you're keen on debugging broken 
user logins.

## Integration & alerting

Don’t just run a honeypot and hope for the best. Integrate it:

* Log to Syslog, Splunk, or ELK
* Use fail2ban to block IPs hitting the honeypot
* Set up email or Slack alerts when activity is detected
* Tag honeypot traffic with Suricata or Zeek for deeper inspection

## Honeypots in small environments

Home and small business networks are soft targets, ripe for botnets, brute force, and crypto-rubbish. Honeypots offer:

* A canary in the coal mine to spot attacks early.
* A cheap deterrent at low cost, high value.
* Intel collection to learn what attackers are actually doing.

You don’t need a datacentre. A Raspberry Pi, an old laptop, or a corner of your ESXi box will do nicely.

## What a honeypot is not

* It’s not a silver bullet.
* It won’t stop an attack on its own.
* It’s not a replacement for patching, hardening, and good logging.
* And no, it’s not a reason to skip the firewall.

Think of it as bait. Useful bait, clever bait, but bait nonetheless.