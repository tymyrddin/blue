# Reducing OT attack surface

OT attack surface reduction is primarily an architecture problem, not a patching problem. The exposure that enables IT-to-OT pivot attacks is almost always a network design issue: routes that exist without review, firewall rules that were never tightened after initial commissioning, and shared engineering workstations that bridge security zones.

## Network segmentation

Enforce the IT/OT boundary with a firewall using an explicit permit list, not an implicit deny with accumulated exceptions. Every rule permitting traffic from IT to OT documents its business justification, the specific source and destination addresses, the specific ports, and the date it was last reviewed.

A data diode enforces unidirectional data flow from OT to IT for historian data replication. Process data flows outward for reporting; no traffic flows inward. Data diodes eliminate the class of attack that reaches OT by exploiting historian connectivity, at the cost of requiring unidirectional replication architectures (which are supported by modern historian products).

Avoid direct routes from historian servers to Level 2 SCADA servers. The historian's data interfaces are inbound-only: a Level 2 SCADA interface pushes data to the historian over a controlled channel; the historian does not poll Level 2 systems directly.

Avoid multi-homing engineering workstations across security zones. A workstation used for corporate IT tasks (email, web browsing) has no connection to Level 2 PLC networks in a well-segmented environment. Dedicated engineering workstations with no corporate IT connectivity are the appropriate choice for PLC programming and maintenance. Where remote engineering access is required, routing it through a dedicated, audited jump host is more controllable than through the corporate VPN to a multi-homed laptop.

## Remote access hardening

Vendor remote access is worth time-limiting and session-monitoring. No vendor account needs permanent always-on access. Proxying vendor sessions through a gateway that records session content, with explicit OT operator approval before each connection, is the appropriate control.

VPN credentials for OT access are worth keeping separate from corporate IT credentials and subject to multi-factor authentication. OT VPN connections are best scoped to the specific jump host, not the broader OT network.

Disable or remove remote desktop and remote management interfaces from PLCs, RTUs, and HMI servers that do not require them. Industrial protocols have no business being accessible from the IT network; only the historian's data interfaces cross the boundary.

## Protocol authentication

Modbus and DNP3 carry no authentication in their base specifications. Where feasible, enforce network-level access controls that restrict which IP addresses can send traffic to OT protocol ports. On managed switches in the OT network, MAC address filtering and port security prevent new devices from communicating.

Deploy OPC UA with SecurityMode set to `SignAndEncrypt` and client certificate validation enforced. Accepting self-signed certificates or deploying in `None` mode defeats the authentication entirely.

For environments that cannot retrofit authentication to existing protocols, unidirectional security gateways or application-layer firewalls that inspect OT protocol traffic and permit only expected function codes from expected addresses provide a compensating control.

## Patch management

OT patch management is constrained by availability requirements: patching a PLC requires taking the controlled process offline. The practical approach is to patch during scheduled maintenance windows, to prioritise patches for internet-facing and IT-boundary systems (historians, HMIs, jump hosts), and to ensure that engineering workstations running corporate software (Office, browser, email client) are patched on the IT schedule even if the OT engineering software cannot be updated.
