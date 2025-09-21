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

