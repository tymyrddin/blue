# OPC UA

## Beginnings

OPC Unified Architecture, published by the OPC Foundation from 2006, was designed with security as a first-class concern.
It includes a formal security model with authentication, message signing, and encryption
built into the specification. It is likely the protocol in this section with the most security capability. It is also 
the one most commonly misconfigured, because its security features require setup effort and the path of least resistance 
leaves them disabled.

## The security model

![OPC UA message exchange](/_static/images/protocol-opcua.png)

OPC UA spends its first six messages on three nested steps before a single value moves. `OpenSecureChannel` sets up
signing and encryption at the transport edge, `CreateSession` establishes the application session, and `ActivateSession` is
where user credentials are actually presented. The subscription that follows runs an inversion worth noticing. Rather
than the server opening a path back to the client, the client pre-sends Publish requests and leaves them parked; the
server consumes one each time it has a data change to deliver. That is how OPC UA manages server push without the server
ever initiating a connection.

OPC UA defines three SecurityModes that govern how a session is established and messages are handled.

`None` provides no security. Messages are transmitted in plaintext, with no authentication of the client or server and
no integrity protection. A network observer can read all traffic; any device on the network can impersonate a client or
server.

`Sign` authenticates the client and server using X.509 certificates and signs every message with a digital signature.
Message content is not encrypted, but tampering is detectable.

`SignAndEncrypt` authenticates both parties and encrypts all message content. A network observer sees only ciphertext; a
man-in-the-middle who cannot access the private keys cannot read or modify messages.

The SecurityMode is negotiated during session establishment. The server maintains a list of SecurityPolicy endpoints,
each specifying a SecurityMode and a set of permitted cryptographic algorithms. A client connects to the endpoint
matching its requirements. A server that publishes a `None` endpoint alongside a `SignAndEncrypt` endpoint can be
connected to by a client that selects the `None` endpoint, regardless of the server's intent.

## Certificate management

OPC UA uses X.509 certificates for both client and server identity. Each OPC UA application has a certificate and a
corresponding private key. During session establishment, both parties exchange certificates and verify them against
their configured trust lists.

The trust list is the critical configuration element. A server that accepts any certificate, or that accepts self-signed
certificates without validation, provides authentication in name only. The common misconfiguration is setting the trust
list to accept all certificates during initial commissioning ("to get things working") and never tightening it.

A correctly configured deployment has the server's trust list populated with the specific client application
certificates that are permitted to connect, and vice versa. Any certificate not in the trust list is rejected. When a
client application is decommissioned, its certificate is removed from the trust list; the client can no longer connect
even if it retains its private key.

Certificate lifecycle management is the operational cost of the OPC UA security model. Certificates expire (typically
after one or two years), and the expiry of a server or client certificate takes the OPC UA connection down. Many OT
environments that have enabled OPC UA security have experienced unplanned outages at certificate expiry because no
renewal process was established. Monitoring certificate expiry dates and automating renewal where the toolchain supports
it prevents this class of outage.

## User authentication

Beyond application-level certificate authentication, OPC UA supports user authentication for individual sessions. The
options are Anonymous (no user identity), Username/Password, and X.509 user certificate.

Anonymous access, like the `None` SecurityMode, is appropriate for read-only public data publishing and inappropriate
for anything that involves writing data or invoking services that affect process state. An OPC UA server used for SCADA
communication where the client can invoke Write or Call services on variables that affect outputs warrants
Username/Password authentication at minimum, with credentials specific to the OPC UA application rather than shared with
other systems.

## Audit logging

OPC UA includes a defined set of auditing events. An OPC UA server can emit audit events for session creation and
closure, security policy negotiation, certificate validation outcomes, read and write operations on audited nodes, and
method calls. These events can be forwarded to a security monitoring system.

Audit logging is disabled by default on many servers. Enabling it and forwarding the events to a SIEM or OT monitoring
platform provides visibility into who is connecting, which nodes are being read or written, and when authentication
failures occur. A pattern of repeated authentication failures followed by a successful connection from an unexpected
client certificate is a recognisable indicator.

## The common deployment gap

OPC UA with `SecurityMode: None` and anonymous user access is functionally equivalent to Modbus in terms of
access control: anyone on the network who can reach the server port (default 4840) can read and write data.
The discovery is simple:

```bash
nmap -p 4840 -sV --open 10.0.0.0/24
```

With the `opcua` Python library (`asyncua` is its maintained successor, offering the same operations through
an async interface), connecting to a `None` endpoint and browsing the entire node namespace takes a handful
of lines:

```python
from opcua import Client

client = Client("opc.tcp://10.0.0.30:4840/")
client.connect()   # SecurityMode: None, anonymous — no credential exchange

root = client.get_root_node()
print(root.get_children())   # full namespace visible

# Write to a process variable — same access level
var = client.get_node("ns=2;i=1001")
var.set_value(75.0)
```

The OPC UA information model is richer and the protocol more capable than Modbus, but the security
properties are the same.

The gap between OPC UA's security capability and what is typically deployed reflects the cost of certificate
management and the operational risk of misconfiguration causing outages. Understanding which OPC UA
deployments in an environment are running in `None` mode is the first step. Moving them to `Sign` or
`SignAndEncrypt` with a properly configured trust list is the work.

## Related

- [OPC DA](opcda.md): the COM/DCOM predecessor to OPC UA; still widely deployed alongside OPC UA in
  existing installations
- [IEC 61850](iec61850.md): MMS on TCP port 102 serves a similar SCADA-to-IED role in substation environments
- [IEC 62351](iec62351.md): Parts 3 and 4 define TLS profiles for MMS and TCP-based protocols;
  OPC UA's own TLS implementation follows similar certificate management requirements
- [OPC Foundation](https://opcfoundation.org): publishes the OPC UA specification and maintains the
  compliance test programme
- [Shodan: port 4840](https://www.shodan.io/search?query=port%3A4840): internet-exposed OPC UA servers
Last updated: 10 July 2026
