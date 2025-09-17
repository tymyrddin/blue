# Consumer / home IoT

EU-focused, practical, keeping it evidence-first, technically grounded, and suitable for CNAs, lab teams, and IR squads 
when handling reports or incidents targeting consumer IoT. No exploit recipes; emphasis on safe validation, detection, 
and regulatory coordination.

Consumer/home IoT devices are abundant, cheap, and often overlooked. They bridge personal spaces and local networks, 
frequently rely on cloud backends, and are typically under-protected. The attacker goal here is scale or privacy: 
enlist devices into botnets, gather occupancy patterns, or pivot into more valuable targets.

## Adversaries

* Script kiddies / hobbyists — opportunistic scanning and exploitation for notoriety or botnet growth.
* Botnet operators — harvest massive device fleets for DDoS campaigns or spam.
* Burglary or physical intrusion groups — infer presence or absence from energy telemetry, hub usage, or appliance patterns.
* Privacy attackers — data brokers or researchers scraping telemetry and device usage for profiling or marketing.
* Insider or opportunistic neighbours — misuse Wi-Fi access or hub management interfaces for local advantage.

## Assets

* Device control: on/off switches, thermostats, schedules, hub settings.
* Cloud account tokens and authentication credentials.
* Wi-Fi credentials or local network access through hubs.
* Hub as a pivot into other consumer devices (smart cameras, smart locks, appliances).
* Time-series energy telemetry for occupancy inference.

## Attack vectors

* Default or weak credentials on local devices and cloud accounts.
* Exposed management interfaces (HTTP, Telnet, SSH, UPnP/NAT PTA issues).
* Insecure cloud integrations or unverified third-party apps.
* Zigbee, BLE, or proprietary wireless pairing weaknesses; replayable or sniffable frames.
* Local network compromise — pivoting from one device to another via the hub or shared Wi-Fi.

## Representative attacks

* Enlistment into botnets — devices used in distributed denial-of-service (DDoS) attacks.
* Privacy invasion — occupancy inference and behaviour profiling from energy telemetry or hub events.
* Local network pivot — attacker moves from one consumer IoT device to others on the home network.
* Minor DoS or device manipulation — forced reboots, schedule disruption, or smart plug toggling.

## Assistive technologies

Attacker-side (high level)

* Mass scanning tools for exposed ports (Shodan, Nmap).
* Simple replay scripts, credential stuffing frameworks, MQTT/CoAP brokers for cloud emulation.
* Zigbee/BLE sniffers (e.g., ConBee, TI CC2531), inexpensive SDR sticks for local wireless monitoring.

Defender-side (lab & CNA)

* Wireshark with protocol dissectors for Zigbee, BLE, MQTT.
* Local sandbox networks with isolated hubs and devices for safe replay/testing.
* Traffic capture and analysis: PCAPs, cloud API logs, router DHCP logs, and device telemetry.
* Credential hygiene checks: verify default passwords rotated, 2FA enforced where possible.

## Top threats

1. Mass botnet enrolment — compromised fleets of consumer devices contribute to global DDoS events.
2. Privacy leaks — local occupancy patterns, appliance usage, or presence inferred at scale.
3. Local pivot attacks — escalation from poorly secured consumer IoT to more valuable endpoints on the same network.
4. Collateral service disruptions — consumer devices intermittently unavailable, triggering support calls or small-scale outages.

## Impacts

* Participation in global DDoS campaigns, causing reputational or legal implications for ISPs.
* Theft or intrusion facilitated by inferred occupancy data.
* Consumer compensation claims or regulatory penalties for breached data (GDPR).
* Local disruptions: smart heating/cooling, lighting schedules, or appliance operations altered.

## Detection & threat hunting

* Telemetry anomalies: unusual on/off cycles, mass simultaneous state changes.
* Cloud activity spikes: unexpected device check-ins or API calls from unfamiliar IPs.
* Local network anomalies: new MAC addresses, duplicate IP conflicts, repeated authentication failures.
* Radio layer oddities: repeated pairing attempts, unrecognised BLE/Zigbee beacons.

Hunt sources: router logs, hub logs, PCAP captures, cloud API activity, IoT device telemetry.

## Lab validation

1. Passive baseline: observe normal device behaviour (network, cloud, and telemetry) in isolated lab.
2. Controlled replay: emulate pairing/auth sessions or scheduled commands, incrementally, on isolated devices.
3. Cloud stubbing: local MQTT/CoAP broker or minimal REST endpoints to mimic vendor behaviour.
4. Incremental fuzzing: small, safe mutations of device commands or pairing sequences in sandbox.
5. Hardware confirmation: use dedicated test devices; never touch production endpoints.
6. Preserve evidence: capture PCAPs, logs, and hash firmware where applicable; note approval and chain-of-custody.

## Quick wins

* Enforce rotation of default passwords and enable 2FA for cloud accounts.
* Monitor network for unexpected device behaviour or API calls.
* Use isolated lab sandboxes to validate firmware updates or cloud interactions.
* Educate consumers/operators on basic security hygiene (segmented Wi-Fi, firmware updates).
