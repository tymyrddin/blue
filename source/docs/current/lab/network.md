# Network tooling

A critical part of any test lab is the ability to capture, analyse, and safely manipulate network traffic from smart 
energy devices. The following tools and setup elements are essential:

## Packet capture and analysis

Use filters to focus on relevant traffic; full captures can quickly overwhelm storage. Annotate captures with device IDs and timestamps.

Wireshark with protocol dissectors: The Swiss army knife of packet analysis. For smart energy devices, use dissectors for:
- [Zigbee / Zigbee Green Power](https://www.wireshark.org/docs/wsar_html/packet-zbee_8h_source.html): Captures and decodes wireless mesh traffic from smart plugs, sensors, and gateways.  
- [Modbus / Modbus TCP](https://osqa-ask.wireshark.org/questions/9547/does-wireshark-support-modbustcp/) (but I have not found it yet): Industrial control protocol used in meters, inverters, and controllers.  
- [DNP3](https://www.wireshark.org/docs/dfref/d/dnp3.html): Common in SCADA systems and critical infrastructure devices.  
- [IEC 61850 / MMS](https://github.com/robidev/iec61850-dissector): Substation and grid communications, including event reporting and sampled values. And an [excellent guide](https://www.mz-automation.de/12345/analysis-with-wireshark/).

## Protocol-specific testing

These tools allow for sending crafted commands, simulating devices, monitoring responses, and testing PoCs safely. 
Test in a sandboxed environment. Do not expose these tools to production networks.

### Modbus

- [pymodbus (Python library)](https://pymodbus.readthedocs.io/en/latest/) – create clients/servers, craft commands, simulate slaves or masters.  
- [ModbusPal](https://github.com/SCADA-LTS/ModbusPal) – GUI-based Modbus simulator.  
- [mbtget](https://github.com/sourceperl/mbtget) – and possibly other CLI utilities for testing Modbus TCP/RTU.  

### DNP3

DNP3, though EOL in 2022, is still everywhere in SCADA systems (electric distribution substations, grid monitoring, 
automation controllers). It is one of the most widely deployed protocols in North American grids, and it is also found 
in European utility backbones. Vendors keep shipping gear with it because upgrading critical infrastructure protocols 
takes decades, not product cycles.

- [OpenDNP3](https://github.com/dnp3/opendnp3) – C++/C# library to build clients/servers, simulate master/slave devices. 
- [dnp3-sim](https://freyrscada.github.io/dnp3-client-master-simulator/) – Simple simulator scripts for lab testing.  

### IEC 61850

- [lib60870-C](https://github.com/mz-automation/lib60870) / lib60870-Cpp – Open-source MMS-based client/server library.  
- [OpenIEC61850](https://www.openmuc.org/iec-61850/) – Java-based implementation for lab simulation.  

### MQTT / CoAP

- [MQTT](https://mqtt.org/): Mosquitto broker and Eclipse Paho clients for publish/subscribe, replaying messages, and simulating multiple devices.  
- CoAP: CoAPthon or [aiocoap](https://aiocoap.readthedocs.io/en/latest/) for Python-based clients and servers.

## IoT messaging brokers

Lightweight brokers allow for simulating IoT traffic from multiple devices without touching a real network:

- Replay previously captured messages for PoC validation.  
- Test subscription/publication logic under controlled conditions.  
- Inject malformed messages for fuzzing or resilience testing.  

Example setups:  
- MQTT: Mosquitto broker running on a Raspberry Pi or lab server.  
- CoAP: CoAPthon server for lightweight IoT devices.

## Switches and hubs

Avoid unmanaged hubs or Wi-Fi-only captures; I would not want to miss packets or protocol details.

Managed switch with port mirroring / SPAN: Essential for capturing traffic from multiple devices simultaneously without interfering with network operation.  
- Connect lab devices to one VLAN and mirror traffic to a monitoring port attached to my packet capture system.  
- Use an 8–24 port managed switch with VLAN support if testing only a handful of devices.  

## Network isolation

An isolated network prevents PoC experiments from affecting other systems, prevents attackers from reaching the lab, 
and protects my home network from accidental damage.

- Air-gapped lab network: Physically or logically separate the lab from home or production networks.  
- VLANs: Segment lab traffic to control interactions between devices, controllers, and monitoring systems.  
- Dedicated router: Small router providing NAT, DHCP, and routing for the lab without touching my main LAN.  
- Firewall rules: Restrict external access to prevent accidental leakage of test traffic or exploits.