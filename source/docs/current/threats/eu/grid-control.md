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

