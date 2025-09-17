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

## Standards, bodies and EU actors

* Protocols / standards: ICCP / TASE.2 (IEC 60870-6), IEC 61850 for substation comms, IEC 62351 (security for power systems), BGP / RPKI for routing.
* EU actors: ENISA (guidance, cross-border coordination), CERT-EU (EU institutions), national CSIRTs — BSI (Germany), ANSSI (France), NCSC-NL (Netherlands), CERT-FR, CERT-RO etc.
* Regulators: ACER, national energy regulators (Ofgem, CRE, Bundesnetzagentur, etc.).
* TSO examples (EU): TenneT, RTE, Red Eléctrica, Terna, Elia — these names are examples of stakeholders who operate interconnects.
* Legal / compliance: NIS2, GDPR (if market data contains personal data), applicable national critical infrastructure rules, upcoming Cyber Resilience Act for vendor obligations.

## Defensive controls

1. Mutual authentication for interconnects — mutual TLS with properly managed PKI, short-lived certs and hardware security modules (HSMs) for key protection.
2. Protocol hardening & strict parsing — robust, spec-compliant ICCP/TASE.2 stacks, input validation, reject unknown capabilities.
3. Network path security — RPKI, BGP monitoring, route-origin validation and automated BGP anomaly detection (moreover monitor MPLS label integrity).
4. Peer ACLs and whitelisting — per-peer IP and certificate binding; refuse unauthenticated associations.
5. Least privilege for vendor access — jump hosts, MFA, ephemeral credentials and recorded sessions (session recording).
6. Supply-chain assurance — signed release pipelines, reproducible builds, code signing verification.
7. Segmentation and choke points — DMZs, restricted crossing points between corporate and exchange networks.
8. Anomaly detection at protocol level — SIEM/IDS rules for ICCP/TASE.2 anomalies: unusual association rates, timestamp anomalies, capability changes.
9. Robust logging and immutable evidence — write-once storage for PCAPs, signed hashes, and strict access controls.

## Detection and indicators

* Sudden association attempts from unexpected peers or IPs.
* Rapid succession of ICCP/TASE.2 capability negotiations or association retries.
* Timestamp anomalies: far-future timestamps, impossible sequence jumps.
* Unusual volume of cross-border telemetry differing from baseline.
* BGP route changes affecting peering prefixes correlated to message anomalies.
* Unexpected changes in certificates, PKI events, or unexpected revocation lists.

## Lab validation (CNA)

Do not test on production exchange links. Always coordinate with TSOs and national CSIRT if there is any cross-border 
scope.

### Safe-first approach

* Emulation first: extract vendor stack (if available) and run ICCP/TASE.2 in QEMU or a sandbox to test parsing/association behaviour.
* Use stub peers only in isolated lab VLANs and with no path to production. Emulate minimal peer behaviours (association, forwarding) rather than full production traffic.
* Avoid live BGP manipulations on public internet — simulate route changes in a private lab or using RPKI/BGP testbeds.

### Canonical tests

1. Baseline capture: capture normal association handshake and steady-state telemetry (PCAP + timestamps + meta).
2. Controlled timestamp tests: replay canonical messages with modified timestamp fields in small increments to observe parsing and rejection behaviour. Stop if device degrades.
3. Association misuse observation: attempt a minimal unauthenticated association from a stub with mismatched certs and record the device response (reject/accept). Document handshake fields.
4. Load/association rate checks: observe how the stack behaves under realistic association bursts (simulated normal load) — do not push to destructive levels.
5. Emulated path change: in lab routing testbed, flip simulated path attributes and observe behavior; do not touch live BGP.

### Required artefacts for any test

* Canonical baseline PCAP (association → steady state).
* Trigger PCAP(s) with exact bytes and timestamps.
* Serial/console logs correlated to PCAP timestamps.
* Firmware/stack hash and vendor version.
* Minimal test script or runbook (who ran it, when, stop conditions).
* All artefacts stored in write-once evidence repo with hashes.

## Incident response & disclosure

1. Immediate containment: isolate affected exchange links, revoke compromised keys if evidence is strong, and route traffic to alternate verified peers.
2. Notify national CSIRT / TSO chain: follow national incident reporting (NIS2) — contact the national CSIRT (BSI/ANSSI/NCSC-NL as appropriate) and TSO security contacts.
3. ENISA / CERT-EU escalation: if cross-border impact is likely, coordinate through ENISA and CERT-EU channels.
4. Regulator notification: for major incidents affecting markets or supply, inform energy regulators (ACER/national regulator).
5. Evidence package: deliver the NIS2-ready evidence packet — device IDs, firmware hash, baseline & trigger PCAPs, serial logs, runbook and chain-of-custody. Keep sensitive data minimal (GDPR).
6. Vendor coordination: share evidence through secure channels and request patches/configuration changes. Use coordinated disclosure timelines.
7. Public/market notification: only after regulator guidance and vendor patching, follow agreed PR/market notification procedures.

## Prioritised test checklist

1. Mutual TLS validation: verify cert pinning & revocation checks.
2. Baseline capture: record canonical ICCP association & telemetry.
3. Association rejection tests: attempt authenticated vs unauthenticated associations from stub peer (lab only).
4. Timestamp/sanity checks: replay messages with shifted timestamps (incremental, bounded).
5. Routing resilience check: simulate path changes in lab testbed; monitor message loss/latency.
6. Supply-chain audit: verify firmware signatures and vendor CI/CD claims.

## Recommended tools & rulesets (defensive use only)

* Wireshark with TASE.2 / ICCP dissector (capture and decode).
* tcpdump / tshark for reliable capture.
* Custom ICCP test harness (lab-only; do not deploy on production).
* BGP monitoring tools (BIRD/ExaBGP in lab routing testbed; RPKI validators).
* SIEM rules: alert on unexpected association attempts, timestamp anomalies, certificate changes.
* Secure evidence storage: write-once S3 or sealed file store; automated hashing and access logs.

## Quick wins for operators

* Enforce mutual TLS with short-lived certs and HSM storage.
* Implement RPKI + route-origin validation on peering.
* Harden vendor access (MFA, session recording).
* Add ICCP/TASE.2 specific IDS/alerts and baseline PCAP retention for at least 90 days.
* Run emulation-first tests for any new vendor firmware before production deployment.

## Practical note (sensible scepticism)

Testing inter-utility links is not a playground. The margin for error is tiny and the consequences are transnational. 
The right approach is conservative: Emulate, capture, document, escalate, and coordinate with national CSIRTs 
(BSI, ANSSI, NCSC-NL) and ENISA early. The lab exists to prove that a reported behaviour is real, not to perfect 
an exploit.
