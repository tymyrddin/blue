# DNP3

![DNP3 message exchange](/_static/images/protocol-dnp3.png)

DNP3 fills in what Modbus leaves out. The outstation can speak first: an unsolicited response is event data pushed
without a poll, report-by-exception rather than the master asking on a loop. Static and event data are sorted into
classes, so an integrity poll for current values is a different request from an event poll. The control path is the part
worth dwelling on. A breaker or a setpoint is not thrown in a single message. The master sends `SELECT` to arm one
specific point, the outstation echoes back what it understood, and OPERATE then executes it, with the outstation
refusing any `OPERATE` that does not match the `SELECT`. That interlock guards against a stray or garbled message actuating
plant, but it is a safety mechanism rather than a security one, since whoever can send `SELECT` can send the matching
`OPERATE`. Classic DNP3 still carries no authentication, and DNP3 Secure Authentication exists as an add-on that is
unevenly deployed in the field.

## Background

DNP3 (Distributed Network Protocol 3) was developed in 1990 for communication between SCADA masters and remote terminal
units in electric utility environments. It is more complex than Modbus: it supports fragmented messages, unsolicited
responses from outstations, time synchronisation, file transfer, and a richer object model for representing different
data types. It is the dominant protocol for electric utility SCADA in North America and is widely deployed in water and
wastewater systems.

Like Modbus, the base specification carries no authentication. DNP3 Secure Authentication version 5, published in 2012
as IEEE 1815 Annex A, added a challenge-response authentication mechanism. Most deployed DNP3 does not use it.

## The protocol structure

A DNP3 message passes through three layers. The Data Link Layer frame carries a Start field (0x0564), a Length byte, a
Control byte, and Destination and Source addresses. The Transport Layer adds a header byte that indicates whether the
fragment is the first, last, or intermediate piece of a multi-fragment Application Layer message. The Application Layer
contains the actual request or response, consisting of a header with sequence number and function code, followed by
object headers each specifying a Group, Variation, and set of data points.

The Group/Variation system is what gives DNP3 its expressiveness. Group 12 Variation 1 is a Control Relay Output Block,
the object used to operate a breaker or switch. Group 30 is Analog Input. Group 40 is Analog Output. A DIRECT OPERATE
request on Group 12 Variation 1 actuates a physical output without requiring the master to first send a SELECT (the
two-step SELECT/OPERATE sequence that some devices require). The function codes that carry these requests are available
to anyone on the network.

## Impersonating the master on port 20000

DNP3 outstations listen on TCP port 20000 by default. Discovery is straightforward:

```bash
nmap -p 20000 -sV --open 10.0.0.0/24
```

Without SA v5, a device on the network that can source correctly formatted DNP3 frames can impersonate the
master. A DIRECT OPERATE request on Group 12 Variation 1 — the Control Relay Output Block — actuates a
physical output. The outstation has no way to distinguish the legitimate master from an attacker: both look
identical at the application layer.

The Application Layer bytes for a DIRECT OPERATE on a single CROB point are:

```
0xC1 0x03 0x0C 0x01 0x28 0x01 0x00 [IOA_low] [IOA_high] 0x03 0x01 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00
```
where function code 0x03 is DIRECT OPERATE, group/variation 0x0C 0x01 is Group 12 Variation 1 (CROB),
qualifier 0x28 carries a 2-byte count (0x01 0x00 = one object, little-endian) and a 2-byte index
([IOA_low] [IOA_high]), control code 0x03 is LATCH_ON, count byte 0x01 is one operation, the eight zeroes
are on-time and off-time in milliseconds (both zero for LATCH_ON), and the final 0x00 is the status byte. Public frameworks including Metasploit carry
modules that construct and send this exchange.

The unsolicited response mechanism adds a second surface: an attacker who can reach the outstation can issue
ENABLE UNSOLICITED RESPONSES pointing at a different destination, redirecting telemetry to an address they
control. The master's display goes stale while the attacker sees live data.

Data Link Layer addresses are two bytes and assigned during commissioning, but there is no mechanism in the
base specification to prevent a device from accepting frames addressed to any outstation address.

## DNP3 Secure Authentication v5

SA v5 adds a challenge-response mechanism between master and outstation. Before processing a critical request (one that
operates an output or changes configuration), an outstation issues a challenge containing a random nonce. The master
responds with an HMAC computed over the challenge, the request, and a shared key. The outstation verifies the HMAC
before executing the request.

The shared keys are pre-provisioned: an Update Key is installed on both master and outstation during commissioning, and
session keys are derived from it periodically. The key update process itself is authenticated using the Update Key, so
an attacker without the Update Key cannot replace keys.

SA v5 protects against the most consequential attack: an unauthorised party operating outputs. It does not encrypt
traffic, so an observer can read telemetry values. It does not authenticate all messages, only those the outstation's
configuration designates as critical.

Deployment requires both the master software and the outstation firmware to support SA v5. For new systems specifying
DNP3, requiring SA v5 support in procurement is straightforward. For existing systems, the retrofit path depends
entirely on whether the outstation vendor has released SA v5 firmware for the hardware version in service.

## Blocking what the base specification will not

Where SA v5 is not deployed, the compensating controls follow the same logic as for Modbus. Permit-listing
the IP addresses of legitimate DNP3 masters limits who can source DNP3 traffic to outstations:

```bash
# Permit DNP3 only from the SCADA master on port 20000
iptables -I INPUT -p tcp --dport 20000 -s 10.0.10.5/32 -j ACCEPT
iptables -A INPUT -p tcp --dport 20000 -j DROP
```

Function code filtering at an application-layer firewall restricts critical function codes (DIRECT OPERATE,
function code 3; OPERATE, function code 4) to traffic from the legitimate master addresses. Monitoring tools
that baseline normal DNP3 traffic patterns can alert on function codes, Group/Variation combinations, or
source addresses that have not previously appeared.

Passive monitoring is particularly valuable for detecting reconnaissance: a device sending READ requests
across a range of Group/Variation combinations it has not previously used is a recognisable pattern.

## Related

- [Modbus](modbus.md): the simpler predecessor; same no-auth design, same network-level defence logic
- [IEC 60870-5-104](iec60870-5-104.md): the European/global equivalent of DNP3 for utility SCADA; identical
  security gap, similar compensating controls
- [IEC 62351](iec62351.md): the security standard series; SA v5 implements the same challenge-response model
  as IEC 62351 Part 5
- [Shodan: port 20000](https://www.shodan.io/search?query=port%3A20000): internet-exposed DNP3 outstations
Last updated: 19 May 2026
