# Protocol libraries and emulators (Obsidian Desk)

These are for offline analysis, parsing, and controlled simulation only.
They are not used against live systems. If anyone suggests otherwise, confiscate their keyboard.

## Modbus (TCP / RTU)

Libraries:

* `pymodbus`
  – Parse Modbus frames, decode function codes, registers, exceptions
  – Useful for understanding firmware-embedded protocol handling

* `scapy.contrib.modbus`
  – Low-level frame inspection and crafting (offline PCAP analysis)

Emulators / simulators:

* `mbserver` (libmodbus)
  – Minimal Modbus TCP server for controlled testing

* `ModbusPal`
  – Simple register-based simulator, good for sanity-checking assumptions

Modbus function codes, exception responses, and register layouts are often hard-coded in firmware and excellent static 
identifiers.

## Siemens S7 / S7comm

Libraries:

* `python-snap7`
  – Parses S7 protocol structures
  – Useful for understanding SZL, setup comm, and read/write behaviour without touching real PLCs

Emulators / simulators:

* `snap7-server` (from snap7)
  – Controlled S7 server for offline testing

* PLCsim (vendor tool, optional, licensed)
  – Only if already available; never required

S7 implementations often leak vendor-specific constants, block structures, and error strings inside firmware.

## OPC UA

Libraries:

* `opcua` / `freeopcua` (Python)
  – Parses nodesets, services, and security configuration
* `open62541`
  – Reference implementation used by many vendors

Emulators / simulators:

* `open62541 server`
* `freeopcua server`

OPC UA stacks embed:

* default namespaces
* certificate subjects
* endpoint URLs
* distinctive node hierarchies
  All of these are extractable statically and later detectable passively.

## DNP3

Libraries:

* `pydnp3` (wrapper around OpenDNP3)
  – Frame parsing and structure inspection

Emulators / simulators:

* `OpenDNP3` outstation simulator
  – Offline only, for protocol understanding

DNP3 implementations are conservative, repetitive, and therefore fingerprintable.

## MQTT

Libraries:

* `paho-mqtt`
  – Topic parsing, client ID formats, message structures

Emulators / brokers:

* `mosquitto` (offline broker)
  – For testing topic structures extracted from firmware or mobile apps

Topics, client IDs, and default brokers are often hard-coded and reused across product lines.

## UPnP / SSDP

Libraries:

* `miniupnpc`
* `scapy` SSDP support

Emulators:

* Simple SSDP responder scripts (Python)

UPnP device descriptions and service UUIDs are among the most reliable static fingerprints in consumer devices.

## TLS / Certificates

Libraries:

* `cryptography` (Python)
* `pyOpenSSL`

Tools:

* `openssl`
* `step-cli` (for inspection, not generation)

Embedded devices routinely ship with:

* reused private keys
* predictable serial numbers
* vendor-specific certificate templates
    
These are gold for passive identification. They exist so that firmware artefacts can be understood, classified, and 
handed to the Fingerprint Forge as static identifiers.

If a protocol interaction is required to learn something, it stays inside a VM, simulator, or emulated device and 
goes absolutely nowhere near the public network.

## The rule of thumb (write this on the wall)

* If it needs a packet to learn it, it belongs in the lab.
* If it needs two packets, someone should ask why.
* If it needs state changes, put the kettle on and think again.
