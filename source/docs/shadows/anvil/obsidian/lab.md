# Lab setup

The Obsidian Desk is a lab of curiosity, caution, and the occasional whiff of scorched electronics. The following 
is what an analyst needs to set up a proper workspace:

## Hardware

Analysts must maintain segregation of the potentially hazardous from the comfortable office chair.

### Device benches

Sacrificial devices (PLCs, RTUs, HMIs, industrial sensors, IoT hubs).

* Gifts or buy from vendors
* Buy second-hand or decommissioned units from reputable suppliers.
* Ensure full power isolation and write-blockers.

Firmware download station (online, connected, but isolated from the analysis environment).

* Laptop/desktop with OS hardened, firewall enabled.
* Media transfer strictly controlled (USB only via encrypted, write-protected sticks).

### Protective equipment

* Anti-static mats and wrist straps
* Fire-proof containers for batteries or devices with power
* Labels, permanent markers, and numbered trays

### Networking

Air-gapped lab network:

* Physically separate from corporate LAN
* Only internal routing (optional VM NAT for isolated testing)
* No Wi-Fi, no external USB connections except via vetted transfer media

## Virtualisation and workstations

### Base VMs

Every VM has one job and one job only:

* Extraction VM with [binwalk](https://www.kali.org/tools/binwalk/), [foremost](https://www.kali.org/tools/foremost/), [7-zip](https://www.kali.org/tools/7zip/), [dd](https://www.kali.org/tools/ddrescue/), [Firmware Mod Kit](https://www.kali.org/tools/firmware-mod-kit/)
* Disassembly / reverse engineering VM with [IDA Free](https://hex-rays.com/ida-free), [Ghidra](https://www.kali.org/tools/ghidra/), [Radare2](https://www.kali.org/tools/radare2/)
* Protocol parsing / emulation VM — Python 3.12 environment, [scapy](https://scapy.net/), [protocol libraries, emulators](libs.md)

### VM setup

* Snapshots before use
* Offline only (no internet)
* One snapshot per firmware series or batch
* Shared folders read-only
* Host OS: Linux (Ubuntu LTS or Fedora) with full disk encryption

### Recommended hardware for host

* 32 GB RAM minimum (16 GB if VM count is low)
* SSDs for fast snapshotting
* CPU with virtualization support (Intel VT-x / AMD-V)

## Software tools

### Disassembly and analysis

* `IDA`, `Ghidra`, `Radare2` — static analysis of binaries
* `Hex editors` — `HxD`, `Bless`, `010 Editor`
* `Binwalk` — firmware unpacking
* `Firmware Mod Kit` — easy extraction of Linux/RTOS firmware

### Network / protocol

* `Scapy`, `Wireshark` (offline capture analysis)
* Emulators: PLC runtime simulators, Modbus/S7/OPC stacks

### Data management

* SQLite / PostgreSQL for artefact metadata
* Git (local only) for version control of scripts, mappings, and notes
* Checksumming tools: `sha256sum`, `md5sum`

## Storage and artefact handling

* Firmware vault — immutable, write-protected copies
* Working copies — for VM use only, fully reversible, checksummed before/after
* Media transfer policy — all devices and firmware transferred via verified, write-blocked USB drives or encrypted network tunnels between isolated VMs

## Security and safety principles

* No live systems touched in analysis VM
* All extraction offline and reproducible
* Unsafe instructions flagged, never executed on any physical device or VM without controlled emulation
* Snapshots before experiments, always rollback if unsure

## Optional accessories

* JTAG/SWD adapters for low-level memory access
* SPI/NAND/NOR programmers
* USB protocol analyzers for device update capture
* Oscilloscope / logic analyzer for curious glances at signals

## Links

Links to commonly used open-source tools, without it being on Kali.

* [Ghidra](https://ghidra-sre.org/)
* [Radare2](https://rada.re/n/)
* [Binwalk](https://github.com/ReFirmLabs/binwalk)
* [Firmware Mod Kit](https://github.com/mirror/firmware-mod-kit)
* [Scapy](https://scapy.net/)


The Obsidian Desk is a lab of shadows and whispers. Devices are guests, not co-workers; firmware is sacred, never 
touched without gloves and a snapshot. Follow the steps above, and the lab will behave more like a research 
facility and less like a conflagration waiting to happen.
