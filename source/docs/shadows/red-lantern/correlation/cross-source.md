# Cross-source correlation

## Why single-source detection fails

BGP attacks manifest across multiple systems. The attacker announces a hijacked prefix (BGP feed), validators incorrectly endorse it as valid (RPKI validator), routers accept and propagate it (router logs), configuration changes enable the attack (CMDB), and authentication logs show who made those changes (TACACS, RADIUS, or RIR portal logs).

Examining any single source misses the complete picture. BGP logs show an announcement but cannot tell you if it is authorised. RPKI validators say "valid" without context about whether the ROA itself is fraudulent. Router logs show configuration changes without explaining why. CMDB shows change tickets but cannot verify if they correspond to actual routing events.

Cross-source correlation assembles fragments from different systems into a coherent attack narrative. This is substantially more difficult than single-source detection because each system has different log formats, different field names, different timestamps, and different levels of detail. The Department has spent considerable effort normalising logs from disparate sources, and it remains an ongoing maintenance burden.

## BGP feed plus RPKI validator plus router logs

The playbook scenarios demonstrate attacks that span BGP announcements, RPKI validation, and router behaviour. Correlating these three sources reveals attacks that single-source detection misses.

### Playbook 3 example with three sources

At T+60 in playbook 3, the attacker announces the hijacked prefix:

BGP feed event:
```json
{
  "timestamp": "2025-12-28T14:01:00Z",
  "source": "bgp_feed",
  "action": "hijack_announcement",
  "prefix": "203.0.113.128/25",
  "as_path": [65001, 64513],
  "origin_as": 64513,
  "peer_ip": "198.51.100.1"
}
```

RPKI validator event (same time):

```json
{
  "timestamp": "2025-12-28T14:01:00Z",
  "source": "rpki_validator",
  "action": "rpki_validation_check",
  "prefix": "203.0.113.128/25",
  "origin_as": 64513,
  "validation_result": "valid",
  "validator": "cloudflare"
}
```

Router log event (slightly later):

```
2025-12-28 14:01:15 router01 %BGP-5-ADJCHANGE, neighbour 198.51.100.1 route-refresh received
2025-12-28 14:01:16 router01 %ROUTING-5-UPDATE, prefix 203.0.113.128/25 added via 198.51.100.1
```

Each source independently shows part of the story. BGP feed shows the announcement. RPKI validator endorses it as valid. Router logs show acceptance and propagation. Correlated together, they show a hijack that passed validation.

### Wazuh correlation across three sources

Wazuh needs separate decoders for each source:

```xml
<!-- BGP feed decoder (JSON) -->
<decoder name="bgp-feed-json">
  <prematch>"source": "bgp_feed"</prematch>
  <plugin_decoder>JSON_Decoder</plugin_decoder>
</decoder>

<!-- RPKI validator decoder (JSON) -->
<decoder name="rpki-validator-json">
  <prematch>"source": "rpki_validator"</prematch>
  <plugin_decoder>JSON_Decoder</plugin_decoder>
</decoder>

<!-- Router syslog decoder -->
<decoder name="router-syslog">
  <prematch>%ROUTING-</prematch>
</decoder>

<decoder name="router-routing-update">
  <parent>router-syslog</parent>
  <regex offset="after_parent">(\d+)-UPDATE, prefix (\S+) added via (\S+)</regex>
  <order>router.severity, router.prefix, router.next_hop</order>
</decoder>
```

Parent rules for each source:

```xml
<!-- BGP feed events -->
<rule id="100600" level="0">
  <decoded_as>bgp-feed-json</decoded_as>
  <description>BGP feed event</description>
  <group>bgp,</group>
</rule>

<!-- RPKI validator events -->
<rule id="100610" level="0">
  <decoded_as>rpki-validator-json</decoded_as>
  <description>RPKI validator event</description>
  <group>rpki,</group>
</rule>

<!-- Router events -->
<rule id="100620" level="0">
  <decoded_as>router-routing-update</decoded_as>
  <description>Router routing update</description>
  <group>router,</group>
</rule>
```

Correlation rule detecting hijack across all three sources:

```xml
<!-- Step 1: BGP announcement observed -->
<rule id="100601" level="5">
  <if_sid>100600</if_sid>
  <field name="action">hijack_announcement</field>
  <description>BGP hijack announcement from feed</description>
  <group>bgp,attack,</group>
</rule>

<!-- Step 2: RPKI validator endorses it (incorrectly) -->
<rule id="100611" level="7">
  <if_sid>100610</if_sid>
  <if_matched_sid>100601</if_matched_sid>
  <timeframe>60</timeframe>
  <field name="validation_result">valid</field>
  <description>RPKI validator endorsed hijack as valid</description>
  <group>rpki,attack,correlation,</group>
</rule>

<!-- Step 3: Router accepts and propagates -->
<rule id="100621" level="12">
  <if_sid>100620</if_sid>
  <if_matched_sid>100611</if_matched_sid>
  <timeframe>60</timeframe>
  <description>Hijack propagated by router after RPKI validation (attack chain confirmed)</description>
  <group>bgp,rpki,router,attack,correlation,</group>
</rule>
```

This three-stage correlation triggers only when BGP announcement, RPKI validation, and router propagation all occur for the same prefix within a short timeframe. Level 12 because this represents confirmed attack with multiple corroborating sources.

Limitation: This assumes all three log sources use compatible prefix notation and timing. In practice, BGP feeds might report prefixes in CIDR (203.0.113.128/25), routers might use decimal mask notation (203.0.113.128 255.255.255.128), and RPKI validators might normalise differently. Field normalisation is necessary but Wazuh lacks built-in capabilities for this. You need preprocessing (Logstash, custom scripts) or accept that some correlations will fail due to format mismatches.

## Change management plus routing anomalies

The playbook scenarios demonstrate attacks enabled by unauthorised configuration changes. Correlating CMDB (change management database) with routing events catches changes that lack proper authorisation.

### Playbook 2 credential compromise and ROA creation

At T+60 in playbook 2, compromised credentials are used:

Authentication log (TACACS or RIR portal):
```json
{
  "timestamp": "2025-12-28T14:01:00Z",
  "source": "rir_portal_auth",
  "event_type": "login_success",
  "user": "admin@victim-network.net",
  "source_ip": "185.220.101.45",
  "location": "Unknown",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0)"
}
```

CMDB event (should exist but does not):
```json
{
  "timestamp": "2025-12-28T14:01:00Z",
  "source": "cmdb",
  "event_type": "change_ticket_search",
  "user": "admin@victim-network.net",
  "query": "ROA creation 203.0.113.0/24",
  "results": []
}
```

ROA creation event (T+120):
```json
{
  "timestamp": "2025-12-28T14:02:00Z",
  "source": "rir_portal",
  "action": "roa_creation_request",
  "prefix": "203.0.113.0/24",
  "origin_as": 64513,
  "user": "admin@victim-network.net"
}
```

The sequence is suspicious login, no corresponding change ticket, ROA creation. Each event alone might be innocent. Correlated, they suggest compromised account used for unauthorised infrastructure changes.

### Wazuh correlation with CMDB integration

```xml
<!-- Authentication events -->
<rule id="100630" level="0">
  <decoded_as>rir-portal-auth</decoded_as>
  <description>RIR portal authentication event</description>
  <group>authentication,</group>
</rule>

<!-- CMDB events -->
<rule id="100640" level="0">
  <decoded_as>cmdb-json</decoded_as>
  <description>CMDB event</description>
  <group>cmdb,</group>
</rule>

<!-- Detect login from unusual location -->
<rule id="100631" level="6">
  <if_sid>100630</if_sid>
  <field name="event_type">login_success</field>
  <field name="location">Unknown</field>
  <description>Login from unknown location</description>
  <group>authentication,suspicious,</group>
</rule>

<!-- Check if change ticket exists -->
<rule id="100641" level="3">
  <if_sid>100640</if_sid>
  <field name="event_type">change_ticket_search</field>
  <field name="results">[]</field>
  <description>Change ticket search returned no results</description>
  <group>cmdb,</group>
</rule>

<!-- Correlate ROA creation without ticket after suspicious login -->
<rule id="100602" level="12">
  <if_sid>100600</if_sid>
  <if_matched_sid>100631</if_matched_sid>
  <if_matched_sid>100641</if_matched_sid>
  <same_user />
  <timeframe>300</timeframe>
  <field name="action">roa_creation_request</field>
  <description>ROA creation without change ticket following suspicious login (possible account compromise)</description>
  <group>rpki,attack,correlation,cmdb,</group>
</rule>
```

This requires your CMDB to emit searchable events when someone queries for change tickets. Many CMDB systems lack this capability. If your CMDB cannot proactively report "no ticket found," you need a different approach.

Alternative approach without CMDB integration:

```xml
<!-- Alert on ROA creation, let analysts manually check tickets -->
<rule id="100603" level="8">
  <if_sid>100600</if_sid>
  <field name="action">roa_creation_request</field>
  <description>ROA creation detected, verify change ticket exists</description>
  <group>rpki,manual_verification_required,</group>
</rule>
```

Level 8 generates an alert for manual review. Analysts check the CMDB themselves. Less automated, more labour-intensive, but works when your CMDB lacks API integration. Budget reality meets theoretical best practice.

## TACACS authentication plus BGP session changes

Router configuration changes should correlate with authentication events. If BGP sessions are established or modified without corresponding authentication, someone is manipulating routers without logging in properly, which is worth investigating.

### Detecting BGP session manipulation

TACACS authentication log:
```
2025-12-28 14:01:00 tacacs_server user=operator@attacker-as64513.net device=router01 command=conf t action=permitted
2025-12-28 14:01:05 tacacs_server user=operator@attacker-as64513.net device=router01 command=router bgp 65001 action=permitted
```

Router BGP session establishment (from playbook 3):
```json
{
  "timestamp": "2025-12-28T14:01:30Z",
  "source": "router_bgp",
  "event_type": "bgp_session_established",
  "peer_ip": "198.51.100.1",
  "peer_as": 65001,
  "local_as": 64513
}
```

The TACACS log shows someone entering BGP configuration mode. Thirty seconds later, a new BGP session establishes. This correlation is expected and normal.

Suspicious scenario (no TACACS correlation):

BGP session establishes without preceding TACACS authentication. This suggests either the router was accessed via different credentials (console, SSH key without TACACS, compromised SNMP) or the session was established remotely without local authentication.

### Wazuh correlation detecting unauthorised BGP changes

```xml
<!-- TACACS decoder -->
<decoder name="tacacs-syslog">
  <prematch>tacacs_server</prematch>
</decoder>

<decoder name="tacacs-command">
  <parent>tacacs-syslog</parent>
  <regex offset="after_parent">user=(\S+) device=(\S+) command=(.*) action=(\w+)</regex>
  <order>tacacs.user, tacacs.device, tacacs.command, tacacs.action</order>
</decoder>

<!-- TACACS events -->
<rule id="100650" level="0">
  <decoded_as>tacacs-command</decoded_as>
  <description>TACACS command execution</description>
  <group>authentication,tacacs,</group>
</rule>

<!-- BGP configuration commands -->
<rule id="100651" level="3">
  <if_sid>100650</if_sid>
  <field name="tacacs.command" type="pcre2">router bgp|neighbor</field>
  <description>BGP configuration command executed</description>
  <group>tacacs,bgp,configuration,</group>
</rule>

<!-- BGP session establishment -->
<rule id="100660" level="5">
  <decoded_as>router-bgp-json</decoded_as>
  <field name="event_type">bgp_session_established</field>
  <description>BGP session established</description>
  <group>bgp,router,</group>
</rule>

<!-- Correlation: session without preceding authentication -->
<rule id="100661" level="10">
  <if_sid>100660</if_sid>
  <if_matched_sid>100651</if_matched_sid>
  <same_device />
  <timeframe>300</timeframe>
  <match_absence>true</match_absence>
  <description>BGP session established without TACACS authentication (possible unauthorised access)</description>
  <group>bgp,authentication,attack,correlation,</group>
</rule>
```

The `match_absence` attribute detects when expected correlation is missing. If a BGP session establishes but TACACS did not log corresponding BGP configuration commands within 5 minutes, alert.

Limitation: This assumes TACACS logs are complete and that all router access goes through TACACS. Many environments have gaps (emergency console access, SNMP, legacy accounts). False positives are likely. Tune by whitelisting known exceptions (maintenance windows, monitoring systems, automated backup scripts).

## Timestamp synchronisation challenges

Cross-source correlation requires timestamp alignment. If your BGP feed uses UTC, your RPKI validator uses local time, and your router logs use whatever the router feels like, correlation breaks.

### Playbook timing precision

The simulator uses consistent timestamps across all events because it is a simulator and can cheat. Production logs are messier:

- BGP feed timestamp: `2025-12-28T14:01:00Z` (ISO 8601 UTC)
- RPKI validator timestamp: `2025-12-28 14:01:02.345` (local time, microseconds)
- Router syslog timestamp: `Dec 28 14:01:05` (no year, no timezone, no seconds precision)

Wazuh must normalise these into comparable formats. Some decoders extract timestamps. Others let Wazuh assign receive time. Correlation timeframes must account for clock skew.

Practical approach:

Use generous timeframes (60-300 seconds) to accommodate timestamp drift. This increases false positives (unrelated events correlate by coincidence) but reduces false negatives (related events fail to correlate due to timing mismatch). Tighter timeframes require better timestamp synchronisation across your infrastructure, which is an NTP problem more than a SIEM problem.

## Field name normalisation

Different sources use different field names for the same concept:

- BGP feed: `origin_as`, `prefix`, `as_path`
- RPKI validator: `origin_asn`, `prefix`, `path`  
- Router logs: `origin`, `network`, `route`

Wazuh correlation requires exact field name matches. Without normalisation, rules looking for `origin_as` will not match logs using `origin_asn`.

Solutions:

1. Preprocessing with Logstash: Normalise field names before logs reach Wazuh
2. Wazuh decoder aliasing: Extract fields under consistent names regardless of source
3. Accept imperfect correlation: Some events will not correlate due to field name mismatches

The Department uses Logstash preprocessing for critical sources and accepts imperfect correlation for less important ones. Perfect normalisation across all sources is theoretically possible but practically expensive in terms of configuration maintenance.

## When cross-source correlation is worth the effort

Cross-source correlation is complex and fragile. It breaks when log sources change format, when timestamps drift, when field names vary. It requires maintaining decoders for multiple sources, normalising fields, tuning timeframes, and accepting false positives.

Worth the effort when:
- Detecting sophisticated attacks that span multiple systems (playbook scenarios)
- Regulatory requirements mandate correlation (PCI-DSS, NIS2)
- Budget exists for log aggregation and normalisation infrastructure

Not worth the effort when:
- Single-source detection catches most attacks adequately
- Log sources are unstable or frequently change format
- Analyst capacity cannot handle additional alert volume from correlation false positives

The playbook scenarios represent sophisticated control-plane attacks that require cross-source correlation to detect. Simpler attacks (basic hijacks, session disruptions) are detectable from BGP feeds alone. Prioritise based on your threat model and available resources.

## Testing cross-source correlation

The simulator outputs events that look like they come from different sources but actually come from one process. To test real cross-source correlation, you need to split simulator output into separate streams:

```bash
# Run playbook and split by source
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --output json --json-file output.json

# Extract BGP feed events
jq 'select(.source == "bgp_feed")' output.json > bgp_feed.json

# Extract RPKI events
jq 'select(.source == "rpki_validator")' output.json > rpki_validator.json

# Extract router events (if present)
jq 'select(.source == "router_bgp")' output.json > router_bgp.json

# Send to different ports or files
cat bgp_feed.json | nc wazuh-server 514
cat rpki_validator.json | nc wazuh-server 515
cat router_bgp.json | nc wazuh-server 516
```

Configure Wazuh to listen on multiple ports or monitor multiple files. Your correlation rules should trigger when events from all sources arrive within correlation timeframes.

If correlation fails, check:
1. Are all decoders extracting fields correctly? (use `wazuh-logtest`)
2. Are field names consistent across sources? (check decoder output)
3. Are timestamps comparable? (check for timezone mismatches)
4. Are correlation timeframes appropriate? (60 seconds might be too short)

## Next steps

Move on to [Building correlation rules](rules.md) to learn about stateful versus stateless correlation, time window 
tuning, and performance considerations when implementing correlation at scale.

Cross-source correlation is powerful but fragile. It catches sophisticated attacks but requires 
significant infrastructure and maintenance. The Department maintains cross-source correlation for critical 
infrastructure and accepts single-source detection for less important systems. Budget reality means you cannot 
correlate everything with everything. Prioritise what matters.
