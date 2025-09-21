# North America — (US / Canada / Mexico)


North America’s energy cyber ecosystem is regulatory-heavy and industry-driven. In the United States, 
NERC (Reliability Standards, including CIP) sets mandatory controls that operators must follow; FERC enforces 
reliability and market rules. CISA and the Department of Energy (DOE) provide sector guidance, incident 
coordination and threat advisories; the Electricity Information Sharing and Analysis Center (E-ISAC) facilitates 
operator-to-operator sharing. Canada relies on provincial regulators and the Canadian Centre for Cyber Security 
for national coordination. Mexico routes energy cybersecurity through national authorities and its CERT channels. 

Expect an environment where compliance, public-private information sharing and mandatory reporting are the lenses 
through which incidents are handled.

## Adversaries

* State-sponsored APTs conducting reconnaissance, supply-chain intrusion or strategic disruption.
* Criminal ransomware groups targeting utilities, vendors and managed service providers.
* Insider threats at integrators, vendors or third-party maintenance firms with privileged access.
* Supply-chain actors who compromise vendor CI/CD or update pipelines to insert malicious artefacts.

## Assets

* Bulk electric system (BES) control & SCADA — masters, historians, HMIs, EMS/DM S systems.
* NERC-classified Critical Cyber Assets and their private keys / certificates.
* Market and dispatch data for ISOs/RTOs (examples: PJM, MISO, CAISO) that drive settlement and dispatch.
* Vendor jump hosts and remote access appliances used for vendor maintenance and RMM (remote monitoring & management).

## Attack vectors

* Failures of NERC CIP controls — misconfigured access, insufficient segmentation, delayed patching.
* Compromise of vendor remote access — stolen VPN tokens, weak MFA, exposed jump hosts.
* Protocol parsing bugs in DNP3, IEC 61850, Modbus or proprietary telemetry stacks.
* Supply-chain / cloud vector — poisoned update channels, compromised build pipelines, or cloud provider misconfigurations.
* Routing attacks (BGP anomalies) or cloud routing changes impacting market feeds.

## Representative attacks

* Ransomware that encrypts HMIs, workstation fleets and historian backups, stopping operations or forcing manual recovery.
* Malicious telemetry injection into operator consoles, confusing situational awareness.
* Targeted disruption timed to market events — intended to cause financial loss or manipulate prices.
* Wide-scale firmware abuse via compromised vendor OTA systems.

## Assistive technologies (attacker / defender)

*Offensive (what adversaries commonly use; defenders can anticipate these patterns):* credential harvesting suites, lateral-movement frameworks, bespoke protocol generators for DNP3/IEC 61850, and custom C2 tooling.

*Defensive (what responders and CNAs use):* Wireshark with ICS dissectors, OpenDNP3 / OpenIEC61850 / lib60870 for test harnesses, firmware toolchains (Binwalk, Ghidra, Firmadyne/QEMU), SIEM (Splunk/ELK/OpenSearch) with OT parsers, IDS (Suricata/Zeek) tuned for ICS traffic, and BGP monitoring (ExaBGP/BIRD + RPKI validators).

## Top threats

1. Ransomware that impacts operational continuity.
2. Supply-chain compromise of vendor update pipelines.
3. Protocol parser DoS or parsing-triggered failures at SCADA front ends.
4. Credential compromise of vendor jump hosts enabling pivot into OT.

## Impacts

* Loss of bulk power reliability, regional outages, cascading failures.
* Market distortions and financial exposure for ISOs/RTOs and market participants.
* Regulatory penalties under FERC/NERC and intense public scrutiny.
* Long, costly recovery and remediation across multiple stakeholders.