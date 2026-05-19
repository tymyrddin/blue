# Profinet

![Profinet message exchange](/_static/images/protocol-profinet.png)

PROFINET separates a real-time channel from a setup channel, and the diagram is mostly setup. DCP, the Discovery and
Configuration Protocol, is the first step and the one worth pausing on: it finds and names devices at Layer 2 with no
authentication, so a DCP Identify or a DCP Set is something any host on the segment can issue, which is a recurring soft
spot in PROFINET assessments. Once a device is found, `Connect` builds the Application Relation, `Write` loads the parameter
records, `PrmEnd` closes parameterisation, and the device answers with Application Ready. Only after all of that does the
cyclic real-time exchange settle into its rhythm, and those RT frames run straight on Ethernet with their own EtherType,
beneath IP. PROFINET Security exists as a more recent set of capability classes, but a large installed base predates it.

## Start at vendor

Profinet (Process Field Network) was developed by Siemens and standardised by PI International (Profibus and Profinet
International) from 2003. It is the dominant OT protocol in European manufacturing and is widely deployed in automotive,
pharmaceutical, and process industries. Like EtherNet/IP, it runs over standard Ethernet infrastructure, which
simplifies physical deployment and complicates network-level isolation.

Profinet defines three conformance classes with increasing real-time requirements. Profinet RT (Real-Time) runs over
standard Ethernet using a dedicated EtherType (0x8892) for cyclic I/O data, with TCP/UDP used for acyclic communication.
Profinet IRT (Isochronous Real-Time) uses hardware-scheduled Ethernet for sub-millisecond cycle times in motion control
applications. Most installations use RT; IRT is confined to applications where cycle time precision is critical.

## The communication model

Profinet communication falls into two categories. Cyclic data exchange carries I/O data between a controller (typically
a Siemens PLC) and its IO-devices at a configured cycle time. Acyclic communication handles parameterisation,
diagnostics, and alarm handling. The distinction is worth attention because the two use different transport mechanisms
with different access control properties.

Cyclic data exchange is established through a connection setup process. A controller sends a Connect request to an
IO-device, negotiating cycle time, data length, and other parameters. Once established, cyclic frames flow at the
negotiated rate using the RT EtherType directly over Ethernet. There is no authentication in this connection setup and
no authentication on the cyclic frames themselves. A device on the same VLAN that can source correctly formatted
Profinet frames can inject data into the cyclic exchange.

Acyclic communication uses UDP port 34964 for the Profinet Discovery and Configuration Protocol (DCP) and various
UDP/TCP ports for record data access. DCP provides device discovery similar to EtherNet/IP's ListIdentity: a DCP
Identify.ReqMulticast broadcast returns all Profinet devices on the segment with their station names, IP addresses, and
device roles. DCP also provides the Set command, which can change a device's IP address and station name without
authentication.

## The attack surface

DCP runs at Layer 2 (EtherType 0x8892) and on UDP port 34964 for discovery. A broadcast Identify request
from any host on the segment returns every Profinet device with its station name, IP address, and device role.
The `nmap` scan for port 34964 maps the acyclic side:

```bash
nmap -sU -p 34964 --open 10.0.0.0/24
```

DCP's unauthenticated Set command is the most directly exploitable mechanism. An attacker on the same network
segment can send a DCP Set.ReqUnicast to any Profinet device and reassign its IP address, rename it, or reset
it to factory defaults. Tools including `plcscan` and custom Scapy frames targeting EtherType 0x8892 send
this in a single packet with no prior session:

```python
from scapy.all import Ether, sendp

# DCP Set: rename device (any host on the segment can do this)
# EtherType 0x8892, destination MAC of the target IO-device
pkt = Ether(dst='00:1b:1b:12:34:56', type=0x8892) / dcp_set_name('attacker-name')
sendp(pkt, iface='eth0')
```

Renaming a device can cause the controller to lose its connection to it if the controller is configured to
connect by station name. Resetting to factory defaults causes the device to drop its configuration and stop
participating in the automation task.

The unauthenticated connection setup for cyclic data exchange means a device that can spoof the controller's MAC
address, or that sends a competing Connect request, can displace the legitimate controller's I/O connection. The
IO-device accepts the new connection and begins exchanging data with the new originator. On an IO-device controlling a
motor or valve, the new originator controls the output.

Acyclic record data access allows reading and writing of device parameters. The specific parameters accessible depend on
the device implementation and its access rights model. Profinet defines access levels (no access, read, write) for
record data objects, but enforcement is device-dependent and the authentication mechanism for enforcing those levels is
not standardised in the base specification.

## Profinet Security

The Profinet Security guideline (published by PI International, incorporating IEC 62443 principles) addresses security
through a combination of protocol-level and network-level measures. At the protocol level, a Profinet Security extension
adds authentication for connection setup and integrity protection for cyclic data. The extension uses pre-shared keys
distributed during device commissioning.

As with CIP Security and IEC 62351 Part 6, deployment of the security extension requires firmware support from device
vendors and a key distribution process during installation. It is more widely specified in new industrial automation
projects in Europe than its equivalents in North America, partly because IEC 62443 compliance is increasingly required
in European procurement. Retrofit to existing installations faces the same constraints as other OT protocol security
extensions: devices that do not support it in firmware cannot be upgraded without hardware replacement.

## What managed switches can do

DCP is confined to the local Ethernet segment; it does not route across IP boundaries. Placing Profinet
devices on a dedicated VLAN limits DCP exposure to devices on the same segment. A managed switch blocking
DCP frames from non-Profinet ports prevents workstations on the IT network from reaching the discovery and
configuration protocol. On a Cisco switch this is an ACL on the VLAN interface:

```
ip access-list extended BLOCK-DCP
 deny  udp any any eq 34964
 permit ip any any
interface Vlan10
 ip access-group BLOCK-DCP in
```

The Siemens Scalance switch family and similar managed OT switches provide port-based controls that restrict
which MAC addresses originate Profinet traffic on each port. An IO-device port configured to accept traffic
only from its assigned controller's MAC address provides concrete protection against connection displacement
attacks.

Network monitoring that baselines the set of MAC addresses communicating with each device and alerts on new
sources provides visibility into connection attempts from unexpected origins.

## Siemens S7 and the shared port

Siemens PLCs running Profinet also respond on TCP port 102 to the S7comm and S7comm-plus protocols used by STEP 7 and
TIA Portal. Port 102 is the same port used by IEC 61850 MMS, though the protocol above it differs. S7comm is the older
variant used by S7-300 and S7-400 series; S7comm-plus, used by S7-1200 and S7-1500 series, added a session token
mechanism and later TLS, providing stronger protection than the original.

A Siemens PLC reachable from outside the OT network on port 102 is reachable for program upload and download, depending
on the protection level configured in the CPU properties. The Stuxnet worm, which targeted Siemens S7-315 and S7-417
PLCs, used S7comm to upload malicious program blocks after reaching the PLC via the engineering port. Protection level
configuration in TIA Portal, combined with network-level restriction of port 102 access to engineering workstations,
addresses this surface.

## Related

- [EtherNet/IP](ethernetip.md): the North American counterpart; same Ethernet-native cyclic/acyclic split,
  comparable attack surface and compensating controls
- [IEC 61850](iec61850.md): shares TCP port 102 for MMS; Siemens PLCs with Profinet also respond on port 102
  via S7comm, making port-level scanning ambiguous
- [Modbus](modbus.md): the simpler register-based protocol; often present alongside Profinet in mixed
  European installations
- [Shodan: port 34964](https://www.shodan.io/search?query=port%3A34964): internet-exposed Profinet DCP
  endpoints
