# Deception technology

Angua is thinking about attackers. "We're playing defence. Always reacting. What if we made them come to us? Set traps?"

Dr. Crucible likes this idea. "Honeypots. Canary tokens. Deception infrastructure. Make the attack surface look 
larger than it is. When they bite, we know immediately."

Mr. Teatime, overhearing: "Traps are very effective. The Guild uses them extensively. Though usually more... permanent."

## What they built

Angua and Dr. Crucible deploy [Thinkst Canary tokens](https://github.com/thinkst/opencanary/releases) across 
infrastructure. Fake AWS credentials in public repositories (27 tokens), decoy database credentials in configuration 
files (14 tokens), fake admin accounts (8 tokens), honeydoc files with fake sensitive data (32 documents).

Every token is unique. When accessed, instant alert to SOC with context: what was accessed, from where, how. 
Forensic data collection automatic.

Honeypot services on production networks:

- honeypot-ssh.internal (fake SSH server, vulnerable by design)
- honeypot-db.internal (fake PostgreSQL with "sensitive" fake data)
- honeypot-api.internal (fake API with authentication bypass)

Honeypots look legitimate. Real-looking data. Realistic response times. But everything is fake and monitored.

Integration with Graylog and MISP. Honeypot activity triggers high-priority alerts. IP addresses added to MISP as 
indicators. Automatic blocking at firewall.

First major catch: attacker scans internal network, finds honeypot SSH server, spends 3 hours trying to exploit 
it (they succeed, it's vulnerable intentionally). They don't realize it's a trap until too late. Every action logged. 
Malware samples collected. TTPs analysed. Intelligence shared via MISP.

Wasted attacker time: 3 hours. Cost to Golem Trust: €8/month for honeypot VMs. ROI: excellent.

## Runbooks

* Canary token deployment
* Honeypot service setup
* Alert configuration
* Forensic data collection
* Integration with security tools

## Related

[Honeytech for humans](https://blue.tymyrddin.dev/docs/active/)
