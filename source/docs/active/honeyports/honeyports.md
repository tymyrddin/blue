# Honeyports: sweet lures

## What they do

Most attackers begin with reconnaissance: probing ports to find open services. Honeyports present as
open doors on enticing services (SSH, Telnet, SMB) but have no actual service behind them. When an
attacker connects, the honeyport logs the IP and optionally blocks further attempts via:

* Dynamic firewall rules.
* Alerts to a SIEM or SOC.
* DNS sinkholing.

## How it works

1. Choose a port (22 for SSH, 445 for SMB, or any port that has no legitimate traffic).
2. Do not install the actual service.
3. Start a listener: Python, PowerShell, Ruby, or netcat.
4. When a connection arrives, log it and fire off a response:
   * Add to a blocklist.
   * Trigger an alert.
   * Block at the firewall.

Works best on non-essential systems, or decoy hosts placed anywhere that has no legitimate reason to
receive inbound traffic on that port.

## Why it works

Attackers probe low-hanging fruit. A port that looks open is an invitation. Unlike traditional IDS/IPS,
honeyports do not rely on packet inspection or signature updates. They are simple, and that simplicity
is also what makes them hard to evade.

## Tools

* [Python honeyport (Linux/Windows)](python-honeyport.md)
* [PowerShell honeyport (Windows)](powershell-honeyport.md)

### Features common to both implementations

* Realistic SSH banners (Linux and Windows variants).
* Protocol mismatch error simulating SSH server behaviour.
* Delayed response simulating cryptographic negotiation.
* Auto-blocking: Linux via fail2ban to iptables; Windows via native firewall rules.
* Logging with timestamps.

On Windows, run the script as SYSTEM using Scheduled Tasks for persistence without a visible window.

### Other approaches

Netcat, Ruby, or Bash can all serve as simple listeners. The key requirement is that the port listens,
records the connection, and reacts.

## Portspoof

For a more disorienting approach: Portspoof responds on every port as though a plausible service is
running. Scanning tools see 65,535 apparent open ports and produce results that are difficult to act on.

```
sudo apt install portspoof
sudo portspoof -c /etc/portspoof/config
```

## Notes

* Use high-interaction traps only on isolated segments or dedicated decoy hosts.
* Automate alerts and blocking, but log everything: the connection history is worth reviewing later.
* Vary ports and behaviour periodically. Inconsistency is a feature: there is no stable fingerprint
  to probe for.
* Do not deploy honeyports on actual production ports. Funny once.

## Resources

* [Active Defence, Offensive Countermeasures, and Cyber Deception](https://www.blackhillsinfosec.com/wp-content/uploads/2020/04/Training_ActiveDefence_CyberDeception_April2020.pdf), John Strand, Bryce Galbraith and Paul Asadoorian, 2020
* [Github: gchetrick/honeyports](https://github.com/gchetrick/honeyports)
* [Github pages: portspoof](https://drk1wi.github.io/portspoof/)
Last updated: 16 May 2026
