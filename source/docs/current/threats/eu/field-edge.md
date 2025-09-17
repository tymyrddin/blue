# Field / edge devices

EU-centred, technical, and evidence-first. 

Intent here is practical: this is what CNAs, lab teams and IR squads 
need to minimally know when handling reports that target fleets or edge hardware. No exploit recipes; emphasis on 
safe validation, detection, and regulatory coordination.

Field-edge devices are abundant, diverse, and often the only realistic attack surface for large-scale manipulation. 
They sit between consumer devices and utility control — they are cheap to acquire, hard to patch at scale, and 
frequently dependent on cloud services or vendor backends. The attacker goal here is scale: alter many endpoints 
to change load, hide theft, or establish persistence.

## Adversaries

* Organised criminal groups — fraud, resale of access, meter manipulation for billing advantage.
* Nation-state or state-linked actors — covert reconnaissance and strategic manipulation of distributed assets.
* Ransomware groups — target fleet controllers, aggregator backends, or vendor support tooling.
* Grey-hat researchers / independent discoverers — find zero-days; handling varies and bad disclosure can cause fallout.
* Insider threats — field technicians, integrators, or OTA managers with privileged access.

## Assets

* Device firmware, private keys and secure elements (if present).
* Management/control channels: OCPP (EV chargers), DLMS/COSEM (meters), Modbus/OCPP/IEC 60870 interfaces for inverters and RTUs.
* Fleet management backends, provisioning APIs, and firmware update servers.
* Device configuration (setpoints, schedules), telemetry streams, and time-series logs.
* Physical access points: serial/JTAG/UART pads, boot/bootloader modes.

## Attack vectors

* Unsigned or weakly-signed firmware updates (supply-chain / OTA abuse).
* Protocol parsing bugs in Modbus, OCPP, DLMS/COSEM, IEC 60870 — e.g. timestamp handling, buffer issues, insufficient input validation.
* Default or shared credentials on management endpoints and cloud APIs.
* Local adjacency — compromised home gateway, Bluetooth/Zigbee/Z-Wave/LoRaWAN vectors, or open Ethernet ports.
* Cloud dependency — devices trusting vendor cloud for authentication/authorization (cloud compromise = fleet compromise).
* Physical access — theft, tampering or direct serial/JTAG access for firmware extraction or persistent implanting.

## Representative attacks

* Mass manipulation of setpoints — thousands of inverters or chargers set to draw or inject at coordinated times, causing load shocks. (academic, but ...)
* Billing fraud — manipulated meter readings, missed meter uploads, or falsified consumption graphs.
* Firmware-based persistence — backdoored firmware pushed via OTA channels to many devices.
* Replay / session takeover — capture-authenticate-replay of pairing frames or session tokens to control devices.
* Device bricking / DoS at scale — malformed update or protocol sequences that render fleets offline.

## Assistive technologies

Attacker-side (high level)

* Firmware unpackers (Binwalk, jefferson), emulation environments (Firmadyne, QEMU), SDRs for radio vectors.
* Protocol tooling (Scapy, pymodbus, OpenOCPP clients), MQTT brokers for cloud emulation and replay.
* Mass scanning and credential stuffing frameworks, botnets for distributed probing.

Defender-side (lab & CNA)

* Wireshark with protocol dissectors (Modbus, DLMS, OCPP, Zigbee).
* Firmware analysis toolchain: Binwalk, Ghidra, strings, `unsquashfs`, QEMU/Firmadyne.
* Emulation stacks, MQTT/CoAP brokers (Mosquitto, aiocoap), local stub clouds.
* Capture infrastructure: managed switch with SPAN, Zigbee/802.11 sniffers, serial/TLL/JTAG adapters.

## Top threats

1. Supply-chain / OTA compromise — single signed update can affect many operators.
2. Scale manipulation — coordinated misuse of many edge devices to alter load/generation en masse (academic, but ...).
3. Persistent footholds via vendor/cloud compromise — vendor backend compromise grants control of many fleets.
4. Silent data integrity attacks — altered telemetry feeding wrong analytics without immediate detection.

## Impacts

* Local frequency/voltage excursions, potential protection trips or inverter trips.
* Billing disputes, financial loss and regulatory penalties.
* Reputational damage for vendors and operators; large recall/patch campaigns.
* Physical damage to equipment in worst cases (incorrect protection settings).

## Detection & threat hunting

* Telemetry anomalies: sudden coordinated setpoint shifts, simultaneous firmware versions changing across heterogeneous devices.
* Cloud activity spikes: mass device check-ins, bulk OTA requests from a single account or IP.
* Unusual session flows: repeated failed authentications followed by success, or identical session tokens reused across devices.
* Radio-layer oddities: duplicate pairing frames, unexplained beacon floods on Zigbee/LoRa channels.
* Integrity failures: mismatch between device-reported firmware version and SHA-256 of downloaded image.
* Configuration drift: large number of devices reporting identical abnormal configs after an update window.

Hunt sources: PCAPs (Ethernet, Zigbee, 802.11), broker logs (MQTT), device serial logs, vendor portal logs, fleet management APIs, billing backend comparisons.

## Lab validation

Never test against production fleets or vendor clouds without explicit, formal coordination and legal cover. Emulation 
and isolated testbeds are the default.

### Safe approach

1. Start with passive baseline capture — collect normal telemetry / pairing / update flows (network + serial).
2. Emulation-first — extract firmware (Binwalk), run in QEMU/Firmadyne where feasible to test parsers and update logic.
3. Stub vendor/cloud locally — run a Mosquitto broker or minimal REST endpoints to emulate cloud behaviour; do not call vendor APIs.
4. Bounded replay & mutation — replay captured sessions incrementally; if mutation is needed, do tiny deltas and stop on any abnormal behaviour.
5. Hardware confirmation — use dedicated test devices (not production) for final confirmation of timing/bootloader/watchdog behaviours.
6. Preserve chain-of-custody — hash all firmware and captures, store in write-once evidence store, note who ran tests and approval.

### Canonical non-exploit tests

* Firmware hash & provenance: obtain vendor image, compute SHA-256 and compare to device-reported version.
* Auth/session observation: capture a full pairing/auth session end-to-end and store canonical pcap for replay tests.
* OTA handling check: in an isolated stub cloud, simulate update metadata (signed vs unsigned); observe whether device enforces signature checks. Do not push unsigned images to any production device.
* Protocol mutation (emulated): fuzz Modbus/DLMS/OCPP fields in QEMU/Firmadyne, monitor for crashes or anomalous behaviour. Archive all mutated cases.
* Radio replay (lab shielded): where radio replay is required (Zigbee, LoRa), use shielded enclosures or Faraday cages and strict legal compliance; capture and replay only in shielded lab.

### Required artefacts for any validation

* `device_<model>_<serial>_<fw_ver>_<sha256>.bin` (firmware copy + hash).
* `baseline_<timestamp>.pcap` and `trigger_<timestamp>.pcap`.
* `serial_<timestamp>.log` correlated to PCAP timestamps.
* `runbook_<labid>_<timestamp>.md` – steps, stop conditions, approvals.
* Evidence committed to restricted repo with access log and hashes.

## Incident response & disclosure

1. Immediate containment: isolate affected devices or groups, disable OTA pull if suspect, revoke compromised cloud credentials.
2. Notify vendor & operator: contact vendor security contact and operator SOC; coordinate timeline for patch/mitigation.
3. National CSIRT / ENISA: if impact is wide or affects essential services, notify national CSIRT (BSI, ANSSI, NCSC-NL) and ENISA per NIS2 obligations.
4. Regulatory notification: energy regulator notifications per national rules if service or billing impact.
5. Evidence package for disclosure: device identifiers, firmware hashes, baseline & trigger pcaps, serial logs, minimal reproducible steps (no exploit code), chain-of-custody.
6. Coordinate firmware remediation: prefer coordinated disclosure and staged patching for large fleets to avoid causing mass outages.

## Prioritised lab tests checklist

1. Firmware signature check: do devices validate signed updates? If not, this is high-priority.
2. Canonical capture: obtain and store a canonical pairing/auth/OTA handshake for each device class.
3. Cloud account hygiene: check for shared API keys, long-lived tokens, or unmanaged provisioning accounts.
4. Protocol parsing tests (emulation): small, incremental parser mutations in sandbox.
5. Radio-layer capture capacity: ensure lab has Zigbee/802.11 sniffers and shielded replay capability for safe radio testing.

## Recommended tools & rulesets (defensive use only)

* Firmware & reverse: Binwalk, jefferson, `unsquashfs`, Ghidra, Firmadyne/QEMU.
* Network & radio capture: Wireshark, tshark, Zigbee sniffer (TI CC2531/ConBee), SDR (USRP/BladeRF) in shielded enclosure.
* Protocol libs & testing: Scapy, pymodbus, OpenOCPP clients, Mosquitto (MQTT) and CoAPthon/aiocoap.
* Fuzzing: boofuzz (bounded), custom Scapy scripts with strict stop conditions.
* Evidence & repo: write-once storage (WORM), git for metadata only, signed artefact manifests.

## Quick wins

* Enforce firmware signing and publish update manifests/hashes.
* Rotate API keys and enforce short-lived tokens for fleet management.
* Require vendor clouds to support 2FA and device attestation for high-privilege operations (config changes, OTA commands).
* Build a local stub cloud for all vendor families to test device behaviour off-net.
* Maintain canonical PCAPs and firmware snapshots for each supported device model.

## Practical note

This architectural level is where scale lives. A single confirmed supply-chain or OTA weakness becomes a national 
problem fast. CNAs must be surgical: emulation first, evidence hygiene always, hardware confirmation last. 
Coordinate with vendors, national CSIRTs and ENISA early for anything that looks like mass-impact.
