# Inter-utility / TSOs

EU-centred and practical for CNAs, lab teams and incident responders. 

It keeps defender priorities front and centre: detect, contain, evidence, coordinate.

Inter-utility exchanges are the nervous system of the grid: high-value, high-impact, and tightly connected across 
borders. Threats here are low-volume, high-consequence. Validation and testing require extreme caution, formal 
coordination and an emphasis on observation over test exploitation.

## Adversaries

* Nation-state actors and APTs with strategic objectives (esp. Russia-linked, China-linked and other geopolitically motivated groups).
* Well-resourced organised criminal groups seeking extortion or market manipulation.
* Malicious or negligent insiders at vendors, integrators or exchange operators.
* Supply-chain adversaries who compromise firmware, CI/CD or signing infrastructure.

## Assets

* ICCP/TASE.2 links and message flows between TSOs (state-level telemetry, transfer schedules).
* Market data (day-ahead, intraday settlements), dispatch instructions and contingency plans.
* Keys and certificates used for mutual TLS / IPsec / VPNs.
* Routing control (BGP/MPLS credentials, routing policies).
* Peering equipment (routers, switches, session border devices) and vendor appliances.

## Attack vectors

* Compromise of vendor build/signing servers or malicious firmware updates (supply-chain).
* Lateral movement from compromised corporate networks into exchange transport (poorly segmented VPNs, jump hosts).
* Credential theft (phishing of operator staff, stolen VPN tokens).
* Protocol abuse: malformed ICCP / TASE.2 messages, sequence/timestamp manipulation, or crafted capabilities negotiation.
* Network path manipulation: BGP hijack / route leaks, compromised IXPs, or MPLS misconfigurations that alter traffic flows.
* Misconfigured or over-trusting peering ACLs (accepting unauthenticated associations).

## Representative attacks

* Injected false telemetry or forged state that looks legitimate (appears to come from a peer) to influence dispatch and market decisions.
* Manipulate interconnect state to create islands or false tie-line capacities.
* Deny or degrade inter-utility signalling (association storms, crafted messages causing resource exhaustion).
* Persistent covert exfiltration of operational data for reconnaissance and later misuse.

## Assistive technologies (attackers, high level)

* Custom crafted ICCP/TASE.2 tooling and message encoders.
* Network interception platforms, BGP manipulation toolkits, and compromised CI/CD pipelines.
* Standard offensive tooling for credential harvesting, lateral movement and C2.
* Low-level packet crafting libraries (Scapy variants, custom MMS/ICCP generators) — defenders use similar for testing.

Defensive signals — knowing what attackers might use helps shape IDS rules, hunting and lab simulations. This is not 
an instruction set.

## Top threats

1. Authenticated-looking false data — forged ICCP messages that pass superficial checks and cause poor operational decisions.
2. Persistent covert access — long dwell time enabling timed disruption or sabotage.
3. Transport/path manipulation — BGP or routing attacks that reroute exchange traffic into hostile or unreliable paths.
4. Supply-chain implants — signed binaries or firmware that carry backdoors into many operators.

## Impacts

* Cross-border dispatch errors and cascading outages.
* Market distortion and financial losses at scale.
* Diplomatic/regulatory fallout (ENISA, national regulators, operator liability).
* Long-term loss of trust between TSOs and loss of shared automated procedures.


