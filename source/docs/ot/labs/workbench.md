# OT Defence Workbench

![OT Defence Workbench screenshot](/_static/images/workbench.png)

The incidents are instructive not because the protocols were exploited, but because they were reached.
Modbus, MQTT, IEC 60870-5-104, IEC 61850 GOOSE: none carries authentication in its default configuration.
OPC UA builds signing and certificates into the handshake but ships with a None security policy that
disables them. Reaching the service is often enough regardless. The network boundary is the most consistent
enforcement point; the briefs also work through what these protocols can do when their security features
are actually turned on.

The [OT Defence Workbench](https://github.com/tymyrddin/ot-defence-workbench) was built from that
observation. This lab starts with no boundary at all and builds one brief at a time, with a probe that
tests both sides: whether the attack got through, and whether legitimate traffic kept flowing.

## The topology

Two segments. One boundary. Nothing reaches the south without crossing it.

The north segment (10.0.1.0/24) holds a client and a probe. The south segment (10.0.2.0/24) holds a
[Modbus/TCP](../protocols/modbus.md) asset server. The boundary node sits between them, starting as a transparent
bridge.

Building it up from there is the work.

The probe generates attack traffic and reports what got through. The web interface at `http://localhost:5000`
shows either HELD (all known checks passed) or OPEN (something got through). HELD is not the same as secure.
The probe's battery is finite; the asset is simulated. The scoreboard reports what the probe knows, no more.

Twenty-one briefs, each one introducing something the previous defence did not anticipate.

## MODBUS brief ladder

Modbus/TCP (port 502) carries no authentication and no integrity protection. Any host that reaches the
port can read or write any register. The ladder covers network access control, function code filtering,
topology-based controls, and transport upgrade to Modbus/TLS (RFC 8184, port 802). Nine briefs:

### 1 · block-probe

Modbus carries no authentication. Anyone who reaches port 502 can read or write any register. The boundary
starts as a transparent bridge. Setting FORWARD DROP and adding a single permit rule for the client is enough
to separate the probe from the asset. Several architectures satisfy the brief; only the outcome is tested.

### 2 · write-one-setpoint

The client needs to write a setpoint; the probe still needs to be blocked. The only distinction available at
L3/L4 is source address. A permit rule scoped to 10.0.1.10 works, and introduces the assumption that brief 4
will break.

### 3 · jump-host

Brief 2 permitted the client to reach the asset directly. Brief 3 closes that path for everyone. The boundary
DNAT-proxies all port 502 connections: no packet travels directly between north and south. Lateral movement
to the asset requires going through the single visible gate.

### 4 · spoof-proof

The probe adopts the client's address (10.0.1.10) and attempts a direct connection. The jump-host FORWARD DROP
blocks it regardless, because the rule is topological. A source-allowlist defence
fails this check. The jump-host holds.

### 5 · source-restricted-proxy

The jump-host DNAT rule in brief 3 had no source restriction: any host on the north segment could use it.
Adding a source qualifier to the PREROUTING rule means only the client's connections are forwarded. The probe's
connections find no matching DNAT entry and hit the DROP policy.

### 6 · modbus-write-filter

The iptables u32 module navigates IP and TCP headers and reads the Modbus function code byte. Write function
codes (05, 06, 15, 16) are dropped before any ACCEPT rule sees them, regardless of source. The client's writes
are also blocked; the asset becomes read-only. Source address is irrelevant to this control.

### 7 · graduated-access

Brief 6's read-only posture is too strict when the client needs to write setpoints. Adding a source exception
to the function code filter restores that: write function codes are dropped for all sources except the
authorised address. The probe can read but cannot write.

### 8 · layered-defence

The DNAT source restriction from brief 5 and the function code filter from brief 6 are combined. Each control
independently denies a different attack surface. Bypassing the source restriction still leaves the function
code filter; bypassing the function code filter still leaves the source restriction. The probe can neither
read nor write. The client retains full access. Two independent controls, both of which the probe would need
to beat simultaneously.

### 9 · modbus-tls

Briefs 1 through 8 controlled access to the plaintext Modbus service on port 502. Brief 9 takes a
different path: port 502 is blocked for everyone, and the asset serves a
[Modbus/TLS](../protocols/modbus.md) listener on port 802 (RFC 8184) for authorised clients. The probe
cannot reach the register map. The client connects through the encrypted channel and reads it. Restrict
the plaintext service and provide a cryptographic alternative: the same pattern applies to any protocol
with a defined TLS variant.

## MQTT brief ladder

MQTT (port 1883) was designed for lightweight publish/subscribe messaging in constrained environments.
It ships with anonymous access and no TLS by default; any host that connects can subscribe to all topics
or publish to command topics. Two briefs, one for each enforcement layer:

### 10 · mqtt-block-probe

[MQTT](../protocols/mqtt.md) starts with anonymous access and no TLS. Any host that reaches port 1883 can
subscribe to the full topic tree and receive all process telemetry, or publish to command topics and affect
physical state: no credentials, no exploit, just a CONNECT packet. Researchers scanning Shodan in 2023
found over 50,000 publicly reachable MQTT brokers with anonymous access; several served live industrial
process data. On a flat OT network the reach requirement drops to the same subnet.

Brief 10 applies segmentation. The requirement is the same as brief 1, for a different protocol on a
different port: the probe cannot reach the broker, the client's connection still succeeds.

### 11 · mqtt-auth

Brief 10 stopped the probe at the network layer. Brief 11 removes the network control and moves the
defence to the broker itself. The boundary is transparent; the probe completes the TCP handshake and sends
a CONNECT packet. The broker requires username and password authentication and returns CONNACK code 5. The
port is open; the connection is refused at the application layer. The client connects with valid credentials
and receives process data. The comparison echoes the one between briefs 12 and 14 in the IEC 104 sequence:
same probe, same outcome, different layer.

## IEC 104 brief ladder

IEC 60870-5-104 (port 2404) is the telecontrol protocol used for SCADA communication with substations
and field devices. Any host that completes the STARTDT handshake is treated as an authorised master.
Three briefs, each stopping the trip command at a different point:

### 12 · iec104-block-probe

[IEC 60870-5-104](../protocols/iec60870-5-104.md) carries no authentication in its base specification. Any
host that completes the STARTDT handshake is treated as an authorised master station and may send control
commands to field devices, including C_SC_NA_1, a single command that opens or closes a circuit breaker. In
December 2015, [Sandworm](../incidents/ukraine-grid.md) used plain IEC 104 sessions to open breakers at
substations across three Ukrainian oblasts and cut power to around 230,000 customers. In December 2016,
Industroyer automated the same attack: a dedicated payload that enumerated information object addresses and
issued trip commands without any credential exchange. No exploit. No credential. The protocol accepted the
commands because the station answered the phone.

Brief 12 applies the same network control as brief 1: the probe cannot reach the substation controller,
the client's monitoring connection still succeeds.

### 13 · iec104-command-filter

Brief 12 blocked the port. On a segment where the client and probe share a subnet, that also blocks any
monitoring session from a host not on the allowlist. Brief 13 takes a finer approach: the session is
allowed through, only the trip command is not. The iptables u32 module reads the IEC 104 type ID byte
directly from the TCP payload and drops any packet carrying C_SC_NA_1 (0x2D) before any ACCEPT rule sees
it, including the one that would pass it as part of an established session. STARTDT and TESTFR control
frames are six bytes; the type ID sits at byte six, which does not exist for them. They pass silently.

### 14 · iec104-sa

Briefs 12 and 13 both held at the boundary. Brief 14 removes the boundary from the equation entirely.
[IEC 62351-5](../protocols/iec62351.md) Security Authentication requires the sender to append a truncated
HMAC to each I-frame carrying a control command; the asset verifies the MAC before acting on the ASDU.
The probe connects, completes STARTDT, and sends the same trip command it sends in every IEC 104 brief.
The command reaches the asset. The asset finds no valid MAC and closes the connection. The authorised
client sends the same command with a correct HMAC and the asset acknowledges. The cross-brief comparison
is the point: briefs 12 and 13 held because the boundary acted. Brief 14 holds because the asset did.

## GOOSE brief ladder

IEC 61850 GOOSE (EtherType 0x88B8) is the Layer 2 multicast protocol used for protection tripping in
substations. It carries no IP header and cannot be IP-routed; iptables cannot see it. The boundary runs
a relay daemon that is the only available control point. Three briefs:

### 15 · goose-block-probe

[IEC 61850](../protocols/iec61850.md) GOOSE is the Layer 2 multicast protocol used for protection tripping
in substations. EtherType 0x88B8 frames are addressed to a multicast MAC and carry no IP header: they
cannot be IP-routed, and iptables cannot see them. [Industroyer](../incidents/ukraine-grid.md)'s dedicated
module used GOOSE in the 2016 Ukraine attack to send spoofed trip messages to breaker controllers. Because
there is no port to filter, the boundary runs a relay daemon that explicitly forwards 0x88B8 frames between
segments; the same relay holds a block list. The probe's MAC is added to it. The client's is not.

### 16 · goose-trip-filter

Brief 15 blocked the probe by source MAC, stopping all GOOSE from a known host. Brief 16 takes a finer
approach: the relay inspects the ASN.1 allData field in the GOOSE PDU and drops any frame whose first
entry is BOOLEAN TRUE, an execute or trip command. BOOLEAN FALSE, a cancel or normal-state publish, passes
from any source. The probe's GOOSE frames reach the relay; only the trip payload is removed before it can
reach field devices. This is the GOOSE analogue of brief 13's IEC 104 type ID filter: same structure,
different protocol, different encoding.

### 17 · goose-sa

Briefs 15 and 16 both held at the relay. Brief 17 moves the enforcement to the asset and makes the
boundary transparent. The asset validates an HMAC-SHA256 MAC appended after the GOOSE PDU per IEC 62351-6;
frames with no MAC or an invalid MAC are silently dropped. The probe's unsigned trip frame reaches the
asset and produces no response. The authorised client appends a correct MAC; the asset validates and
echoes. The three-layer GOOSE sequence completes here: relay MAC block, relay trip filter, asset security
authentication. The parallel with the IEC 104 sequence across briefs 12 through 14 is the point.

## OPC UA brief ladder

OPC-UA (port 4840) is the dominant data exchange protocol in European manufacturing
and process industry. It has three security modes (None, Sign, SignAndEncrypt) and
three authentication methods (anonymous, username, certificate). A small ladder:

### 18 · opcua-port-block

[OPC UA](../protocols/opcua.md) is the dominant data exchange protocol in European manufacturing and
process industry. This brief is the direct analogue of brief 12: the same network-layer segmentation
principle applied to a different protocol on a different port. Blocking port 4840 at the boundary prevents
the probe from establishing an OPC UA session. No application-layer inspection is required; OPC UA traffic
is indistinguishable from any TCP service at the network layer.

### 19 · opcua-auth

Brief 18 stopped the probe at the network layer. Brief 19 removes the network control and moves the
defence to the server itself. The boundary is transparent; the probe completes the TCP handshake, sends an
OPC UA Hello, and receives a rejection at the ActivateSession step with BadUserAccessDenied. The port is
open; the session is refused at the application layer. The client connects with valid credentials and reads
process data. The analogue is brief 11's MQTT broker password authentication: same probe, same outcome,
different protocol, same layer.

### 20 · opcua-sec-policy

Briefs 18 and 19 stopped the probe at the network and credential layers. Brief 20 adds a third axis: the
security policy negotiated at session establishment. The server accepts only Basic256Sha256_Sign; when the
probe connects with the None policy, the server returns an endpoint list containing no None-policy entry
and the session fails. No TCP block, no credential check: the rejection happens in the handshake. The
authorised client fetches the endpoint list, selects the matching endpoint, obtains the server certificate,
and establishes a signed session using its own certificate and private key. OPC UA's security policy is
not enforced at the network layer; the control is inside the protocol handshake itself.

## Rate limiting

Briefs 1 through 20 controlled what connections carry: content, source address, credentials, security
policy. Rate limiting controls how many connections a source may open, regardless of what they contain.
A different class of control. One brief:

### 21 · rate-limit

iptables hashlimit tracks a token bucket per source IP. The probe makes ten rapid TCP connections to
port 502; only the first three, the burst, succeed before the bucket empties and further connections are
dropped. The client's single connection falls well within its own bucket and is unaffected. The failure
mode worth knowing: this control is per source IP, not per host identity. A NAT gateway routing both
authorised and unauthorised traffic from the same address would share one bucket, and rapid legitimate
polling from a single source is equally affected.

## Both directions

Attack labs check whether an attack got through. This one checks both sides: whether the attack got through
and whether legitimate traffic kept flowing. Blocking the probe's traffic while also dropping the
client's legitimate session is a fail. The requirement is a boundary that distinguishes.

That constraint makes the briefs harder. It also makes them closer to what defensive decisions in real OT
environments actually involve.

Custom probes are possible too: attack scripts written directly in the browser interface, saved and run
independently without affecting the HELD/OPEN verdict. Custom filters work the same way, so an existing setup
can be tested against a new probe independently.

The workbench is prevention-focused. No brief asks the boundary to hold the line while also generating
evidence. Detection and alerting are a different class of tool. The HELD/OPEN verdict records whether
traffic passed; what was logged is not measured.

New briefs arrive when existing defences prove insufficient against a technique that emerged after them. The
brief ladders are never finished. The attack surfaces they exercise have not changed: the protocols are the same
as when they were specified. That is a different kind of stability.

## Setup

Requires Docker, containerlab, and Python 3.11+.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
./lab up
python web/app.py
```

The web interface comes up at `http://localhost:5000`. The probe battery, firewall component selector, and
pass/fail results are all there.

The workbench repository can be found
at [github.com/tymyrddin/ot-defence-workbench](https://github.com/tymyrddin/ot-defence-workbench).
Last updated: 10 July 2026
