# We need to see the network

Dr. Crucible stands in front of the whiteboard, markers in both hands, drawing network diagrams. He's been analysing 
the Seamstresses' Guild incident.

"The logs told us someone was attacking," he says, adding another layer to his diagram. "But they didn't tell us how 
they found us, what they tried before the web application, or what they did on the network level. We're reading the 
book from chapter 5. I want to see chapter 1."

Ponder frowns. "Network-level visibility? We'd need to tap into the actual traffic. That's... complex."

"Zeek," Ludmilla says from her corner. "The Überwald Institute uses it. Network security monitor. Parses protocols, 
generates transaction logs. Like having a librarian who reads every letter sent through the postal system and catalogs 
them."

Adora Belle looks up sharply. "That's an uncomfortably accurate metaphor given my former employment."

But she approves the project.

## What they built

Dr. Crucible deploys [Zeek](https://github.com/zeek/zeek/releases) on a cloud instance with 
[Suricata](https://suricata.io/category/release/) alongside it. They configure port mirroring on their main switch, 
feeding a copy of all traffic to the monitoring system.

Zeek operates as a network analysis framework, parsing protocols at a deep level: HTTP requests with full headers, 
DNS queries and responses, SSL/TLS certificate details, SMTP transactions, SSH connection metadata. Everything gets 
logged.

Suricata runs in IDS mode (not IPS, Adora Belle is cautious about inline blocking) using Emerging Threats Open 
ruleset plus custom rules Ludmilla writes.

Custom rules for Ankh-Morpork context: detect assassination-planning queries (the Assassins' Guild specifically 
requested this), detect unauthorised guild data access, detect banking fraud patterns (Moist von Lipwig's 
contribution after he joins as a security consultant).

All output feeds into Graylog. Zeek logs arrive in JSON format. Suricata alerts trigger immediate notifications.

Within two days, they discover a compromised developer workstation that's been beaconing to a Tsort-based command 
and control server. It's been happening for six weeks. The logs showed the beaconing. No one noticed because no 
one was looking at network-level patterns.

## Runbooks

* Zeek deployment
* Suricata configuration
* Port mirroring setup
* Custom script development
* Log integration with Graylog
* Rule tuning
* PCAP analysis procedures

