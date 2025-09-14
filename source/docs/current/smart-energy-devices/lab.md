# Vulnerability validation lab

A CNA lab is for validating PoCs and confirming vulnerabilities safely, not for casual tinkering. Everything must 
be safe, isolated, and reproducible, replicating only the conditions necessary to test a reported vulnerability. 
This includes hardware, network setup, emulation tools, and documentation.

## Hardware and lab infrastructure

A CNA lab needs precise, safe, and purpose-driven hardware. Every component should support reproducing PoCs without touching production networks.

### Target devices

- PoC-specific devices: Only acquire hardware affected by the reported vulnerability—smart plugs, meters, solar inverters, EV chargers, gateways, or sensors.  
- Firmware versions: Ensure the devices match the version(s) cited in the vulnerability report.  
- Emulators / optional devices: Use solar inverter or gateway emulators when real hardware is unavailable.  

### Single-board computers (SBCs) and lab PCs

Raspberry Pi, BeagleBone, or similar SBCs:

- Run local MQTT/CoAP brokers.  
- Simulate controllers or slaves for PoC validation.  
- Capture traffic and log device interactions.  

Dedicated lab PC:  

- For Wireshark, firmware analysis, fuzzing, and running protocol-specific testing tools.  
- Preferably isolated from home/production networks.

### Network and sniffing hardware

- USB protocol sniffers: Zigbee, Z-Wave, or other protocol-specific USB dongles for capturing wireless mesh traffic.  
- Managed switch: Supports VLANs and port mirroring/SPAN to monitor multiple devices simultaneously.  
- Old Wi-Fi router: Create an isolated IoT network air-gapped from my main LAN.  
- Ethernet cables, USB cables, serial/TTL adapters: Required for connecting SBCs, devices, and sniffers. Label everything for clarity.  

### Power and safety

- Switched power strips: Easily cut power to multiple devices at once.  
- Surge protectors / lab-grade extension cords: Prevent accidental spikes from damaging devices or my home infrastructure.  
- Separate circuits if needed: For higher-power devices like EV chargers or inverters.  

### Storage and organisation

- Labelled shelves or bins: Keep PoC devices, adapters, and cables organised by protocol or vulnerability.  
- Static-safe handling: Antistatic mats or wrist straps for sensitive electronics.

## Emulation and firmware analysis

Firmware and simulation tools let me validate PoCs without touching live devices, reducing risk.

### Firmware extraction and analysis

Always check the firmware version matches the target device. Emulation avoids bricking hardware during testing.

- [Binwalk](https://github.com/ReFirmLabs/binwalk) – Extract and inspect firmware images.  
- [Ghidra](https://github.com/NationalSecurityAgency/ghidra) – Decompile and reverse engineer binaries.  
- [QEMU](https://www.qemu.org/) – Emulate device firmware for safe testing.  
- [Firmadyne](https://github.com/firmadyne/firmadyne) – Full system emulation for embedded devices.

### Protocol fuzzing and traffic replay

- [Scapy](https://scapy.net/) – Craft and send network packets (IP, Modbus, Zigbee, etc.) for testing responses.  
- [boofuzz](https://github.com/jtpereyda/boofuzz) – Automate fuzzing of protocol fields and message sequences.  
- [Replay tools](https://goreplay.org/blog/replay-production-traffic-for-realistic-load-testing/) – Use captured traffic to reproduce PoCs and validate fixes.  

### Smart grid simulators

Simulation is not a replacement for live-device validation but helps interpret results and environmental factors.

- [OpenDSS](https://opendss.epri.com/OpenDSSFPCBuild.html), [GridLAB-D](https://gridworks.org/initiatives/distribution-system-modeling-tools/)
- [Comparison of simulators](https://docs.nrel.gov/docs/fy17osti/64228.pdf) – Model electricity flows and grid behaviour.

## Network tooling

A critical part of a CNA lab is the ability to capture, analyse, and safely manipulate network traffic from smart 
energy devices. The following tools and setup elements are essential:

### Packet capture and analysis

Use filters to focus on relevant traffic; full captures can quickly overwhelm storage. Annotate captures with device IDs and timestamps.

Wireshark with protocol dissectors: The Swiss army knife of packet analysis. For smart energy devices, use dissectors for:
- [Zigbee / Zigbee Green Power](https://www.wireshark.org/docs/wsar_html/packet-zbee_8h_source.html): Captures and decodes wireless mesh traffic from smart plugs, sensors, and gateways.  
- [Modbus / Modbus TCP](https://osqa-ask.wireshark.org/questions/9547/does-wireshark-support-modbustcp/) (but I have not found it yet): Industrial control protocol used in meters, inverters, and controllers.  
- [DNP3](https://www.wireshark.org/docs/dfref/d/dnp3.html): Common in SCADA systems and critical infrastructure devices.  
- [IEC 61850 / MMS](https://github.com/robidev/iec61850-dissector): Substation and grid communications, including event reporting and sampled values. And an [excellent guide](https://www.mz-automation.de/12345/analysis-with-wireshark/).

### Protocol-specific testing

These tools allow for sending crafted commands, simulating devices, monitoring responses, and testing PoCs safely. 
Test in a sandboxed environment. Do not expose these tools to production networks.

Modbus

- [pymodbus (Python library)](https://pymodbus.readthedocs.io/en/latest/) – create clients/servers, craft commands, simulate slaves or masters.  
- [ModbusPal](https://github.com/SCADA-LTS/ModbusPal) – GUI-based Modbus simulator.  
- [mbtget](https://github.com/sourceperl/mbtget) – and possibly other CLI utilities for testing Modbus TCP/RTU.  

DNP3, though EOL in 2022, is still everywhere in SCADA systems (electric distribution substations, grid monitoring, 
automation controllers). It is one of the most widely deployed protocols in North American grids, and it is also found 
in European utility backbones. Vendors keep shipping gear with it because upgrading critical infrastructure protocols 
takes decades, not product cycles.

- [OpenDNP3](https://github.com/dnp3/opendnp3) – C++/C# library to build clients/servers, simulate master/slave devices. 
- [dnp3-sim](https://freyrscada.github.io/dnp3-client-master-simulator/) – Simple simulator scripts for lab testing.  

IEC 61850
- [lib60870-C](https://github.com/mz-automation/lib60870) / lib60870-Cpp – Open-source MMS-based client/server library.  
- [OpenIEC61850](https://www.openmuc.org/iec-61850/) – Java-based implementation for lab simulation.  

MQTT / CoAP
- [MQTT](https://mqtt.org/): Mosquitto broker and Eclipse Paho clients for publish/subscribe, replaying messages, and simulating multiple devices.  
- CoAP: CoAPthon or [aiocoap](https://aiocoap.readthedocs.io/en/latest/) for Python-based clients and servers.

### IoT messaging brokers

Lightweight brokers allow for simulating IoT traffic from multiple devices without touching a real network:

- Replay previously captured messages for PoC validation.  
- Test subscription/publication logic under controlled conditions.  
- Inject malformed messages for fuzzing or resilience testing.  

Example setups:  
- MQTT: Mosquitto broker running on a Raspberry Pi or lab server.  
- CoAP: CoAPthon server for lightweight IoT devices.

### Switches and hubs

Avoid unmanaged hubs or Wi-Fi-only captures; I would not want to miss packets or protocol details.

Managed switch with port mirroring / SPAN: Essential for capturing traffic from multiple devices simultaneously without interfering with network operation.  
- Connect lab devices to one VLAN and mirror traffic to a monitoring port attached to my packet capture system.  
- Use an 8–24 port managed switch with VLAN support if testing only a handful of devices.  


### Network isolation

An isolated network prevents PoC experiments from affecting other systems, prevents attackers from reaching the lab, 
and protects my home network from accidental damage.

- Air-gapped lab network: Physically or logically separate the lab from home or production networks.  
- VLANs: Segment lab traffic to control interactions between devices, controllers, and monitoring systems.  
- Dedicated router: Small router providing NAT, DHCP, and routing for the lab without touching my main LAN.  
- Firewall rules: Restrict external access to prevent accidental leakage of test traffic or exploits.

## Documentation and workflow

- Issue tracker: Redmine, Jira, or DIVD system for logging vulnerability reports and tracking lab experiments.  
- CVE record templates: Include description, impact, affected versions, references, test notes, and PoC reproducibility steps.  
- Version-controlled lab repository: Store lab notes, scripts, firmware snapshots, network captures, and configuration files for reproducibility and auditability.  
- Experiment templates: Step-by-step procedures for each vulnerability type, including prerequisites, device topology, expected outcomes, and safety checks.

## Simplistic lab diagram

```text
                          ┌─────────────────────────────┐
                          │ Version-controlled Lab Repo │
                          │ & CVE / Issue Tracker       │
                          └─────────────┬───────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ Documentation & │
                              │ Templates       │
                              └─────────┬───────┘
                                        │
                                        ▼
                        ┌─────────────────────────────┐
                        │    Isolated Lab Network     │
                        │    (Air-gapped, VLANed)     │
                        └─────────┬──────────┬────────┘
                                  │          │
                 ┌────────────────┘          └─────────────────┐
                 ▼                                             ▼
       ┌─────────────────┐                            ┌─────────────────┐
       │ Managed Switch  │                            │ Dedicated Router│
       │ VLANs + SPAN    │                            │ NAT + DHCP      │
       └───────┬─────────┘                            └────────┬────────┘
               │                                               │
    ┌──────────┼───────────┐                      ┌────────────┼───────────┐
    ▼          ▼           ▼                      ▼            ▼           ▼
┌────────┐ ┌────────┐ ┌─────────┐            ┌──────────┐  ┌────────┐ ┌──────────┐
│ Smart  │ │ Smart  │ │ Solar   │            │ Raspberry│  │ SBC    │ │ Lab PC   │
│ Plug   │ │ Meter  │ │ Inverter│            │ Pi/BBB   │  │ /MQTT  │ │ Wireshark│
└───┬────┘ └───┬────┘ └────┬────┘            └────┬─────┘  └────┬───┘ └────┬─────┘
    │          │           │                      │             │          │
    │          │           │                      │             │          │
    └──────────┴───────────┘                      │             │          │
        Connected via Ethernet / Wi-Fi            │             │          │
                                                  ▼             ▼          ▼
                                               ┌─────────────────────────────┐
                                               │ USB Sniffers / Protocol     │
                                               │ Dongles (Zigbee/Z-Wave)     │
                                               └───────────────┬─────────────┘
                                                               │
                                                               ▼
                                                  ┌───────────────────────┐
                                                  │ Firmware & Emulation  │
                                                  │ Tools (Binwalk, Ghidra│
                                                  │ QEMU, Firmadyne)      │
                                                  └───────────────────────┘

        ┌───────────────────────────────────────────────────────────┐
        │ Power & Safety Infrastructure                             │
        │ - Switched Power Strips                                   │
        │ - Surge Protectors / Lab-grade Extension Cords            │
        │ - Separate Circuits for High-Power Devices                │
        └───────────────────────────────────────────────────────────┘
```
