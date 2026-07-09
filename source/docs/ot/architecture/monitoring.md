# Network monitoring and visibility

An OT environment where events are not recorded has no forensic baseline. [Volt Typhoon](../incidents/volt-typhoon.md)'s activity left
minimal forensic trace in OT-adjacent networks in part because process creation auditing was not enabled:
the logs that would have captured lateral movement commands were never written. Visibility in OT starts
with understanding what is present on the network, followed by what it is doing, and is constrained
throughout by the sensitivity of many OT devices to active interrogation.

## Passive monitoring

Active network scanning is the standard discovery technique in IT security. In OT it carries real risk:
a scan packet reaching a PLC or RTU that does not handle unexpected traffic gracefully can interrupt
control execution. Many OT devices have been observed to reset or drop sessions on receiving a port scan
from an unknown host.

Passive monitoring collects traffic from a network tap or span port without generating any packets of its
own. On a passive sensor, the monitoring system sees every frame that crosses the monitored segment; no
device knows it is being observed. This is the baseline technique for OT network visibility precisely
because it generates no traffic of its own.

Commercial OT monitoring platforms, including Dragos, Claroty, Nozomi Networks, and Forescout OT, operate
passively by default. They decode OT protocol traffic and extract process variable reads, writes,
configuration changes, and authentication events from the packet stream, producing a record of what the
network carried without touching any of the devices on it.

## Asset inventory

Many OT environments do not have a current asset inventory. Equipment is added during expansions and
modifications; retirements are sometimes incomplete; vendor-installed devices appear on the network without
being formally registered. The first output of passive monitoring on a new segment is frequently a
surprise: devices the operator did not know were present, running protocols the team had not identified.

Passive discovery builds an inventory from the traffic itself. A device that communicates appears in the
inventory; its protocol, firmware version where the protocol carries it, and communication partners are
derived from observation. The inventory degrades over time if not maintained; devices that stop
communicating disappear from the observed traffic without any record of their absence.

A physical walkdown against the passively-built inventory is the validation step. Assets present
physically but absent from the network inventory are powered off, isolated, or not yet communicating.
Assets appearing in traffic but absent from the physical inventory warrant investigation.

## Protocol-level visibility

OT protocol traffic carries information that generic network monitoring does not surface. A [Modbus](../protocols/modbus.md) write
to a specific register address, an [IEC 104](../protocols/iec60870-5-104.md) C_SC_NA_1 command to a specific information object, an [OPC UA](../protocols/opcua.md)
write to a named process variable: these are events with specific process meaning. A generic flow monitor
sees a TCP session on port 502; an OT-protocol-aware monitor sees a setpoint change on a specific output.

Protocol-level visibility makes the detection of anomalous commands possible: a write function code from
an unexpected source address, a trip command outside a known maintenance window, a new device appearing
in [GOOSE](../protocols/iec61850.md) multicast traffic. These are the signals that network-layer monitoring alone cannot generate, and
they are the class of signal that would have detected the [FrostyGoop](../incidents/frostygoop.md) Modbus writes and the [Sandworm](../incidents/ukraine-grid.md) IEC
104 sessions that preceded the Ukrainian grid events.

## Log collection

OT devices vary considerably in what they log and whether they expose logs externally. Modern PLCs and
RTUs commonly support syslog forwarding. Older devices may have local event logs accessible only through
their engineering software, or no logging capability at all. Engineering workstations running Windows
generate event logs including process creation, logon events, and file access; these are collectable and
carry significant detection value.

The DMZ staging pattern from the [IT/OT boundary](boundary.md) page applies to log collection: log
collectors in the DMZ receive forwarded events from OT systems; the SIEM consumes from the DMZ collectors
rather than polling OT systems directly. This avoids creating inbound connections from the IT network into
OT and keeps the collection architecture consistent with the boundary design.

Windows Event ID 4688 logs process creation with command-line arguments when process auditing is enabled,
a setting that is off by default. Volt Typhoon operated primarily through Windows built-in utilities; in
environments where 4688 was not enabled, there was no record of what commands ran, with what arguments, or
in response to what. Process auditing on OT-adjacent Windows systems is among the lower-cost improvements
available; its absence was a recurring finding in the affected environments.

## The detection baseline

Detection requires a baseline: a defined picture of normal that makes anomalous events visible. An OT
network where no baseline has been established cannot reliably distinguish a Sandworm IEC 104 session from
a legitimate control session, because both look like a TCP connection on port 2404 completing the STARTDT
handshake.

Building the baseline takes time. A passive monitor on a new segment commonly spends weeks learning which
devices communicate with which, on which protocols, at what cadence, carrying what types of commands.
Alerts generated against an immature baseline produce false positives that erode operator trust in the
monitoring system. The baseline is also a living document: process changes, equipment additions, and
seasonal operational patterns all affect what normal looks like.

The [workbench](../labs/workbench.md)'s HELD/OPEN verdict records whether a control blocked the probe. It does not record what
was logged or what an analyst would have seen. Monitoring and prevention are complementary; the workbench
covers one side of that boundary.

## Related

- [IT/OT boundary](boundary.md): the DMZ staging pattern for log collection discussed in the log collection section
- [Volt Typhoon](../incidents/volt-typhoon.md): the Windows Event 4688 gap and its consequences
- [FrostyGoop](../incidents/frostygoop.md): Modbus writes that protocol-aware monitoring could have surfaced
- [Ukraine grid incidents](../incidents/ukraine-grid.md): the IEC 104 sessions a baselining monitor might have flagged
- [OT Defence Workbench](../labs/workbench.md): prevention-side complement to this page's detection focus
Last updated: 20 May 2026
