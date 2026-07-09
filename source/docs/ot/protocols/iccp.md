# ICCP / TASE.2

![60870-6 message exchange](/_static/images/protocol-60870-6.png)

IEC 60870-6, more often called TASE.2 or ICCP, carries data between control centres, utility to utility, and it runs
over MMS on top of the OSI stack. Initiate establishes the association, GetDataValue reads a point, and transfer sets
handle the standing case where one centre reports to another periodically or on change. The defining feature is the
bilateral table. The set of points each centre may see or control is agreed in advance, out of band, and the server
enforces it, so holding an association does not grant the run of the system, only the run of what the table permits.
That table is doing the access-control job the protocol itself does not, which is why a TASE.2 review tends to spend as
much time on the agreement as on the link. Security beyond that has historically leaned on network controls, with IEC
62351 as the later addition.

## Standardisation

ICCP (Inter-Control Center Communications Protocol) is the application of TASE.2 (Telecontrol Application Service
Element 2), standardised as IEC 60870-6-503, to inter-utility data exchange. Where protocols like DNP3 and IEC 61850
carry data between field devices and control centres within a single organisation, ICCP carries data between control
centres across organisational boundaries: a transmission system operator exchanging real-time measurements with a
distribution network operator, two utilities sharing visibility of a border area, or a control centre replicating to
its backup site.

The protocol was developed in the early 1990s and is deployed wherever grid operators need a standardised mechanism
for inter-utility SCADA exchange. In North America it is sometimes referred to as ICCP directly; in European and IEC
contexts, TASE.2 is the more common name. Both refer to the same specification.

## The protocol stack

TASE.2 does not run directly over TCP in the way that Modbus or DNP3 do. It uses the ISO/OSI upper-layer protocol
stack carried over TCP via TPKT encapsulation (RFC 1006). The stack is: TCP, TPKT, COTP (Connection-Oriented Transport
Protocol), ISO Session, ISO Presentation, ACSE (Association Control Service Element), and then the TASE.2 application
layer. This is the same transport stack used by IEC 61850 MMS and by Siemens S7comm, which is why all three appear on
TCP port 102.

ACSE handles association establishment and release. Before any data exchange occurs, the initiating party sends an
ACSE Associate Request carrying identifying information and authentication data if configured. The responding party
accepts or rejects it. A successful association is the prerequisite for all subsequent TASE.2 exchanges.

## Bilateral Tables and the data model

The central concept in TASE.2 is the Bilateral Table. Before two control centres exchange data, their operators
negotiate out-of-band which data objects will flow in which direction. That agreement is encoded as a Bilateral Table,
configured identically on both systems. The Bilateral Table defines Data Sets (named groups of data objects), the
individual data objects within each set (with type, name, and direction), and Transfer Sets describing when each Data
Set is sent: periodically, on change, or on request.

Data object types include Indication Points for status values (breaker state, protection element), Real Points for
analogue measurements (MW, MVAR, voltage), Discrete Points for integer values, and Protection Events for time-stamped
protection operation records. A Block type allows a group of values to be transferred atomically, so the receiving
centre sees a consistent snapshot.

The Bilateral Table structure means that a correctly configured TASE.2 connection carries only the data both parties
agreed to share. What the table contains, and which direction each object flows, is visible to anyone who can observe
or participate in the connection.

## The security baseline

The base TASE.2 specification includes an authentication option at the ACSE layer: a password carried in the Associate
Request. It is rarely used. Most deployed ICCP connections rely on network-level controls, on the assumption
that the underlying WAN link is a private, provisioned circuit between known parties.

IEC 60870-6-802 defines security extensions for TASE.2, including TLS wrapping and stronger authentication. Deployment
is limited by the same constraints as other OT protocol security extensions: both parties' ICCP gateway software needs
to support it, and many implementations in service predate the extension.

The private WAN assumption has historically been more defensible for ICCP than for substation protocols, because
inter-utility links are explicitly provisioned. A Modbus device on a flat network is
one VLAN hop from anything on the corporate LAN; an ICCP connection between two TSOs typically runs over a dedicated
MPLS circuit. The circuit is a compensating control by accident of architecture. Where that circuit is replaced by
a VPN over the internet, or where ICCP traffic crosses a segment with broader access, the assumption dissolves.

## An association without credentials

An attacker able to reach TCP port 102 on an ICCP gateway can attempt an ACSE association. Without application-layer
authentication, there is no credential to present. A correctly formatted Associate Request that includes the expected
VCC (Virtual Control Centre) name and Bilateral Table identifier may be accepted, depending on how strictly the gateway
validates the incoming association parameters.

Port 102 appears alongside IEC 61850 MMS and Siemens S7comm on the same TCP port. Discovery is a single scan:

```bash
nmap -p 102 --open 10.0.0.0/24
```

Capturing the association exchange for analysis, with TPKT decoding to surface the ISO upper-layer stack:

```bash
tshark -i eth0 -f "tcp port 102" -d tcp.port==102,tpkt -w iccp_capture.pcap
```

A successful association provides two capabilities. Reading: the attacker receives all data the providing party
publishes under the agreed Transfer Sets, including real-time measurements and status values across the inter-utility
boundary. Writing: if the Bilateral Table includes data objects flowing in the attacker's direction, the attacker can
publish fabricated values to the consuming control centre. An operator at the consuming centre sees the injected values
as real telemetry.

The cross-boundary nature of ICCP amplifies the data injection risk. A compromised connection does not just affect one
control centre's picture; it affects both parties' shared visibility of the boundary area. Grid operators making
switching decisions based on inter-utility measurements are acting on data that may originate from a system outside
their security perimeter.

Denial of service at the ACSE level is straightforward. Dropping the TCP connection or sending a malformed ACSE
Release forces the association to re-establish. During the re-establishment period, both parties lose inter-utility
visibility for that data exchange relationship. In a grid operation context, where inter-utility measurements inform
congestion management and dispatch decisions, visibility loss at the wrong moment carries operational consequence
beyond the SCADA layer.

The ISO upper-layer stack also affects monitoring coverage. Many OT network monitoring tools decode Modbus, DNP3, and
IEC 61850 fluently but have limited TASE.2 decoding capability. An ICCP connection that is opaque to the monitoring
platform is a blind spot in the security picture even when the network traffic is visible.

## Private links and firewall rules

Dedicated private WAN or MPLS for inter-utility ICCP links is the most common structural control and the most
effective one. A provisioned circuit between two specific endpoints carries ICCP traffic between known parties on a
path that does not share infrastructure with the public internet. Where dedicated WAN is unavailable, a site-to-site
VPN over the internet with certificate authentication of both endpoints provides a comparable boundary, at the cost of
depending on the VPN implementation.

Firewall rules restricting TCP port 102 to the specific IP addresses of known ICCP trading partners, applied at the
ICCP gateway's network boundary, limit who can initiate associations. The rule set for a typical ICCP deployment is
small: a control centre may exchange data with five to twenty counterparties, each with a known IP range. Any
association attempt from outside that set is blockable without affecting legitimate exchanges:

```bash
# Permit only known trading-partner addresses on port 102
iptables -I INPUT -p tcp --dport 102 -s 192.0.2.10/32 -j ACCEPT
iptables -I INPUT -p tcp --dport 102 -s 192.0.2.11/32 -j ACCEPT
iptables -A INPUT -p tcp --dport 102 -j DROP
```

Deploying ICCP on a dedicated gateway host creates a network separation between the inter-utility connection
and the internal OT environment. The gateway handles
association management and forwards only the negotiated data objects to the internal historian or SCADA display. An
attacker who reaches the gateway does not automatically reach the broader control centre network.

ACSE authentication, where both parties' implementations support it, adds the step of verifying a shared secret before
accepting an association. Combined with TLS under IEC 60870-6-802 where available, this addresses the
unauthenticated-access gap without requiring network changes. The operational cost is key management between
counterparties, which introduces a coordination requirement that does not exist for unilateral network controls.

Auditing ACSE association events, including accepted and rejected associations and the VCC names presented, provides
detection capability. An unexpected VCC name in an Associate Request, or an association from an IP address not in the
permitted set, is a recognisable signal even without deep TASE.2 protocol decoding.

## Related

- [IEC 61850](iec61850.md): shares TCP port 102 via MMS; the same ISO upper-layer stack, the same monitoring
  challenge, a different application layer
- [IEC 60870-5-104](iec60870-5-104.md): the RTU-level counterpart; ICCP operates at the control-centre layer above
  it, exchanging aggregated measurements between organisations
- [DNP3](dnp3.md): comparison protocol for inter-substation data in North American utilities; different architecture
  and a different trust model, but the same no-auth baseline in base deployments
- [IEC 62351](iec62351.md): Parts 3 and 4 provide TLS for TASE.2 over TCP and MMS; the security extension most
  relevant to inter-utility ICCP links
- [Shodan: port 102](https://www.shodan.io/search?query=port%3A102): internet-exposed MMS and ICCP endpoints,
  alongside IEC 61850 and Siemens S7comm traffic on the same port
