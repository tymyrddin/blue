# EtherNet/IP

![EtherNet/IP message exchange](/_static/images/protocol-eip.png)

EtherNet/IP is CIP carried over Ethernet, and its character is the split down the middle of the diagram. RegisterSession
returns a session handle, which is a routing token: it identifies the conversation, it does not
authenticate the originator. Explicit messaging then runs request/response over TCP for configuration and diagnostics,
each SendRRData wrapping a CIP service. ForwardOpen is the pivot. It asks the Connection Manager to set up a Class 1
connection at a requested packet interval, and once that exists the actual process data leaves TCP entirely and runs as
cyclic UDP in both directions. For a threat model the two halves differ: the explicit TCP side is reachable and
unauthenticated in classic deployments, and CIP Security, the later TLS and DTLS profile, is the part that has to be
deliberately enabled.

## Development

EtherNet/IP (Ethernet Industrial Protocol) was developed by Rockwell Automation and published by ODVA in 2001. It runs
the Common Industrial Protocol (CIP) over standard TCP and UDP, making it the dominant OT protocol for discrete
manufacturing in North America and widely deployed in automotive, food and beverage, and packaging industries. Its use
of standard Ethernet and IP means it coexists on the same physical infrastructure as IT networks more readily than older
serial protocols, which is both its operational advantage and its security liability.

## CIP and the object model

CIP is the application-layer protocol that EtherNet/IP carries. It defines an object model where every device exposes a
set of objects, each with attributes that can be read or written and services that can be invoked. The Identity Object (
class 0x01) returns vendor name, device type, product code, revision, and serial number. The Connection Manager Object
handles the establishment of I/O connections and explicit messaging connections.

EtherNet/IP uses two transport mechanisms. Explicit messaging runs over TCP port 44818 and is used for configuration,
parameterisation, and on-demand data reads and writes. Implicit messaging (I/O messaging) runs over UDP port 2222 using
a producer-consumer model: a PLC and an I/O device establish a connection, and the device produces data at a configured
rate which the PLC consumes. The I/O data in an implicit messaging connection maps directly to PLC input and output
tags.

There is no authentication in the base CIP specification for either explicit or implicit messaging. Any device that can
reach TCP port 44818 can read device identity, read and write configuration parameters, and issue CIP service requests
including Forward Open (establish an I/O connection) and Reset (reboot the device).

## Identity Object, Forward Open, Reset

The Identity Object is the standard reconnaissance starting point. The nmap `enip-info` script queries it
without authentication:

```bash
nmap -p 44818 --script enip-info --open 10.0.0.0/24
```

This returns vendor, product name, firmware revision, and serial number for every EtherNet/IP device on the
segment. The pycomm3 library goes further — it can read and write PLC tags over the same unauthenticated
explicit messaging connection:

```python
from pycomm3 import LogixDriver

with LogixDriver('10.0.0.40') as plc:
    print(plc.get_module_info())       # Identity Object, no credential
    print(plc.read('Motor1_Speed'))    # read a process tag
    plc.write(('Conveyor_Run', False)) # write an output tag — no auth
```

Forward Open requests establish I/O connections. An attacker who can send a Forward Open to a drive or I/O
module can establish an implicit messaging connection and begin producing data to that device's output tags.
On a drive, those output tags include the reference speed and run/stop command. The legitimate PLC's existing
connection may be displaced or coexist, depending on the device's connection handling.

The Reset service (CIP service 0x05 on the Identity Object) reboots the device. It requires no authentication
on most implementations and is a straightforward availability attack.

## CIP Security

CIP Security, published by ODVA in 2018, adds TLS for explicit messaging over TCP and DTLS for implicit messaging over
UDP. It provides device authentication via certificates, message integrity, and confidentiality. The security profile is
negotiated during connection establishment; a device that supports CIP Security can enforce that connections use it.

Deployment is limited. CIP Security requires support in both the originator (typically a PLC or engineering workstation)
and the target device. Rockwell's ControlLogix 5580 and CompactLogix 5380 families support it; support across the
broader EtherNet/IP device ecosystem is uneven. Existing installations cannot retrofit CIP Security to devices that do
not support it in firmware.

For new installations specifying EtherNet/IP, including CIP Security requirements in device procurement is the practical
path. For existing installations, the compensating controls are network-based.

## Ports, segments, and what gets through

EtherNet/IP uses known ports: TCP 44818 for explicit messaging, UDP 44818 for ListIdentity, UDP 2222 for
implicit messaging. Restricting them to known sources is the first and most direct control:

```bash
# Explicit messaging: permit only engineering workstation and SCADA master
iptables -I INPUT -p tcp --dport 44818 -s 10.0.10.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 44818 -j DROP
# Implicit I/O: permit only the PLC controller
iptables -I INPUT -p udp --dport 2222 -s 10.0.20.5/32 -j ACCEPT
iptables -A INPUT -p udp --dport 2222 -j DROP
```

The implicit messaging connections between PLCs and I/O devices typically stay within a single control VLAN
and do not cross the IT/OT boundary. Isolating these connections at the VLAN level means an attacker who has
reached the corporate network cannot establish I/O connections directly.

Managed switches that support port-based access control can restrict which MAC addresses originate traffic on
process network ports, limiting the ability of a new device physically connected to the network to participate
in EtherNet/IP communication.

Network monitoring tools that baseline normal EtherNet/IP traffic patterns can alert on new CIP connections,
Forward Open requests from unexpected sources, and Reset service requests. Rockwell's Cisco partnership and
the ODVA ecosystem include several tools that provide this visibility.

## Rockwell-specific considerations

A significant proportion of EtherNet/IP deployments run Rockwell PLCs managed by Studio 5000 Logix Designer. The PLC's
Ethernet port uses EtherNet/IP for both I/O communication and programming. A Logix PLC with its Ethernet port reachable
from outside the OT network is reachable for program uploads and downloads. The PLC password feature (available on
ControlLogix and CompactLogix) protects against unauthorised downloads; it is not enabled by default and is distinct
from any network-level access control.

The ENIP/CIP scanning and exploitation tooling in publicly available frameworks (including Metasploit modules and
purpose-built tools such as cpppo and pycomm3) means that reaching port 44818 on an unprotected PLC translates to
capability quickly. Network access is the critical control.

## Related

- [Profinet](profinet.md): the European counterpart; same Ethernet-native design, similar cyclic/acyclic split
  and similar attack surface
- [Modbus](modbus.md): the simpler field protocol; same no-auth baseline, simpler compensating controls
- [IEC 62351](iec62351.md): CIP Security follows a similar TLS-over-TCP model to IEC 62351 Parts 3 and 4
- [ODVA](https://www.odva.com): publishes the EtherNet/IP and CIP specifications
- [Shodan: port 44818](https://www.shodan.io/search?query=port%3A44818): internet-exposed EtherNet/IP devices
