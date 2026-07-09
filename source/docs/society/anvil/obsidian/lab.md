# Lab setup

The Obsidian Desk is a lab of curiosity, caution, and the occasional whiff of scorched electronics. What follows is roughly what it takes to set up a workspace that behaves more like a research facility and less like a conflagration in waiting.

## Hardware

The governing idea is to keep the potentially hazardous well away from the analyst's working environment.

### Device benches

Sacrificial devices: PLCs, RTUs, HMIs, industrial sensors, IoT hubs. Where they come from:

* Gifts, or bought from vendors
* Second-hand or decommissioned units from a reputable supplier
* Set up with full power isolation and write-blockers, because surprises here are expensive

A firmware download station, online and connected, but isolated from the analysis environment:

* A laptop or desktop, OS hardened, firewall on
* Media transfer kept on a short leash (USB only, via encrypted, write-protected sticks)

### Protective equipment

* Anti-static mats and wrist straps
* Fire-proof containers for batteries or anything still holding a charge
* Labels, permanent markers, numbered trays

### Networking

An air-gapped lab network:

* Physically separate from the corporate LAN
* Internal routing only (an optional VM NAT for isolated testing)
* No Wi-Fi, and no external USB beyond the vetted transfer media

## Virtualisation and workstations

### Base VMs

Each VM has one job and exactly one:

* Extraction VM with [binwalk](https://www.kali.org/tools/binwalk/), [foremost](https://www.kali.org/tools/foremost/), [7-zip](https://www.kali.org/tools/7zip/), [dd](https://www.kali.org/tools/ddrescue/), [Firmware Mod Kit](https://www.kali.org/tools/firmware-mod-kit/)
* Disassembly and reverse-engineering VM with [IDA Free](https://hex-rays.com/ida-free), [Ghidra](https://www.kali.org/tools/ghidra/), [Radare2](https://www.kali.org/tools/radare2/)
* Protocol parsing and emulation VM, a Python 3.12 environment, [scapy](https://scapy.net/), [protocol libraries and emulators](refs.md)

### VM hygiene

* Snapshots before use
* Offline only, no internet
* One snapshot per firmware series or batch
* Shared folders read-only
* Host OS: Linux (Ubuntu LTS or Fedora) with full disk encryption

### A comfortable host

* 32 GB RAM (16 GB if the VM count stays low)
* SSDs, for snapshots that do not test your patience
* A CPU with virtualisation support (Intel VT-x / AMD-V)

## Software tools

### Disassembly and analysis

* `IDA`, `Ghidra`, `Radare2` for static analysis of binaries
* Hex editors: `HxD`, `Bless`, `010 Editor`
* `Binwalk` for unpacking firmware
* `Firmware Mod Kit` for the easy extraction of Linux/RTOS firmware

### Network and protocol

* `Scapy`, `Wireshark` (offline capture analysis)
* Emulators: PLC runtime simulators, Modbus/S7/OPC stacks

### Data management

* SQLite / PostgreSQL for artefact metadata
* Git (local only) for scripts, mappings, and notes
* Checksumming: `sha256sum`, `md5sum`

## Storage and artefact handling

* Firmware vault: immutable, write-protected copies
* Working copies for VM use only, fully reversible, checksummed before and after
* Media transfer: everything moves on verified, write-blocked USB drives or encrypted tunnels between isolated VMs

## Security and safety principles

* Nothing live is touched inside the analysis VM
* Extraction stays offline and reproducible
* Unsafe instructions are flagged and never run on a physical device, or in a VM, without controlled emulation
* Snapshot before experiments, and roll back the moment something feels off

## Optional accessories

* JTAG/SWD adapters for low-level memory access
* SPI/NAND/NOR programmers
* USB protocol analysers for capturing device updates
* An oscilloscope or logic analyser, for the curious glance at a signal

## Links

Commonly used open-source tools, for the ones that do not ship on Kali:

* [Ghidra](https://ghidra-sre.org/)
* [Radare2](https://rada.re/n/)
* [Binwalk](https://github.com/ReFirmLabs/binwalk)
* [Firmware Mod Kit](https://github.com/mirror/firmware-mod-kit)
* [Scapy](https://scapy.net/)

The Obsidian Desk is a lab of shadows and whispers. Devices are guests, not colleagues; firmware is sacred, and never touched without gloves and a snapshot. Run it that way and the worst you will smell is solder.
Last updated: 01 June 2026
