# The Silent Anvil — operational note

*(Department of Silent Stability — internal, strictly not for the gullible)*

## Preface

By direction of [the Patrician](https://indigo.tymyrddin.dev/docs/vetinari/) (who maintains an abiding dislike of 
surprises, and a tendency to have an opinion on everything), this note records the twin undertakings of the 
Department’s latest enterprise, informally known as the Silent Anvil.

The Anvil has two arms: the Obsidian Desk, where firmware is interrogated with the delicacy of a tax inspector 
opening a dusty ledger, and the Fingerprint Forge, where the results of that interrogation are turned into passive, 
non‑intrusive identification tools.

No trumpets. No explosions. No device is poked without consent.

## Obsidian Desk

The Obsidian Desk handles offline artefacts for industrial and consumer devices, including but not limited to:

* PLCs, RTUs, HMIs, gateways, sensors
* Smart home hubs, IoT appliances, and embedded consumer electronics
* Companion mobile apps, software bundles, and update packages

Tasks performed:

1. Vulnerability research

   * Systematic static analysis of firmware
   * Identification of flaws, misconfigurations, unsafe defaults
   * Reconstruction of device logic where relevant
   * Logging unsafe instructions, registers, or sequences

2. Artefact extraction and fingerprinting

   * Banner strings, protocol constants, error messages
   * Web UI assets, headers, embedded frameworks
   * Hardcoded credentials, default configurations, API paths
   * TLS certificates, serial numbers, cryptographic fingerprints

Principle: the Desk researches the bad in a controlled environment; nothing touches the internet, nothing 
changes the device state, nothing explodes without a fire extinguisher at hand.

## Fingerprint Forge

Once the Desk has documented the vulnerabilities and derived artefacts, the Forge takes over:

* Input: canonical firmware fingerprints, static identifiers, version mappings
* Function: detect where the vulnerable firmware is deployed across the internet, without interacting with it
* Scope: industrial devices and internet‑exposed smart devices

Detection techniques:

* Search engines and passive datasets
* TLS, HTTP, MQTT, SSDP, UPnP fingerprints
* Web asset hashes, static resources, headers, banners
* Certificate subjects, serials, and quirks

Behavioural probing? Only in the lab. The Forge avoids poking live devices like a polite thief at a doorbell.

Notification paths:

* Industrial systems → operators, vendors, CERTs, regulators
* Smart home devices → vendors, ISPs, consumer CERTs, coordinated remediation teams

The Forge never contacts end users directly. Quiet observation, not accusation, is the modus operandi.

## Division of labour

* Obsidian Desk discovers *what is wrong*, safely and fully.
* Fingerprint Forge discovers *where it is*, quietly and at scale.

This ensures:

* No live devices are compromised unnecessarily
* Vulnerabilities are understood before detection attempts
* Identification is safe, reproducible, and responsible

## Operating principles

1. All research is offline and controlled.
2. Fingerprints are derived from static artefacts only.
3. Unsafe or uncertain artefacts are flagged, not deployed.
4. Behavioural probing occurs only in the lab, never at internet scale.
5. Notifications are always responsible and quiet.
6. The Patrician’s patience is finite; waste it not.

---

*End of operational note — by memorandum from the Head of the Department of Silent Stability, initialled in a 
handwriting that strongly suggests the Patrician has already read it.*

