# Generic detection patterns

Before diving into platform-specific syntax, it helps to think about detection patterns independently of 
implementation. The Scarlet Semaphore does not care what SIEM you use, and neither should your detection logic.

## Pattern 1: Anomalous BGP announcements

What we are detecting: A prefix announcement that does not match expected routing behaviour.

Attack indicators:

- AS path contains unexpected ASNs
- Prefix announced is more specific than normal
- Source ASN has no historical relationship with prefix
- Announcement happens outside normal change windows

Generic detection logic:

```
IF bgp_announcement
  AND prefix_origin_asn NOT IN known_origin_asns_for_prefix
  AND prefix_length > historical_max_prefix_length
THEN ALERT: Suspicious BGP announcement
```

Why this works: Most BGP hijacks involve announcing a prefix you do not own, or announcing it more specifically than the legitimate owner. This pattern catches both.

Limitations: 

- Requires baseline of "known good" routing
- May false positive during legitimate network changes
- Does not catch same-AS hijacks or more subtle manipulation

## Pattern 2: BGP session manipulation

What we are detecting: Suspicious changes to BGP sessions or peers.

Attack indicators:

- New BGP peer added without corresponding change ticket
- BGP session established from unusual source IP
- Session authentication disabled or weakened
- Peer configuration changed outside maintenance windows

Generic detection logic:

```
IF bgp_session_event
  AND event_type IN ['peer_added', 'auth_changed', 'session_established']
  AND NOT exists_change_ticket(event_timestamp, event_details)
THEN ALERT: Unauthorised BGP session change
```

Why this works: Control plane attacks often require establishing rogue BGP sessions or modifying existing ones. Correlating with change management catches unauthorised modifications.

Limitations:

- Requires integration with change management system
- Emergency changes may trigger false positives
- Does not detect compromised legitimate sessions

## Pattern 3: RPKI validation failures

What we are detecting: BGP announcements that fail RPKI origin validation.

Attack indicators:

- Route origin validation state is "invalid"
- Previously valid route becomes invalid
- Multiple RPKI invalids from same source
- RPKI invalid combined with other anomalies

Generic detection logic:

```
IF rpki_validation_result = 'invalid'
  AND announcement_is_for_critical_prefix
THEN ALERT: RPKI validation failure for critical infrastructure
```

Why this works: RPKI is specifically designed to prevent prefix hijacks. When it says "invalid," it usually means something is wrong.

Limitations:

- Requires RPKI infrastructure
- Misconfigurations can cause false positives
- Not all networks implement RPKI
- "Not found" is different from "invalid" but both need attention

## Pattern 4: Sequence detection (multi-stage attacks)

What we are detecting: A series of events that together indicate an attack chain.

Attack indicators:

- Reconnaissance (route queries, traceroutes) followed by hijack
- BGP session changes followed by suspicious announcements
- CMDB changes followed by routing anomalies
- Failed authentication attempts followed by successful session establishment

Generic detection logic:

```
IF event_sequence_within_timewindow(
    event1: reconnaissance_activity,
    event2: bgp_announcement_from_same_source,
    window: 3600 seconds
)
THEN ALERT: Potential BGP hijack with prior reconnaissance
```

Why this works: Attackers rarely succeed in one step. Detecting the sequence gives earlier warning and higher confidence.

Limitations:

- Requires correlation capability
- Time windows are hard to tune
- Legitimate activity can create false sequences
- Performance intensive
