# Defence in depth

The principle is that no single control is assumed to hold. An attacker who defeats the perimeter finds
another control waiting; one who bypasses authentication at the network layer faces it again at the device.
In OT environments, where the consequences of a breach can be physical and where replacing controls carries
availability risk, the principle is both more important and harder to apply than in enterprise IT.

## The layer sequence

Physical access controls are the outer layer: locked equipment rooms, physical port controls on field
devices, barriers between Level 1 equipment and anyone who has not been authorised to reach it. Physical
security is frequently overlooked in the threat model because it does not appear in network diagrams, but
many OT attacks are simplified by physical proximity, and some require it.

Network segmentation is the next layer: the Purdue zone model, the IT/OT boundary, and the conduit
controls documented in IEC 62443. Segmentation limits what an attacker who has obtained a foothold in one
zone can reach without explicitly crossing a defended boundary. The [IT/OT boundary](boundary.md) and
[zone architecture](zones.md) pages cover the design decisions in detail.

Endpoint controls are the layer inside the network: application whitelisting, removable media restrictions,
minimal installed software, and hardened configurations on engineering workstations and SCADA servers.
These apply within a zone to limit what can execute on a host that an attacker has already reached.

Protocol and application controls sit as the innermost layer: function code filtering on [Modbus](../protocols/modbus.md), command
type filtering on [IEC 104](../protocols/iec60870-5-104.md), security policy enforcement on [OPC UA](../protocols/opcua.md), and authentication at the asset level
through standards such as [IEC 62351](../protocols/iec62351.md). These limit what an attacker who has reached a legitimate session can
do once connected. The distinction between a network control that prevents the session and a protocol
control that validates it after the session is established is the difference between briefs 12 and 14 in
the [workbench](../labs/workbench.md) IEC 104 sequence.

## Where OT complicates the picture

Legacy systems that cannot be updated, patched, or reconfigured constrain which layers are available. A
PLC running firmware from 2005 with no authentication capability cannot be given authentication capability.
A SCADA server on an end-of-life operating system cannot be given a current endpoint protection agent. The
layers that cannot be added have to be compensated for by strengthening the layers that can.

Availability requirements limit when controls can be tested or changed. A control loop running a continuous
process cannot be interrupted for a configuration change during production. Defensive changes accumulate in
maintenance windows that may be months apart, and whether a control is working as intended may not be
answerable until the next window.

The two constraints together define the practical shape of OT defence in depth: compensating controls
applied where they can be applied, acknowledged gaps where they cannot, and a boundary architecture
expected to carry more weight because the inner layers have less.

## The perimeter assumption

The most common failure mode is assuming the perimeter holds and treating everything inside it as trusted.
An OT environment with a well-configured IT/OT boundary and no controls inside the OT network is not
implementing defence in depth. It is implementing a single control.

This assumption appears repeatedly in the incident record. [Volt Typhoon](../incidents/volt-typhoon.md) maintained access inside IT
networks adjacent to OT for years without detection, in part because the networks inside the boundary had
minimal monitoring: the assumption was that if the boundary held, the network was safe. [TRITON](../incidents/triton.md) moved
laterally from corporate IT through the DCS network to the safety network over months. The lateral movement
crossed multiple apparent zone boundaries because those boundaries had routed paths between them and no
controls on the traffic passing through.

Depth requires accepting that any given control will fail or be bypassed in some scenario, and designing
the next layer to carry the weight when that happens.

## Related

- [IT/OT boundary](boundary.md) and [zone architecture](zones.md): the network segmentation layer this page sits inside
- [Network monitoring and visibility](monitoring.md): visibility into what happens inside the boundary when perimeter controls are the only layer
- [Volt Typhoon](../incidents/volt-typhoon.md) and [TRITON](../incidents/triton.md): the perimeter-trust failure mode in the incident record
- [IEC 62351](../protocols/iec62351.md): the authentication standard for the protocol layer of the model
- [OT Defence Workbench](../labs/workbench.md): brief-by-brief boundary controls from network block through protocol authentication

