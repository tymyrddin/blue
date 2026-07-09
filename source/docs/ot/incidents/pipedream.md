# Pipedream

Every other incident in this section describes something that happened. Pipedream describes something that was
ready. CISA, the NSA, the FBI, and the Department of Energy jointly disclosed the framework in April 2022,
describing it as the most comprehensive ICS attack tool ever publicly documented. It had been developed and
tested but not yet deployed against a live target when discovered. What was found covered multiple industrial
protocols in a single framework: scanning OT networks, enumerating devices, manipulating process data,
modifying PLC firmware to brick controllers, disabling safety systems. Dragos attributed the framework to a
group they track as Chernovite, assessed as Russian state-sponsored.

## April 2022

The joint advisory, published on 13 April 2022 as CISA advisory AA22-103A, used the name Pipedream (the
government and Mandiant designation) alongside INCONTROLLER (the Dragos designation). Both refer to the same
framework. The advisory specifically noted that the tool had been developed but not deployed, and was being
disclosed so that defenders could identify and respond before use.

The timing placed the disclosure two months into Russia's full-scale invasion of Ukraine. Dragos attributed
the framework to an adversary they track as Chernovite, assessed as Russian-nexus and previously untracked as
a distinct group.

## Seven components

Pipedream comprised at least seven distinct components, each targeting a different protocol, device type, or
phase of an attack.

A network enumeration component scanned for OT devices across multiple protocols. Modbus TCP components read
and wrote to registers on Schneider Electric MODICON PLCs. OPC-UA components connected to OPC-UA servers,
browsed item namespaces, and read and wrote process variables. A CODESYS component exploited vulnerabilities
in the CODESYS runtime, a widely deployed PLC programming environment used by controllers from many
manufacturers. An OMRON-specific component used a proprietary communication protocol to reach OMRON SYSMAC
controllers. A further component could upload modified firmware to PLCs with the capability to brick the
device.

```bash
# An enumeration sweep across the OT protocol ports Pipedream's scanner component addressed
nmap -p 502,44818,4840,102,2404 --open 10.0.0.0/24
```

Modbus (502), EtherNet/IP (44818), OPC-UA (4840), MMS/ICCP (102), IEC 60870-5-104 (2404). A single tool that
handles all of these moves through a heterogeneous OT environment with no need to specialise per site.

## Multi-protocol coverage

The breadth is the departure from previous ICS malware. Stuxnet targeted a specific Siemens PLC configuration.
Industroyer had dedicated modules per protocol but was built around a specific grid infrastructure. TRITON
targeted a specific safety controller model. Pipedream was designed for heterogeneous environments: a tool that
could assess what was present on a network and select the appropriate attack module based on what it found.

The CODESYS targeting extends this further. CODESYS Runtime is used by PLCs from Schneider Electric, Beckhoff,
Wago, ABB, and many other manufacturers. A single vulnerability in CODESYS Runtime reaches controllers from
all of them. Pipedream's CODESYS component was not targeting a brand; it was targeting an ecosystem shared
across vendors.

The OPC-UA component operates on a protocol designed for cross-vendor interoperability. Connecting to an
OPC-UA server and browsing its namespace returns the full list of available process variables from any
compliant device, regardless of manufacturer. Pipedream's use of OPC-UA for enumeration and manipulation turns
a design property into a uniform attack surface:

```python
from opcua import Client  # pip install opcua; deprecated in favour of asyncua but still functional

client = Client("opc.tcp://10.0.0.30:4840/")
client.connect()   # SecurityMode: None, anonymous access on a misconfigured server

root = client.get_root_node()
print(root.get_children())   # full process variable namespace, any vendor, any device type
```

## Firmware destruction

The component capable of modifying PLC firmware to brick the device represents a different category of impact
from disruption. A PLC whose firmware has been overwritten with a corrupted image does not fail gracefully into
a safe state. It stops executing its control programme and may not respond to standard recovery procedures.
Restoration requires physical access, specialised tools specific to the device model, and hardware replacement
if recovery fails. In a substation or processing facility, the timeline is days to weeks rather than hours.

Combined with a wiper payload targeting engineering workstations, the combination removes both the controller
and the workstation used to restore it. The two together are designed to maximise recovery time.

## Found before use

The most unusual aspect of the Pipedream disclosure is its timing. Previous ICS attack tools became public
after use, during post-incident analysis. Pipedream was disclosed before deployment. Defenders received
warning, indicators of compromise, and detection guidance in advance of any confirmed attack.

What the discovery established, regardless of whether the tool was ever deployed, is the level of development
investment a state-sponsored adversary was prepared to make in OT attack capability in 2022: a multi-protocol
framework requiring deep knowledge of MODICON, OMRON, CODESYS, and OPC-UA, developed and tested to
operational readiness, covering the range of equipment present in electric utility and process industry
environments. The capability ceiling it reveals is the thing worth recording.

## Related

- [Modbus](../protocols/modbus.md): one of Pipedream's primary attack protocols; the register access model the
  MODICON modules used for process data manipulation and control
- [OPC UA](../protocols/opcua.md): used by Pipedream for cross-vendor device enumeration and process variable
  writes; the interoperability design property repurposed as a uniform attack surface
- [EtherNet/IP](../protocols/ethernetip.md): the network-layer protocol for MODICON PLCs; the access layer
  beneath the Modbus and engineering protocol components
- [CISA advisory AA22-103A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-103a): original
  joint advisory with technical detail, indicators of compromise, and detection guidance, April 2022
- [Smart Grid SimLab](../labs/smart-grid-sim): nation-pipedream models the multiphase capability; spoofing,
  demand spike, wiper attacks, and EV charger shutdown in one observable sequence
- [ICS Access and Persistence SimLab](../labs/ics-access-simlab): anonymous OPC-UA, unauthenticated REST
  injection, and Modbus without authentication; the protocol surfaces Pipedream targeted
- [OT Defence Workbench](../labs/workbench): brief 8 combines source restriction and function code filtering
  as independent controls; brief 12 applies network enforcement to IEC 104, one of the protocols in
  Pipedream's scanner; briefs 18 through 20 cover OPC UA, from port block through credential enforcement
  to security policy negotiation, the three layers Pipedream's anonymous OPC UA component bypassed
Last updated: 20 May 2026
