# Utility / grid control

EU-focused, technical and evidence-first.

Format: adversaries, assets, attack vectors, representative attacks, assistive tech (attacker and defender tooling), 
top threats, impacts, detection/hunting, safe lab validation, incident response and disclosure steps, prioritised 
checklist and quick wins. Possibly useful for CNAs, SOC/SIRY team and lab engineer roles.

This architectural level houses the control plane for distribution and transmission networks: SCADA masters, HMIs, 
engineering workstations, and substation IEDs. Attacks here are frequent targets for financially- or 
politically-motivated attackers and are the most likely to cause physical damage if mishandled. Testing requires 
conservatism, and the toolset and failure modes are close to classic ICS/OT work.

## Adversaries

* Nation-state actors aiming at disruption or espionage (state-sponsored APTs).
* Sophisticated ransomware groups seeking high-value targets (double extortion scenarios).
* Malicious or negligent insiders (contractors, engineers).
* Organised criminal groups performing fraud, or sellable access to OT systems.
* Grey-hat researchers — well intentioned but sometimes public-facing in ways that increase risk.

## Assets

* SCADA masters, HMIs and engineering stations (Windows/Linux operator consoles).
* Protocol endpoints: IEC 61850 MMS servers, DNP3 masters/outstations, Modbus TCP/RTU gateways.
* Historian databases, EMS/EMS interfaces and alarming systems.
* Remote maintenance channels and vendor jump hosts.
* Operator credentials, service accounts and OT PKI.
* Backup islands and disaster recovery stores.

## Attack vectors

* Lateral movement from compromised IT into OT (VPN misuse, vulnerable RMM tools, supply-chain DLLs).
* Protocol parsing flaws in IEC 61850, DNP3, Modbus or proprietary telemetry stacks.
* Weakly protected engineering interfaces (RDP/VNC without MFA, exposed service ports).
* Poor network segmentation — flat networks or abused DMZs.
* Abuse of remote vendor access (permanent VPN credentials, persistent tunnels).
* Unvalidated configuration imports or signed config tampering.

## Representative attacks

* Command injection: publishing spurious setpoints or trip commands to relays and IEDs.
* Alarm suppression and false alarm floods to mask later actions.
* Firmware/logic update manipulation to alter protection logic.
* Ransomware that encrypts operator workstations and historian backups.
* Data integrity attacks that alter meter/telemetry values to mislead operators.

## Assistive technologies

### Attacker-side (high level)

* Credential harvesting and C2 toolchains, lateral movement frameworks.
* Protocol testers/fuzzers for MMS/IEC 61850 and DNP3 (often custom).
* Compromised vendor remote access tools, persistent VPN appliances.

### Defender toolset

* Wireshark/tshark with IEC 61850 / DNP3 / Modbus dissectors.
* OpenDNP3, OpenIEC61850, lib60870, pymodbus for protocol testing and simulation.
* Zeek for network traffic analysis, IDS signatures for ICS protocols (Suricata + custom rules).
* SIEM (Splunk, ELK/OpenSearch) with OT parsers, MISP for intel, and recorded session telemetry for vendor access.
* Firmware emulation (QEMU/Firmadyne) and sandboxed fuzzers (boofuzz) for protocol parser testing.

## Top threats

1. Unauthorized control actions — attacker issues commands that trip equipment or change protection thresholds.
2. Ransomware w/ operational impact — encryption of HMIs/historians that halts operations.
3. Alarm suppression & deception — operators see a manipulated picture and react in ways that worsen damage.
4. Configuration tampering — altered protection logic or relay settings that cause collateral damage.

## Impacts

* Local or regional outages, possible equipment damage (transformers, protection relays).
* Extended restoration windows and large financial/penalty exposure.
* Loss of customer trust and regulatory scrutiny under NIS2.
* Safety risks to field personnel if relays/protections are misconfigured.

## Detection and threat hunting

* Unexpected control commands or setpoint changes originating from IT or vendor subnets.
* Sudden alarm deltas (massive alarm floods) or long periods with no alarms where there should be many.
* Anomalous session behaviour: encrypted tunnels from unusual endpoints, RDP sessions outside approved windows.
* Protocol anomalies: malformed MMS objects, unexpected file transfers, abnormal DNP3 function codes.
* Changes to engineering workstation binaries or signed configuration files.
* Unusual historian writes (sudden deletion/overwrite patterns).

Hunt sources: PCAPs for IEC 61850/DNP3/Modbus, RDP/SSH session logs, SIEM correlation rules, EDR on engineering workstations, vendor jump host session recordings.

## Lab validation

Do not test in production. If any real network path or production endpoint is required, escalate and schedule with 
the operator and national CSIRT.

### Safe approach

* Emulate first. Extract firmware/logic if available and run OpenIEC61850 / OpenDNP3 in a sandbox to exercise parsers and association logic.
* Run tests in an isolated OT testbed. Use an air-gapped VLAN, managed switch with SPAN, and subnet emulation for SCADA topology.
* Prefer passive capture and replay of benign sequences rather than creating novel malformed commands. Use bounded mutation and clear stop conditions.
* Document every fork. Keep an auditable runbook with decision points and who authorised them.

### Canonical non-exploit tests

1. Baseline capture — record normal SCADA master ↔ outstation handshakes, MMS object reads/writes, and typical polling cadence. Save PCAP + timestamps.
2. Association/auth checks — confirm whether operator consoles and engineering stations require dedicated credentials or rely on weak auth. Record handshake metadata; do not brute force.
3. Bounded parser mutation — in emulation or on spare hardware, mutate protocol fields (length, sequence, timestamp) incrementally and monitor for crashes/reboots. Archive full PCAPs and console logs.
4. Vendor access simulation — use a stub vendor jump host to test session logging and privileged session recording. Ensure vendor access audits record keystrokes and file transfers.
5. Ransomware resilience check — validate backup islands and restore playbooks in a controlled DR exercise; do not run ransomware. Test restore times and integrity.

### Artefacts to collect

* Device/system identifiers and firmware/logic version + SHA-256 hashes.
* Baseline PCAPs and trigger PCAPs.
* Engineering workstation logs (RDP session logs, file change events).
* Historian entries and anomalous write snapshots.
* Test runbook, stop conditions, and operator approvals.

## Incident response & disclosure

1. Immediate triage: isolate affected segment (air gap if possible), move operator consoles to clean hosts, block suspicious IPs in a quarantine ACL.
2. Contact national CSIRT and regulator: follow NIS2 incident reporting timelines — contact the relevant national CSIRT (BSI, ANSSI, NCSC-NL) and the national energy regulator; consider CERT-EU if cross-border.
3. Collect evidence package: firmware hashes, baseline & trigger PCAPs, console logs, historian snapshots, runbook and chain-of-custody. Keep copies in write-once storage.
4. Coordinate vendor interaction: use secured channels, limit information to what is necessary, and require NDAs or formal MoUs if needed for forensics.
5. Regulator & customer notification: follow national regulator guidance and legal counsel before public disclosure; NIS2 and GDPR implications must be considered.
6. Post-incident review: record lessons, update test matrices/recipes, and schedule follow-up validation.

## Prioritised lab tests checklist

1. Validate network segmentation: confirm DMZ, OT VLANs, and ACLs enforce least privilege.
2. Capture and baseline: record canonical SCADA/IEC 61850/DNP3 flows for at least one week if feasible.
3. Validate vendor access controls: MFA, jump hosts, session recording.
4. Test parser resilience in emulation: bounded mutation of MMS/DNP3 buffers in sandbox.
5. Verify backup & restore playbook: full historian restore in DR lab.
6. Confirm authoritative logging: EDR on engineering stations, immutable log storage for at least 90 days.

## Recommended tools and rulesets

* Capture & decode: Wireshark (IEC 61850 / MMS dissector, DNP3, Modbus), tcpdump/tshark.
* Protocol testing: OpenIEC61850, OpenDNP3, lib60870, pymodbus, mbtget/mbtset.
* Fuzzing / mutation: boofuzz (bounded), custom scapy scripts for careful mutation.
* Monitoring: Zeek for protocol anomaly detection, Suricata with ICS rules, SIEM (ELK/OpenSearch or Splunk) for correlation.
* Evidence storage: write-once object storage or WORM NAS with automated hashing and access logs.
* Hunting/Intel: MISP for IOC sharing, ATT\&CK mappings for playbooks mapping.

## Quick wins

* Enforce MFA and ephemeral credentials on all vendor/remote access.
* Record and centrally store all vendor remote sessions (video + keystroke logs preferred).
* Implement protocol-aware IDS rules for IEC 61850 / DNP3 and alert on anomalous function codes.
* Harden engineering workstations: EDR, application whitelisting, offline backup keys.
* Run a DR restore exercise for historian and HMI restores quarterly.

## Practical note

This architectural level is operational, safety-sensitive and fragile. The lab role is to provide deterministic, 
auditable evidence that a reported issue exists and that a mitigation actually works — not to produce weaponised code. 
Emulate where possible, test conservatively, and involve national CSIRTs (BSI, ANSSI, NCSC-NL) and ENISA early when 
incidents approach cross-border or market impact.
