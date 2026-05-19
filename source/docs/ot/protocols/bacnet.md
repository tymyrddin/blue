# BACnet

![BACnet message exchange](/_static/images/protocol-bacnet.png)

BACnet is the building-automation one, and it is connectionless: there is no session to open, each exchange stands
alone. Who-Is and I-Am are the discovery pair, broadcast and unconfirmed, so I-Am is not really a reply to a particular
client, it goes to the segment and anyone listening learns the device's object ID and address. The split running through
the protocol is confirmed against unconfirmed services. ReadProperty, WriteProperty and SubscribeCOV are confirmed, so
they draw an ACK or an error; the broadcast announcements draw nothing. The COV subscription is the same inversion seen
in MQTT and OPC UA: subscribe once, then receive a notification only when the value moves, rather than polling on a
loop. Classic BACnet/IP carries no authentication and leans heavily on broadcast, which makes it easy to enumerate;
BACnet/SC, Secure Connect, is the newer transport that puts the traffic inside TLS.

## Development

BACnet (Building Automation and Control Networks) was developed by ASHRAE and published as ANSI/ASHRAE Standard 
135 in 1995. It is the dominant protocol for building automation: HVAC systems, lighting control, access control, 
lifts, and fire suppression. A hospital, office building, or data centre contains dozens to hundreds of BACnet 
devices, many of them internet-connected, most of them unmonitored by any security operations function.

Building automation sits in an awkward category. The systems are operational technology in the sense that they control
physical processes. They are often treated as facilities infrastructure rather than IT or OT, which means they fall
between the monitoring responsibilities of both teams. The result is that BACnet networks are frequently less
well-defended than either corporate IT or production OT.

## The protocol

BACnet defines an object model similar in concept to Profinet and EtherNet/IP. Each device exposes a set of objects
representing the physical or logical entities it manages: Analog Input objects for sensors, Binary Output objects for
relay outputs, Schedule objects for time-based control, and so on. Each object has properties that can be read or
written using BACnet services.

BACnet runs over several transport options. BACnet/IP uses UDP port 47808 and is the most widely deployed variant in
modern installations. BACnet MS/TP runs over RS-485 serial and is common in field-level devices. BACnet/Ethernet uses a
proprietary EtherType. BACnet/IP is the variant with internet exposure.

The Who-Is and I-Am services provide device discovery. A Who-Is broadcast returns I-Am responses from all BACnet devices
on the network, including their device instance number, vendor name, and model. No authentication is required. The
Who-Is broadcast is the standard starting point for both legitimate system integrators and attackers mapping a BACnet
installation.

ReadProperty and WriteProperty are the core data access services. ReadProperty retrieves any readable property of any
object on any device reachable on the network. WriteProperty sets a writable property. On a BACnet HVAC controller,
WriteProperty on the Present-Value property of a Setpoint object changes the temperature setpoint. WriteProperty on the
Present-Value of a Binary Output object directly commands a relay.

There is no authentication in the base BACnet/IP specification. Any device that can reach UDP port 47808 can discover
the installation, read all sensor values, and write to any writable object.

## Internet exposure and consequence

The nmap `bacnet-info` script queries UDP port 47808 and returns device details without authentication:

```bash
nmap -sU -p 47808 --script bacnet-info --open 10.0.0.0/24
```

From the open-source `bacnet-stack` toolset, a ReadProperty and WriteProperty against any reachable device
requires no credential:

```bash
# Read current temperature setpoint (AnalogValue object 1, Present-Value property)
bacrp <device-id> analogValue 1 presentValue

# Write a new setpoint — no authentication
bacwp <device-id> analogValue 1 presentValue 35.0
```

BACnet devices are more internet-exposed than most OT protocols. Shodan consistently indexes tens of thousands
of BACnet devices with public IP addresses, many in healthcare, education, and commercial real estate. The
Who-Is discovery service returns device details to any source; a building management system reachable from
the internet is a building management system reachable from anywhere.

The attack scenarios for BACnet differ from production OT in their consequence profile. Manipulating HVAC setpoints in a
data centre can cause thermal events that damage equipment or trigger emergency shutdowns. Manipulating HVAC in a
pharmaceutical cold chain facility can compromise product integrity. Disabling access control outputs can unlock doors.
Interfering with fire suppression control is a different severity class again.

The 2013 Target breach, while not a BACnet attack specifically, gained initial access through an HVAC contractor's
credentials. The path from building automation to corporate network exists in many organisations where building systems
and corporate IT share network infrastructure, even without being intentionally connected.

## BACnet Secure Connect

BACnet Secure Connect (BACnet/SC), published in ASHRAE 135-2020 Addendum bj, replaces the UDP-based transport with
WebSocket connections over TLS. It provides mutual authentication using X.509 certificates, message integrity, and
confidentiality. The architecture uses a hub-and-spoke model: devices connect to a Primary Hub node, which routes
traffic between devices. This eliminates broadcast-based discovery and restricts communication to authenticated
connections through the hub.

BACnet/SC is the most significant security improvement in BACnet's history. It addresses the fundamental problem of
unauthenticated UDP broadcasts on a flat network. Deployment is early: the standard was published in 2020 and device
support is growing but not yet widespread. Existing BACnet/IP installations cannot be migrated without replacing or
significantly reconfiguring devices, as BACnet/SC uses a different transport layer entirely.

For new building automation projects, specifying BACnet/SC in procurement is worth considering where device vendor
support exists. The certificate management requirements are the same class of operational cost as OPC UA: certificates
expire, renewal processes are needed, and the trust list on the hub determines which devices can participate.

## VLAN, firewall, and the monitoring gap

BACnet/IP's reliance on UDP broadcasts means network segmentation is the primary control for existing
installations. A firewall blocking UDP port 47808 from reaching the internet and from crossing into corporate
IT removes the most direct exposure:

```bash
# Block BACnet from leaving the building automation VLAN
iptables -I FORWARD -p udp --dport 47808 -o eth0 -j DROP
iptables -I INPUT  -p udp --dport 47808 ! -i vlan30 -j DROP
```

BACnet devices on a dedicated VLAN, isolated from corporate IT and from the internet, limit discovery and
access to devices on the same segment.

Many building management systems include a supervisory layer, a Building Management System (BMS) server, that aggregates
data from field devices and provides a single interface for operators. Placing this server in a DMZ and restricting
direct access to the BACnet field device VLAN to the BMS server follows the same staging pattern as the OT/IT DMZ:
operators and integrators reach the BMS, not the field devices directly.

Vendor remote access to building automation is at least as problematic as vendor access to production OT. Building
automation contractors routinely maintain persistent remote access to the systems they installed, using credentials that
predate any security review. Auditing and time-limiting vendor access to building automation systems follows the same
logic as the remote access architecture for production OT, and is applied far less often.

The absence of security monitoring on building automation networks is the gap that makes everything else worse. A BACnet
network with no logging and no anomaly detection provides no visibility into whether unexpected Who-Is broadcasts,
WriteProperty commands to unusual objects, or connections from unexpected sources have occurred. Passive monitoring
tools that can decode BACnet/IP traffic are available and are worth deploying on segments that carry building automation
traffic for any facility where a thermal, access control, or life safety event would have significant consequences.

## Related

- [HART-IP](hart-ip.md): field instrument access with a comparable internet exposure profile and absence of
  default authentication
- [MQTT](mqtt.md): IIoT messaging protocol increasingly used alongside BACnet in smart building stacks;
  similar broker exposure problems
- [BACnet International](https://www.bacnetinternational.org): maintains the BACnet standard and publishes
  interoperability guidelines
- [Shodan: port 47808](https://www.shodan.io/search?query=port%3A47808): live count of internet-exposed
  BACnet/IP devices
