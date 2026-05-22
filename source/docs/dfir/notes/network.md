# Network forensics

Notes on network traffic investigation: capturing live and recorded traffic, building event timelines, and establishing root-cause analysis. The investigation process maps communicated hosts across time, frequency, protocol, application and data.

The 5W framework maps cleanly to network artefacts:

- Who: source IP and port
- What: data and payload
- Where: destination IP and port
- When: timestamp
- Why: the reconstructed sequence of events

## Use cases

- Network discovery: identifying connected devices, rogue hosts and network load
- Packet reassembly: reconstructing traffic flows, most useful in unencrypted traffic
- Data leakage detection: reviewing transfer rates per host and destination address
- Anomaly detection: correlating ports, addresses and data volumes against hypotheses
- Compliance review: confirming network behaviour against policy or regulation

## Considerations

Full-packet captures give the complete picture but are resource-intensive to sustain. NetFlow covers longer windows at the cost of payload detail. Gaps between captures can miss significant portions of an event.

Encrypted traffic constrains what is recoverable. Source, destination and service are usually visible; payload is not. Commands and connections still appear in traffic even when malware runs only in memory, so network evidence can surface non-persistent threats that leave no files on disk.

Traffic capture is legally equivalent to recording everything on the wire. GDPR and sector-specific regulations (HIPAA, PCI DSS, FISMA) apply. Logs are frequently erased by attackers; their absence is itself worth noting.

When correlating across multiple sources, timezone consistency reduces false gaps in event timelines.

## Data types

- Live traffic
- Traffic captures (full packet and NetFlow)
- Log files

## Sources of evidence

Live traffic offers a single collection window. Common evidence sources:

- TAPs and inline devices
- SPAN ports
- Hubs, switches, routers
- DHCP, DNS and authentication servers
- Firewalls and web proxies
- Central log servers
- IDS/IPS, application, OS and device logs
