# Detecting OT attacks

OT detection operates across three layers that rarely share data: IT security monitoring (SIEM, EDR), OT network monitoring (passive protocol inspection), and process monitoring (historian data and operator alarms). The attacks that are hardest to detect are the ones that stay within the bounds of all three layers simultaneously. Effective detection requires integrating data across the boundary.

## IT/OT boundary crossing detection

The earliest detection opportunity for the dominant attack path (IT to OT lateral movement) is at the IT layer, before the attacker reaches OT at all.

Authentication events on historian servers and OT jump hosts are worth correlating with the user's normal access pattern. An engineer who does not normally access the historian interactively, or who accesses it from an unusual source IP, warrants investigation.

Firewall logs at the IT/OT boundary are worth alerting on for any new source IP attempting to reach OT protocol ports (502, 44818, 102, 4840, 20000, 47808). Legitimate SCADA polling comes from a fixed set of source addresses; any new source is anomalous.

```
Alert: TCP connection to port 502 from any source not in the approved SCADA master list
Alert: Successful authentication to OT jump host from a source outside the engineering VLAN
Alert: New device (MAC address) observed on any OT segment
```

## The historian as pivot point

Historians (OSIsoft PI, AVEVA, Honeywell Uniformance, GE Proficy, and similar) sit at
the IT/OT boundary by design. The IT-facing side serves reporting interfaces, web APIs,
and business intelligence connections. The OT-facing side runs collector processes that
maintain persistent connections into the OT segment: OPC DA or OPC UA clients polling
field devices, DCS interfaces, and SCADA servers. These collector processes run on the
historian server itself and keep active sessions open to OT hosts.

An attacker who obtains access to the historian via its IT-facing interface, whether
through a web vulnerability, a stolen credential, or a compromised workstation with
access to the historian's administrative shares, gains a foothold on a machine with live
connections to the OT segment. No additional lateral movement is needed to reach OT.
The historian provides it.

Monitoring the historian specifically:

- New OPC UA or OPC DA sessions initiated by the historian to OT hosts outside the
  existing collector configuration. Collector configurations are static in steady state;
  new connections are anomalous.
- Changes to the historian's data source configuration (new interfaces added, existing
  interface addresses modified). Most historians log configuration changes; those logs
  are rarely reviewed.
- New processes on the historian server establishing outbound connections to OT segment
  addresses. Collector agents are known, fixed processes; an unexpected process with
  OT-segment connections is a high-confidence indicator.
- DCOM/RPC traffic from the historian to OT segment hosts outside the expected collector
  protocol ports.

The historian is also the only system that can detect protocol-compliant OT manipulation,
because it records what process values were before any modification. An attacker who
sends valid OPC writes directly to a PLC, bypassing the SCADA system entirely, will not
appear in SCADA operator logs. The historian's recorded trajectory for that process
variable will show a discontinuity with no corresponding operator action.

## OT protocol monitoring

Passive OT network monitoring (Claroty, Dragos, Nozomi, or open-source alternatives like Zeek with OT protocol dissectors) builds a baseline of normal communication patterns. Anomaly detection covers:

- New IP address sending commands to a known PLC.
- Function codes that have not previously been observed from a given source.
- Write operations to addresses that are only read by the legitimate SCADA system.
- Commands sent outside the normal polling interval.

These detections are effective against naive attacks but can be evaded by an attacker who has observed the baseline traffic and mimics it. The mitigations for evasion-aware attacks require process-layer correlation.

## Process deviation detection

Integrating historian data with security alerting is the detection layer that covers protocol-compliant manipulation. The key metrics:

- Process variables that change outside their historical variance without a corresponding operator action or change order.
- Setpoint values that differ from the SCADA-reported setpoints (indicating a write that bypassed the SCADA system).
- Process outcomes that deviate from the expected trajectory for the current operating conditions.

This integration requires cooperation between OT security, process engineering, and operations teams. The security monitoring platform needs access to historian data; the process engineers need to define the expected variance bounds; the operations team needs to review anomalies that could be process variation rather than attack.

## Engineering software activity monitoring

Engineering software connections to PLCs are inherently privileged operations. Every connection by TIA Portal or Studio 5000 to a PLC in online mode is worth logging and reviewing. This requires:

- Enabling audit logging in the engineering software where available.
- Configuring the PLC or its managed switch to log successful connections on engineering ports (S7comm port 102, EtherNet/IP port 44818).
- Correlating engineering software connection events with change management records: any connection that is not associated with an approved change order is anomalous.

Most OT environments do not currently log engineering software connections at all. Establishing this logging is a foundational detection improvement that does not require network redesign.

## The integrated detection picture

A mature OT detection programme generates alerts from all three layers and correlates them. A sequence of: new source IP connecting to historian, followed by engineering software connection to a PLC, followed by a process variable moving outside its historical variance, is a high-confidence incident indicator. Any single one of those events might be benign; the sequence is not.

*To put numbers on it: at 14:32, a connection from 10.50.2.45 reaches TCP 44818 on the
historian at 192.168.100.20, a source address that has never appeared in that firewall
segment's logs. At 14:41, a TIA Portal session opens from the same IP to PLC 192.168.1.10
on port 102. At 15:07, the historian records reactor temperature rising 14 degrees above
the approved operating range with no corresponding change order. In isolation, each event
has a plausible explanation. The nine-minute gap between the first network event and the
engineering software connection, and the 26-minute gap between that connection and the
process deviation, describes a coherent sequence that is harder to explain away.*

The time-to-detect for this attack pattern in many organisations is measured in days or weeks, because the three layers are monitored by different teams who do not share data. Closing this gap is the primary defensive improvement available to OT environments, and it requires less capital investment than network redesign.
Last updated: 26 May 2026
