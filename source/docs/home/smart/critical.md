# Critical mitigations

## Change Default Passwords

Attacks stopped: Credential stuffing, brute-force attacks, Mirai botnets.

Targets: Cameras, doorbells, routers, smart plugs.

How-To:

* Never keep factory defaults (e.g., admin:password).
* Use a unique, strong password (e.g., Bitwarden-generated).
* For devices without passwords (like some smart plugs), segment them on a guest network.

## Disable unused features

Attacks stopped: Eavesdropping, unauthorised recordings, data leaks.

Targets: Smart TVs, voice assistants (Alexa/Google Home), robot vacuums.

How-To:

* Smart TVs: Disable "voice control" and "ambient mode" (Samsung/LG).
* Alexa/Google Home: Mute mic/camera via hardware switch when not in use.
* Robot Vacuums (e.g., Roomba): Disable cloud mapping if local storage is available.

## Block Internet access

Attacks Stopped: Remote exploits, firmware hijacking, data exfiltration.

Targets: Smart lights, thermostats, refrigerators (most don’t need internet).

How-To:

* Router Settings: Use "client isolation" or VLANs (e.g., ASUS/TP-Link "Guest Network").
* Firewall Rules: Block devices from WAN (e.g., UniFi, pfSense).
* Offline Mode: Use Zigbee/Local-only devices (e.g., Philips Hue with local hub).


## Smart TV lockdown guide

Risks: Ads injecting malware, built-in cameras/mics, unpatched firmware.

Steps:

1. Disable ACR (Automatic Content Recognition):
   * Samsung: Settings → Support → Terms & Policies → Disable "Viewing Information."
   * LG: Settings → All Settings → General → About This TV → Turn off "Live Plus."
2. Block Telemetry: Use Pi-hole or router DNS filtering (block `samsungads.com`, `lgad.cdn.lge.com`).
3. Use a Streaming Stick: Isolate risks (e.g., Apple TV/Fire Stick with separate network).

## Camera security guide

Risks: Live feeds hacked (e.g., Ring camera breaches), weak encryption.

Steps:

1. Enable End-to-End Encryption (E2EE):
    * Google Nest: Settings → Camera → "End-to-end encryption."
    * Eufy: Enable "Local Storage Mode" (blocks cloud uploads).
2. Two-Factor Authentication (2FA): Mandatory for all camera apps.
3. Physical Privacy:
   * Cover lenses with sliders (e.g., Wyze Cam covers).
   * Point cameras away from private areas (bedrooms, bathrooms).

## IoT devices to avoid

* Cheap no-name brands (e.g., AliExpress cameras with backdoors).
* Devices requiring "proprietary clouds" (no local control).
* Smart locks without physical keys (risk of lockout).

## defence-in-depth for IoT

* Network Segmentation: Put IoT on a separate VLAN (e.g., UniFi, OpenWRT).
* Firmware Updates: Enable auto-updates (or check monthly).
* Sniff Suspicious Traffic: Use Wireshark/Fing to detect odd connections.
