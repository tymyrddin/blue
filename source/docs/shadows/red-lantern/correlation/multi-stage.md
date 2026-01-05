# Multi-stage BGP attack correlation

## What the playbooks actually demonstrate

The Red Lantern simulator includes three playbook scenarios that form a complete control-plane attack chain. These are not simple hijacks. They represent the sort of patient, methodical campaign the Scarlet Semaphore would execute if they had sufficient determination and several weeks of uninterrupted scheming.

**Playbook 1 (easy difficulty):** RPKI reconnaissance and legitimate ROA creation. The attacker establishes themselves as a normal RPKI participant. Nothing overtly malicious happens. This is the equivalent of casing the joint.

**Playbook 2 (medium difficulty):** ROA scope expansion and validation mapping. The attacker creates fraudulent ROAs for victim prefixes, maps which regions enforce RPKI validation, and establishes monitoring. This is where things get interesting.

**Playbook 3 (advanced difficulty):** Prefix hijacking with RPKI validation cover. The attacker executes a sub-prefix hijack that validators endorse as VALID because the RPKI infrastructure was poisoned in phase 2. The attack succeeds not by bypassing security, but by corrupting its foundations.

If you have read the [correlation fundamentals](/docs/shadows/red-lantern/correlation/fundamentals/) page, you understand temporal, spatial, and statistical correlation. This page shows how to implement those concepts with actual Wazuh rules that detect the playbook attack chains.

## Correlating BGP updates with CMDB changes

Control-plane attacks often involve configuration changes that should correspond with change management tickets. When they do not, someone is either being creative or spectacularly disorganised. Both warrant investigation.

### Detecting unauthorised ROA creation (Playbook 1)

In playbook 1, the attacker creates a legitimate ROA for their own prefix at T+300:

```json
{
  "timestamp": "2025-12-28T14:05:00Z",
  "action": "roa_creation_request",
  "prefix": "198.51.100.0/24",
  "origin_as": 64513,
  "registry": "RIPE",
  "actor": "operator@attacker-as64513.net",
  "attack_step": "establish_presence"
}
```

This looks entirely legitimate. The attacker controls AS64513 and the prefix 198.51.100.0/24. The problem is not what they are doing but what comes later. For now, you need a baseline rule that logs ROA creation:

```xml
<!-- Parent rule for RPKI events -->
<rule id="100500" level="0">
  <decoded_as>red-lantern-json</decoded_as>
  <field name="action" type="pcre2">^roa_|^rpki_</field>
  <description>RPKI-related event from simulator</description>
  <group>rpki,</group>
</rule>

<!-- Log ROA creation without alerting -->
<rule id="100501" level="3">
  <if_sid>100500</if_sid>
  <field name="action">roa_creation_request</field>
  <description>ROA creation request observed</description>
  <group>rpki,baseline,</group>
</rule>
```

Level 3 means "log this but do not page anyone." ROA creation is routine. The correlation comes later when you detect ROA creation for prefixes the requester does not control.

### Detecting fraudulent ROA creation (Playbook 2)

In playbook 2 at T+120, things get suspicious:

```json
{
  "timestamp": "2025-12-28T14:02:00Z",
  "action": "fraudulent_roa_request",
  "prefix": "203.0.113.0/24",
  "origin_as": 64513,
  "registry": "ARIN",
  "actor": "admin@victim-network.net",
  "cover_story": "Bulk ROA update, copy-paste error in spreadsheet",
  "attack_step": "roa_poisoning"
}
```

The attacker is creating a ROA for 203.0.113.0/24 which belongs to AS65003, not AS64513. In the simulator, the `fraudulent_roa_request` action explicitly labels this. In production, you need to correlate the requested prefix against your IP address management database.

**Wazuh rule for production (requires IPAM integration):**

```xml
<rule id="100502" level="10">
  <if_sid>100500</if_sid>
  <field name="action">roa_creation_request</field>
  <field name="origin_as" compare="not_equal">allocated_as</field>
  <description>ROA creation request for prefix not allocated to requesting AS</description>
  <group>rpki,attack,</group>
</rule>
```

This requires your decoder to add an `allocated_as` field by querying your IPAM system. If your organisation does not have programmatic IPAM access (budget reality), you cannot automate this detection. Manual review of ROA creation logs becomes necessary.

**Wazuh rule for simulator (using explicit labels):**

```xml
<rule id="100503" level="10">
  <if_sid>100500</if_sid>
  <field name="action">fraudulent_roa_request</field>
  <description>Fraudulent ROA creation detected (simulator)</description>
  <group>rpki,attack,simulator,</group>
</rule>
```

This only works in training because the simulator explicitly labels fraudulent requests. Production logs will not be so helpful.

### Correlating ROA creation with compromised credentials

Playbook 2 includes credential compromise at T+60:

```json
{
  "timestamp": "2025-12-28T14:01:00Z",
  "action": "credential_use",
  "user": "admin@victim-network.net",
  "source_ip": "185.220.101.45",
  "system": "rir_portal",
  "attack_step": "credential_compromise"
}
```

Followed by ROA creation from that compromised account 60 seconds later. Detect by correlating unusual credential use with ROA creation:

```xml
<!-- Detect credential use from unusual location -->
<rule id="100510" level="5">
  <if_sid>100500</if_sid>
  <field name="action">credential_use</field>
  <field name="system">rir_portal</field>
  <description>Credential use on RIR portal</description>
  <group>authentication,</group>
</rule>

<!-- Escalate if followed by ROA creation -->
<rule id="100511" level="12">
  <if_sid>100500</if_sid>
  <if_matched_sid>100510</if_matched_sid>
  <same_user />
  <timeframe>300</timeframe>
  <field name="action">roa_creation_request</field>
  <description>ROA creation following suspicious credential use (possible account compromise)</description>
  <group>rpki,attack,correlation,</group>
</rule>
```

This correlates credential use with ROA creation within 5 minutes from the same user. Level 12 because compromised RIR accounts can poison global routing infrastructure.

**Limitation:** This only works if your RIR logs credential use and your SIEM ingests those logs. Many organisations lack this visibility. The Department monitors RIR portal access via a dedicated feed, which is additional infrastructure you might not have.

## Linking control plane events to data plane impact

The [fundamentals page](/docs/shadows/red-lantern/correlation/fundamentals/) explains control plane (routing decisions) versus data plane (actual traffic). Attacks manifest in both layers. Correlation catches what single-layer detection misses.

### Detecting RPKI validation despite traffic hijack (Playbook 3)

Playbook 3 demonstrates the payoff of RPKI poisoning. At T+60, the attacker announces the hijacked prefix:

```json
{
  "timestamp": "2025-12-28T14:01:00Z",
  "action": "hijack_announcement",
  "prefix": "203.0.113.128/25",
  "as_path": [65001, 64513],
  "origin_as": 64513,
  "rpki_state": "valid",
  "attack_step": "hijack_announcement"
}
```

The `rpki_state` is "valid" because the fraudulent ROA created in playbook 2 endorses this announcement. Validators are being helpful accomplices.

At T+540, the victim observes traffic anomalies:

```json
{
  "timestamp": "2025-12-28T14:09:00Z",
  "action": "victim_traffic_analysis",
  "victim_prefix": "203.0.113.0/24",
  "traffic_volume_drop_pct": 40,
  "source_as_changed_to": 64513,
  "attack_step": "service_maintenance"
}
```

Forty per cent of traffic has vanished. The remaining traffic now arrives via AS64513 instead of the legitimate AS65003. This is a hijack, but control-plane detection (RPKI validation) says everything is fine.

**Wazuh correlation rule:**

```xml
<!-- Baseline: BGP announcement with RPKI validation -->
<rule id="100520" level="3">
  <if_sid>100000</if_sid>
  <field name="action">hijack_announcement</field>
  <field name="rpki_state">valid</field>
  <description>BGP announcement with RPKI validation (baseline)</description>
  <group>bgp,rpki,</group>
</rule>

<!-- Escalate if traffic volume drops significantly -->
<rule id="100521" level="11">
  <if_sid>100000</if_sid>
  <if_matched_sid>100520</if_matched_sid>
  <timeframe>1800</timeframe>
  <field name="action">victim_traffic_analysis</field>
  <field name="traffic_volume_drop_pct" compare="greater">30</field>
  <description>Significant traffic drop following RPKI-valid announcement (possible control-plane attack)</description>
  <group>bgp,rpki,attack,correlation,</group>
</rule>
```

This correlates a valid-looking BGP announcement with traffic disruption within 30 minutes. When validators endorse something and traffic patterns scream otherwise, investigate.

**Practical limitation:** This requires ingesting traffic analysis data (NetFlow, sFlow, or similar) into your SIEM. Many organisations lack this capability. Without traffic visibility, you cannot detect hijacks that validators incorrectly endorse as valid.

### Detecting latency increases during hijack

Playbook 3 at T+480 includes service continuity analysis:

```json
{
  "timestamp": "2025-12-28T14:08:00Z",
  "action": "service_continuity_verified",
  "hijacked_prefix": "203.0.113.128/25",
  "services_functional": true,
  "added_latency_ms": 3,
  "packet_loss_increase": 0.1,
  "attack_step": "service_maintenance"
}
```

The attacker is forwarding traffic to maintain service and avoid detection. But forwarding adds latency. Three milliseconds is subtle but measurable.

**Wazuh rule detecting latency anomalies:**

```xml
<rule id="100522" level="8">
  <if_sid>100000</if_sid>
  <field name="action">service_continuity_verified</field>
  <field name="added_latency_ms" compare="greater">2</field>
  <description>Latency increase detected during BGP announcement (possible traffic redirection)</description>
  <group>bgp,performance,</group>
</rule>
```

Level 8 because latency increases have many causes (network congestion, routing changes, undersea cable damage). This is suspicious but not definitive.

## Detecting reconnaissance before hijack

Playbook 1 is pure reconnaissance. The attacker queries RPKI infrastructure, WHOIS databases, and validators to understand the target's security posture. Detecting reconnaissance provides days of warning before the actual attack.

### RPKI reconnaissance sequence (Playbook 1)

The reconnaissance sequence starts at T+60:

```json
{
  "timestamp": "2025-12-28T14:01:00Z",
  "action": "rpki_query",
  "prefix": "203.0.113.0/24",
  "query_type": "ripe_stat_rpki_validation",
  "attack_step": "reconnaissance"
}
```

Followed by WHOIS at T+70 and validator queries at T+120. Each query is individually routine. The sequence from the same source suggests reconnaissance.

**Wazuh correlation detecting reconnaissance:**

```xml
<!-- Individual queries are low severity -->
<rule id="100530" level="3">
  <if_sid>100500</if_sid>
  <field name="action">rpki_query</field>
  <description>RPKI query observed</description>
  <group>rpki,reconnaissance,</group>
</rule>

<rule id="100531" level="3">
  <if_sid>100500</if_sid>
  <field name="action">whois_query</field>
  <description>WHOIS query observed</description>
  <group>reconnaissance,</group>
</rule>

<rule id="100532" level="3">
  <if_sid>100500</if_sid>
  <field name="action">validator_query</field>
  <description>Validator query observed</description>
  <group>rpki,reconnaissance,</group>
</rule>

<!-- Correlate sequence from same source -->
<rule id="100533" level="8">
  <if_sid>100500</if_sid>
  <if_matched_sid>100530</if_matched_sid>
  <if_matched_sid>100531</if_matched_sid>
  <same_source_ip />
  <timeframe>600</timeframe>
  <description>Coordinated RPKI reconnaissance sequence detected</description>
  <group>rpki,reconnaissance,correlation,</group>
</rule>
```

This correlates RPKI query, WHOIS query, and validator query from the same source within 10 minutes. Each query alone is innocuous. The sequence suggests someone is researching attack targets.

**Limitation:** Wazuh's correlation logic can handle two `if_matched_sid` conditions but gets unwieldy beyond that. For complex multi-event sequences, platforms like Elastic EQL or Chronicle YARA-L are more appropriate. Budget reality meets theoretical perfection.

### Validation enforcement mapping (Playbook 2)

Playbook 2 at T+3000 begins systematic validation testing:

```json
{
  "timestamp": "2025-12-28T14:50:00Z",
  "action": "test_announcement",
  "prefix": "198.51.100.0/24",
  "origin_as": 64514,
  "region": "AMER",
  "expected_rpki_state": "invalid",
  "peer_response": "rejected",
  "attack_step": "validation_mapping"
}
```

The attacker announces a prefix from the wrong AS (deliberately invalid) to different regions, observing which peers reject it. This maps validation enforcement geography.

**Wazuh frequency-based detection:**

```xml
<rule id="100540" level="5">
  <if_sid>100000</if_sid>
  <field name="action">test_announcement</field>
  <field name="expected_rpki_state">invalid</field>
  <description>Test announcement with expected RPKI invalid state</description>
  <group>bgp,rpki,reconnaissance,</group>
</rule>

<rule id="100541" level="10">
  <if_matched_sid>100540</if_matched_sid>
  <same_source_ip />
  <frequency>3</frequency>
  <timeframe>3600</timeframe>
  <description>Repeated invalid test announcements (validation enforcement mapping)</description>
  <group>bgp,rpki,attack,correlation,</group>
</rule>
```

This triggers when the same source makes three or more test announcements within an hour. Legitimate operators do not repeatedly announce invalid routes to test validation. Attackers do.

## Time gaps between attack phases

The playbooks include realistic operational delays:

- Playbook 1 ends with a 7-day waiting period (T+2400)
- Playbook 2 includes a 48-hour stability check (T+4080)
- Playbook 3 executes after preparation is complete

Real attackers exhibit patience. They reconnaissance, establish presence, wait for operational cover, then execute. Your correlation logic must handle state persistence over weeks.

### Long-term correlation with Wazuh

Wazuh's `if_matched_sid` correlation uses `timeframe` in seconds. Correlating events weeks apart exceeds practical memory limits. For long-term correlation, you need to store reconnaissance indicators in a lookup table and query it when attacks occur.

**Approach 1: Use Wazuh CDB lists**

When reconnaissance is detected, write the target prefix to a CDB list:

```xml
<rule id="100550" level="8">
  <if_sid>100533</if_sid>
  <description>RPKI reconnaissance detected, storing target for long-term monitoring</description>
  <group>rpki,reconnaissance,</group>
  <!-- This would trigger an active response script that adds prefix to CDB list -->
</rule>
```

Later, when hijacks occur, check if the prefix was previously reconnoitred:

```xml
<rule id="100551" level="12">
  <if_sid>100000</if_sid>
  <field name="action">hijack_announcement</field>
  <list field="prefix" lookup="match_key">etc/lists/reconnoitred_prefixes</list>
  <description>Hijack of previously reconnoitred prefix (attack chain confirmed)</description>
  <group>bgp,attack,correlation,</group>
</rule>
```

This approach works but requires maintaining CDB lists, which is additional operational overhead.

**Approach 2: Export to external correlation platform**

For organisations with budget, forward reconnaissance alerts to a platform designed for long-term correlation (Splunk, Elastic, Sentinel). Let that platform handle state persistence and query Wazuh when needed.

Budget reality means many organisations cannot do this. Accept that long-term correlation beyond a few hours is difficult with Wazuh alone.

## Testing correlation with the playbooks

Run the playbooks in sequence to validate your correlation rules:

```bash
# Phase 1: Reconnaissance (easy)
python -m simulator.cli simulator/scenarios/easy/playbook1/scenario.yaml --mode training

# Phase 2: Expansion (medium)
python -m simulator.cli simulator/scenarios/medium/playbook2/scenario.yaml --mode training

# Phase 3: Execution (advanced)
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode training
```

Training mode adds `attack_step` fields and `SCENARIO:` annotations. Your correlation rules should trigger:

- When reconnaissance is detected in playbook 1 (rule 100533)
- When fraudulent ROA creation is detected in playbook 2 (rule 100503 or 100511)
- When hijack despite RPKI validation is detected in playbook 3 (rule 100521)

If rules only fire in playbook 3, you have missed opportunities for earlier detection. The entire point of multi-stage attacks is that each stage provides warning if you know what patterns to look for.

### Expected Wazuh alerts

After running all three playbooks, `/var/ossec/logs/alerts/alerts.json` should contain:

```json
{"rule":{"id":"100533","level":8,"description":"Coordinated RPKI reconnaissance sequence detected"}}
{"rule":{"id":"100511","level":12,"description":"ROA creation following suspicious credential use"}}
{"rule":{"id":"100521","level":11,"description":"Significant traffic drop following RPKI-valid announcement"}}
```

If these alerts do not appear, your decoders are not extracting fields correctly, your rules have syntax errors, or your correlation timeframes are too short.

## What correlation cannot do

Correlation detects patterns. It cannot prevent attacks from succeeding. By the time playbook 3 executes, the RPKI infrastructure is already poisoned. Detection in playbook 1 or 2 provides time to investigate and intervene. Detection in playbook 3 tells you the attack succeeded.

Correlation also requires data sources you might not have. Traffic analysis, IPAM integration, RIR portal logs, these are not universally available. The rules above assume capabilities your organisation might lack. Budget reality meets theoretical best practice.

Finally, correlation increases false positives. Legitimate network operations sometimes resemble attack patterns. Testing with the simulator helps tune thresholds, but production will always include ambiguous cases requiring analyst judgement.

## Next steps

Proceed to [Cross-source correlation](cross-source.md) to learn how to correlate events from BGP feeds, RPKI validators, 
router logs, CMDB systems, and authentication logs when you actually have those data sources available.

Remember that sophisticated attacks unfold over weeks, not minutes. Your correlation must handle long time windows, 
accept that perfect detection is impossible, and acknowledge that some patterns are only visible in hindsight. 
The Scarlet Semaphore does not rush. Neither should your correlation logic, though your SIEM's memory constraints 
might force compromises.

