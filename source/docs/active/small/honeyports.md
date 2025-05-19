# Honeyports: Sweet lures

Honeyports are the digital equivalent of leaving a shiny “Do Not Touch” button in plain sight—on an air-gapped or 
high-security network—just to see who can’t help themselves.

They’re particularly handy when your Intrusion Detection/Prevention System (IDS/IPS) is asleep at the wheel, your 
Next-Gen firewall isn’t quite as next-gen as advertised, or you're simply tired of zero-days skipping merrily past 
your defences.

## What’s the point?

Most attackers begin with reconnaissance: poking around to find open doors (aka ports) on your network. Honeyports 
look like open doors—usually on enticing services like SSH, Telnet, or SMB—but behind them is a tripwire, not a service.

When an attacker attempts to connect, the honeyport quietly logs the IP address and (optionally) slams the door shut 
behind them—automatically blocking future attempts via:

* Dynamic firewall rules
* Alerts to your SIEM/SOC
* DNS sinkholing
* A well-crafted passive-aggressive sysadmin email

## How it works

1. Choose a port (e.g., 22 for SSH, 445 for SMB).
2. Don’t install the actual service. That’s just inviting chaos.
3. Start a listener—Python, PowerShell, Ruby, or even Netcat will do.
4. When a connection hits the port, log it and fire off a response:
   * Add to a blacklist
   * Trigger an alert
   * Tag in your EDR
   * Block at the firewall

This works best on non-essential systems, or decoy hosts in more sensitive environments. In short: anywhere that 
should never be receiving inbound SSH traffic.

## Why it works

Attackers rarely resist low-hanging fruit. A port that looks open is an invitation. When they knock and the door 
bites back, you get early warning—before they’ve even tried anything serious.

Unlike traditional IDS/IPS, honeyports don’t rely on packet inspection or signature updates. They’re simple, dumb, 
and brutally effective. Which, ironically, makes them smarter than half your defensive stack.

## Tools of the trade

* [Python honeyport (Linux/Windows)](python-honeyport.md)
* [PowerShell honeyport (Windows)](powershell-honeyport.md)

### Features

* Realistic SSH banners (Linux/Windows variants)
* Protocol mismatch error - Common SSH server behaviour
* Delayed response - Simulates cryptographic negotiation
* Auto-blocking: Linux: fail2ban → iptables;  Windows: Native firewall rules
* Logging with timestamps for forensics

On Windows, run the script as `SYSTEM` using Scheduled Tasks for stealth.

### Ruby, Bash, Netcat, etc.

You can be as sophisticated or as scrappy as you like. The key is that the port listens, records, and reacts.

## Portspoof

Want to go full chaotic neutral? Use portspoof.

Instead of one or two honeyports, Portspoof pretends every port is open and running some (fake) plausible service. 
Scanning tools see 65,535 open ports and quickly descend into madness.

It’s like turning your server into a funhouse mirror maze—every port lies, and none of them are helpful.

```
sudo apt install portspoof
sudo portspoof -c /etc/portspoof/config
```

## Notes

* Use high-interaction traps only on isolated segments or sacrificial hosts.
* Automate alerts and blocking, but log everything. You may want to go back and see who fell for what.
* Rotate ports and tweak behaviour regularly—nothing says "go away" like inconsistency.
* Don’t use honeyports on actual production ports. You’ll be kicking out your own users. It’s funny once.

## Resources

* [Active Defense, Offensive Countermeasures, and Cyber Deception](https://www.blackhillsinfosec.com/wp-content/uploads/2020/04/Training_ActiveDefence_CyberDeception_April2020.pdf), John Strand, Bryce Galbraith and Paul Asadoorian, 2020
* [Github: gchetrick/honeyports](https://github.com/gchetrick/honeyports)
* [Github pages: portspoof](https://drk1wi.github.io/portspoof/)

