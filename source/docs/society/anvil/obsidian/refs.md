# References and resources

Tools, documentation, and lab material to support research and hands-on analysis in the context of Anvil. This page prioritises practical investigation of OT/ICS devices, protocols, and environments over abstract compliance or vendor marketing.

## Binary and firmware analysis

Tools for dissecting executables, firmware images, protocol handlers, and embedded artefacts. These are foundational and reused across all later stages.

* [Ghidra](https://ghidra-sre.org/): full reverse-engineering suite with decompiler
* [radare2](https://rada.re/n/radare2.html): low-level reverse engineering and analysis framework
* [Cutter](https://cutter.re/): graphical frontend for radare2
* [ImHex](https://github.com/WerWolv/ImHex): hex editor with pattern language for binary formats
* [binspector](https://github.com/binspector/binspector): binary structure and filesystem inspection

## Industrial protocol specifications and references

Authoritative protocol documentation used to understand wire formats, state machines, and implementation assumptions.

* [Modbus protocol specifications](https://www.modbus.org/modbus-specifications)
* [IEC 61850 standard hub](https://iec61850.dvl.iec.ch/)
* [IEC 60870 SCADA telecontrol overview](https://de.wikipedia.org/wiki/IEC_60870)
* [DNP3 protocol overview](https://www.dnp.org/About/Overview-of-DNP3-Protocol)
* [MQTT protocol specification](https://mqtt.org/mqtt-specification/)
* [OPC UA specifications](https://opcfoundation.org/developer-tools/specifications-unified-architecture/)

## Cross-protocol tool collections

Curated collections of tools, scripts, PCAPs, and research material spanning multiple protocols and vendors. These are useful as starting points and comparison baselines.

* [Awesome Industrial Protocols](https://github.com/Orange-Cyberdefense/awesome-industrial-protocols)
* [Alhasawi ICS/OT Security resources](https://github.com/selmux/Alhasawi-ICS-OT-Security-projetcs)
* [ICS Pentesting Tools](https://github.com/kh4sh3i/ICS-Pentesting-Tools)
* [Awesome ICS Security](https://github.com/NaInSec/Awesome-ICSSecurity)
* [Awesome Industrial Control System Security](https://github.com/raymondtestproject/awesome-industrial-control-system-security)

## Protocol-specific tooling

Libraries, scanners, and test tools focused on individual OT/ICS protocols. Useful for both benign experimentation and hostile interaction.

### Modbus

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

* [pymodbus](https://github.com/pymodbus-dev/pymodbus)
* [modbus-cli](https://github.com/tallakt/modbus-cli)

### Siemens S7

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

* [snap7](https://github.com/SCADACS/snap7)
* [s7scan](https://github.com/klsecservices/s7scan)

### OPC UA


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
* distinctive node hierarchies. 

All of these are extractable statically and later detectable passively.

* [open62541](https://github.com/open62541/open62541)
* [opcua-asyncio](https://github.com/FreeOpcUa/opcua-asyncio)

### IEC 60870-5-104

* [lib60870](https://github.com/mz-automation/lib60870)
* [iec104 tools](https://freyrscada.github.io/iec-104-client-simulator/)

### DNP3

Libraries:

* `pydnp3` (wrapper around OpenDNP3)
  – Frame parsing and structure inspection

Emulators / simulators:

* `OpenDNP3` outstation simulator
  – Offline only, for protocol understanding

DNP3 implementations are conservative, repetitive, and therefore fingerprintable.

* [opendnp3](https://github.com/dnp3/opendnp3)

### MQTT

Libraries:

* `paho-mqtt`
  – Topic parsing, client ID formats, message structures

Emulators / brokers:

* `mosquitto` (offline broker)
  – For testing topic structures extracted from firmware or mobile apps

Topics, client IDs, and default brokers are often hard-coded and reused across product lines.

* [mosquitto](https://github.com/eclipse-mosquitto/mosquitto)
* [mqtt-pwn](https://github.com/akamai-threat-research/mqtt-pwn)

### UPnP / SSDP

Libraries:

* `miniupnpc`
* `scapy` SSDP support

Emulators:

* Simple SSDP responder scripts (Python)

UPnP device descriptions and service UUIDs are among the most reliable static fingerprints in consumer devices.

### TLS / Certificates

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

## Sandboxes, simulators, and testbeds

Controlled environments for experimentation without touching real infrastructure. These support protocol interaction, fault injection, and attack simulation.

* [MiniCPS article](https://arxiv.org/abs/1507.04860) and [MiniCPS code](https://github.com/scy-phy/minicps): CPS/ICS network emulation
* [ICSSIM framework article](https://arxiv.org/abs/2210.13325) and [ICSSIM code](https://github.com/AlirezaDehlaghi/ICSSIM): modular ICS security simulation
* [LICSTER low-cost ICS testbed article](https://arxiv.org/abs/1910.00303) and [LICSTER code](https://github.com/thainnos/LICSTER)– reproducible educational testbed

## Operational labs, honeypots, and deception

Tools that model or expose realistic industrial services, often used to observe attacker behaviour or test detection logic.

* [Conpot](https://github.com/mushorg/conpot): multi-protocol ICS honeypot
* [GasPot](https://github.com/sjhilt/GasPot): gas station honeypot
* [GridPot](https://github.com/sk4ld/gridpot): power grid honeypot
* [OpenPLC](https://github.com/thiagoralves/OpenPLC_v3): open PLC runtime for lab environments
* [PLCBlaster article](https://blackhat.com/docs/asia-16/materials/asia-16-Spenneberg-PLC-Blaster-A-Worm-Living-Solely-In-The-PLC-wp.pdf): PLC protocol stress and test framework

## Traffic captures and empirical data

Realistic protocol traffic is essential for understanding baseline behaviour and deviations.

* [ICS protocol PCAPs and dissections](https://github.com/Orange-Cyberdefense/awesome-industrial-protocols)

## Analysis, context, and comparative reading

Background material that connects protocols, implementations, and real-world usage patterns.

* [ICS Digest Review of industrial protocols](https://icsdigest.com/en/2025/04/24/review-of-industrial-protocols/)
* [INCIBE ICS protocol and network security guide (PDF)](https://www.incibe.es/sites/default/files/contenidos/guias/doc/incibe_protocol_net_security_ics.pdf)
* [OPC UA security analysis (academic)](https://arxiv.org/abs/2104.06051)
