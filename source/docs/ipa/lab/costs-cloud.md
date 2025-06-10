# Cost estimate for IPA-SIEM in your own private cloud

This setup gives you full control: no AWS, no Google, no Azure snooping. But running your own infrastructure does come 
with real-world costs—especially in terms of time and expertise.

## Private cloud server

We’ll assume a mid-range VPS from a privacy-respecting European host (e.g. Hetzner, Netcup, 1984 Hosting).

* **Specs**: 4 vCPU, 8–16 GB RAM, 100 GB SSD, Ubuntu 22.04
* Monthly cost: **€15–€30**
* Annual cost: **\~€300**

*Go for at least 8 GB RAM. SIEM stacks are not lightweight.*

## Hardening & base security tools

* Fail2ban, UFW, Unattended-upgrades = free (open source)
* Admin time to configure and test: 4 hours × €60/hour = **€240**

## IPA-SIEM installation (Wazuh stack)

* Wazuh Manager, API, Elasticsearch, Kibana
* Software cost: **€0** (all open source)
* Initial setup and tuning: 1–2 days of expert time = **€500–€1,000**

*Can be done by a capable tech volunteer—but budget for fallback help.*

## VPN setup (WireGuard/OpenVPN)

* Software: free
* Setup time: 3 hours (server + initial clients) = **€180**
* Ongoing: key rotation, diagnostics, client support

## Remote agent deployment

* Installing and configuring agents on Windows/macOS:
  Assume 10–20 survivor devices
  Setup per device: \~30 mins → 10 hours total = **€600**

* Android/iOS log extraction:
  Manual (ADB, backups, etc.) or scripted
  Time & training cost: **€400–€600**

## Optional: PiRogue triage kit

* 1 x PiRogue = \~€150 hardware + shipping
* Setup, training: 3 hours = **€180**

## Secure storage, backup & encryption

* Use server’s 100 GB SSD; rotate compressed logs
* Extra backup space (external or offsite): €2/month → **€24/year**
* Encryption tools (GPG, age): free
* Admin scripting time: 2–4 hours = **€120–€240**

## Ongoing maintenance & support

* VPN key rotation, log rotation, alert checks
* Monthly admin budget: 4–6 hours × €60 = **€240–€360/month**
* Annual total: **€2,880–€4,320**

## Contingency & training

* Contingency (mistakes, downtime, unexpected updates): **€500**
* Internal training/documentation for staff: **€300**

## Summary: Total cost estimate (Year 1)

| Item                                 |  Estimated Cost (€) |
|--|--:|
| Private cloud server                 |                €300 |
| Server hardening                     |                €240 |
| IPA-SIEM install & tuning            |         €500–€1,000 |
| VPN setup                            |                €180 |
| Device agent setup (10–20 survivors) |                €600 |
| Android/iOS log collection tooling   |           €400–€600 |
| PiRogue (optional)                   |                €330 |
| Secure backups & automation          |           €144–€264 |
| Ongoing maintenance (admin time)     |       €2,880–€4,320 |
| Training & contingency               |                €800 |
| **Total (Year 1)**                   | **€6,374 – €8,634** |

## Ongoing yearly cost (Year 2+)

Once built and documented, the private cloud stack is cheaper to keep going:

* Server: €300/year
* Maintenance: €3,000–€4,000
* Occasional retraining or update costs

**Estimated annual cost: \~€3,500–€4,500**

## Notes for budget planning

* Cost varies based on how many devices and people you support
* Volunteer labour or student placements can reduce costs, but require coordination
* Grant proposals should include staff time and contingency for scaling or support
* This setup *can* be shared between multiple shelters with secure VPNs

