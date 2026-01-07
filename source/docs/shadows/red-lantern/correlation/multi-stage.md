# Multi-stage BGP attack correlation

## What the playbooks actually demonstrate

The Red Lantern simulator includes three playbook scenarios that form a complete control-plane attack chain. These are not simple hijacks. They represent the sort of patient, methodical campaign the Scarlet Semaphore would execute if they had sufficient determination and several weeks of uninterrupted scheming.

Playbook 1 (easy difficulty): RPKI reconnaissance and legitimate ROA creation. The attacker establishes themselves as a normal RPKI participant. Nothing overtly malicious happens. This is the equivalent of casing the joint.

Playbook 2 (medium difficulty): ROA scope expansion and validation mapping. The attacker creates fraudulent ROAs for victim prefixes, maps which regions enforce RPKI validation, and establishes monitoring. This is where things get interesting.

Playbook 3 (advanced difficulty): Prefix hijacking with RPKI validation cover. The attacker executes a sub-prefix hijack that validators endorse as VALID because the RPKI infrastructure was poisoned in phase 2. The attack succeeds not by bypassing security, but by corrupting its foundations.

If you have read the [correlation fundamentals](fundamentals.md) page, you understand temporal, spatial, and statistical correlation. This page shows how to implement those concepts with actual Wazuh rules that detect the playbook attack chains using the real output format from the simulator.

## Understanding the simulator output format

Run playbook 3 in practice mode and you get this output:

```bash
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli
```

Produces:

```
BMP ROUTE: prefix 203.0.113.128/25 AS_PATH [65001, 64513] NEXT_HOP 198.51.100.254 ORIGIN_AS 64513
<14>Jan 01 00:01:00 edge-router-01 BGP announcement: 203.0.113.128/25 from AS64513, RPKI validation: valid
<30>Jan 01 00:03:00 cloudflare RPKI validation: 203.0.113.128/25 origin AS64513 -> valid
<14>Jan 01 00:03:00 edge-router-01 RPKI validation: 203.0.113.128/25 AS64513 -> valid (cloudflare)
<30>Jan 01 00:03:20 routinator RPKI validation: 203.0.113.128/25 origin AS64513 -> valid
<14>Jan 01 00:03:20 edge-router-01 RPKI validation: 203.0.113.128/25 AS64513 -> valid (routinator)
<12>Jan 01 00:07:00 edge-router-01 Traffic forwarding established for 203.0.113.128/25 -> 203.0.113.128 (method: transparent_proxy)
<13>Jan 01 01:32:00 edge-router-01 BGP withdrawal: 203.0.113.128/25 from AS64513
```

Three distinct log formats:

1. BMP ROUTE messages - BGP Monitoring Protocol logs containing prefix announcements
2. Syslog with priority codes - Standard syslog format with facility/severity (the `<14>` bits)
3. RPKI validator logs - Messages from cloudflare, routinator, ripe validators

Your Wazuh decoders need to handle all three formats.

## Decoding BMP route messages

BMP (BGP Monitoring Protocol) provides detailed BGP update information that standard router syslog does not include. This is what actually gives you prefix announcements.

### BMP decoder

```xml
<decoder name="bmp-route">
  <prematch>^BMP ROUTE:</prematch>
</decoder>

<decoder name="bmp-route-details">
  <parent>bmp-route</parent>
  <regex offset="after_parent">prefix (\S+) AS_PATH \[([\d, ]+)\] NEXT_HOP (\S+) ORIGIN_AS (\d+)</regex>
  <order>bmp.prefix, bmp.as_path, bmp.next_hop, bmp.origin_as</order>
</decoder>
```

This extracts:
- `bmp.prefix`: 203.0.113.128/25
- `bmp.as_path`: 65001, 64513
- `bmp.next_hop`: 198.51.100.254
- `bmp.origin_as`: 64513

Test with `wazuh-logtest`:

```bash
echo 'BMP ROUTE: prefix 203.0.113.128/25 AS_PATH [65001, 64513] NEXT_HOP 198.51.100.254 ORIGIN_AS 64513' | /var/ossec/bin/wazuh-logtest
```

Should show all four fields extracted.

## Decoding router syslog

The simulator outputs standard syslog format with priorities:

```
<14>Jan 01 00:01:00 edge-router-01 BGP announcement: 203.0.113.128/25 from AS64513, RPKI validation: valid
```

The `<14>` is syslog priority (facility 1, severity 6). Wazuh's built-in syslog decoder handles this, but you need a custom decoder for the BGP-specific content.

### Router BGP announcement decoder

```xml
<decoder name="router-bgp">
  <prematch>edge-router-01 BGP</prematch>
</decoder>

<decoder name="router-bgp-announcement">
  <parent>router-bgp</parent>
  <regex offset="after_parent">announcement: (\S+) from AS(\d+), RPKI validation: (\w+)</regex>
  <order>router.prefix, router.origin_as, router.rpki_state</order>
</decoder>

<decoder name="router-bgp-withdrawal">
  <parent>router-bgp</parent>
  <regex offset="after_parent">withdrawal: (\S+) from AS(\d+)</regex>
  <order>router.prefix, router.origin_as</order>
</decoder>
```

Test both:

```bash
echo '<14>Jan 01 00:01:00 edge-router-01 BGP announcement: 203.0.113.128/25 from AS64513, RPKI validation: valid' | /var/ossec/bin/wazuh-logtest

echo '<13>Jan 01 01:32:00 edge-router-01 BGP withdrawal: 203.0.113.128/25 from AS64513' | /var/ossec/bin/wazuh-logtest
```

## Decoding RPKI validator logs

The simulator outputs validator logs from cloudflare, routinator, and ripe:

```
<30>Jan 01 00:03:00 cloudflare RPKI validation: 203.0.113.128/25 origin AS64513 -> valid
```

### RPKI validator decoder

```xml
<decoder name="rpki-validator">
  <prematch>RPKI validation:</prematch>
</decoder>

<decoder name="rpki-validator-result">
  <parent>rpki-validator</parent>
  <regex offset="after_parent">(\S+) origin AS(\d+) -> (\w+)</regex>
  <order>rpki.prefix, rpki.origin_as, rpki.state</order>
</decoder>
```

This works for all three validators (cloudflare, routinator, ripe) because they use the same format. The validator name comes from the syslog hostname field.

Test:

```bash
echo '<30>Jan 01 00:03:00 cloudflare RPKI validation: 203.0.113.128/25 origin AS64513 -> valid' | /var/ossec/bin/wazuh-logtest
```

## Correlating hijack across BMP and RPKI validation

Now that decoders work, correlation rules detect the attack sequence from playbook 3.

### Parent rules for each log type

```xml
<!-- BMP events -->
<rule id="100700" level="0">
  <decoded_as>bmp-route-details</decoded_as>
  <description>BMP route message</description>
  <group>bmp,bgp,</group>
</rule>

<!-- Router BGP events -->
<rule id="100710" level="0">
  <decoded_as>router-bgp-announcement</decoded_as>
  <description>Router BGP announcement</description>
  <group>router,bgp,</group>
</rule>

<!-- RPKI validator events -->
<rule id="100720" level="0">
  <decoded_as>rpki-validator-result</decoded_as>
  <description>RPKI validation result</description>
  <group>rpki,validator,</group>
</rule>
```

### Detecting the hijack sequence

Playbook 3 produces this sequence within seconds:

1. BMP ROUTE message shows announcement
2. Router logs BGP announcement with RPKI validation
3. Multiple validators confirm validation state

Correlation rule:

```xml
<!-- Step 1: BMP shows announcement -->
<rule id="100701" level="5">
  <if_sid>100700</if_sid>
  <field name="bmp.prefix" type="pcre2">^203\.0\.113\.</field>
  <description>BMP route announcement for monitored prefix block</description>
  <group>bmp,monitored_prefix,</group>
</rule>

<!-- Step 2: Router logs it with RPKI valid -->
<rule id="100711" level="7">
  <if_sid>100710</if_sid>
  <if_matched_sid>100701</if_matched_sid>
  <timeframe>60</timeframe>
  <field name="router.rpki_state">valid</field>
  <description>Router accepted announcement as RPKI valid</description>
  <group>router,rpki,correlation,</group>
</rule>

<!-- Step 3: Validators confirm (multiple validators agreeing increases confidence) -->
<rule id="100721" level="10">
  <if_sid>100720</if_sid>
  <if_matched_sid>100711</if_matched_sid>
  <timeframe>60</timeframe>
  <field name="rpki.state">valid</field>
  <description>RPKI validators endorse announcement as valid (possible control-plane attack)</description>
  <group>rpki,attack,correlation,</group>
</rule>
```

This triggers when BMP shows announcement, router accepts it as RPKI valid, and validators confirm, all within 60 seconds. Level 10 because this is the signature of playbook 3's control-plane attack.

## Detecting fraudulent ROA creation (Playbook 2)

Playbook 2 produces these logs:

```bash
python -m simulator.cli simulator/scenarios/medium/playbook2/scenario.yaml --mode practice --output cli
```

Key sequence:

```
Jan 01 00:01:00 tacacs-server admin@victim-network.net login from 185.220.101.45
<29>Jan 01 00:02:00 ARIN ROA creation request: 203.0.113.0/24 origin AS64513 maxLength /25 by admin@victim-network.net via ARIN
<10>Jan 01 00:02:00 edge-router-01 ROA creation request for 203.0.113.0/24 (origin AS64513, maxLength /25) - FRAUDULENT
<30>Jan 01 00:40:00 arin ROA published: 203.0.113.0/24 origin AS64513 in arin repository
<30>Jan 01 00:45:00 routinator Validator sync: routinator sees 203.0.113.0/24 as valid
```

### Decoding TACACS authentication

```xml
<decoder name="tacacs-auth">
  <prematch>tacacs-server</prematch>
</decoder>

<decoder name="tacacs-login">
  <parent>tacacs-auth</parent>
  <regex offset="after_parent">(\S+) login from (\S+)</regex>
  <order>tacacs.user, tacacs.source_ip</order>
</decoder>
```

### Decoding ROA creation requests

```xml
<decoder name="roa-creation">
  <prematch>ROA creation request:</prematch>
</decoder>

<decoder name="roa-creation-details">
  <parent>roa-creation</parent>
  <regex offset="after_parent">(\S+) origin AS(\d+) maxLength (/\d+) by (\S+) via (\w+)</regex>
  <order>roa.prefix, roa.origin_as, roa.max_length, roa.actor, roa.registry</order>
</decoder>
```

### Decoding the FRAUDULENT marker

In practice mode, the simulator includes markers like `- FRAUDULENT` to help training. In production, you would not have these. Decode them for simulator testing:

```xml
<decoder name="router-roa-alert">
  <prematch>edge-router-01 ROA creation</prematch>
</decoder>

<decoder name="router-roa-fraudulent">
  <parent>router-roa-alert</parent>
  <regex offset="after_parent">request for (\S+) \(origin AS(\d+), maxLength (/\d+)\) - FRAUDULENT</regex>
  <order>roa.prefix, roa.origin_as, roa.max_length</order>
</decoder>
```

### Correlation rule for fraudulent ROA creation

```xml
<!-- TACACS authentication -->
<rule id="100730" level="0">
  <decoded_as>tacacs-login</decoded_as>
  <description>TACACS authentication</description>
  <group>authentication,tacacs,</group>
</rule>

<!-- ROA creation request -->
<rule id="100740" level="0">
  <decoded_as>roa-creation-details</decoded_as>
  <description>ROA creation request</description>
  <group>roa,rpki,</group>
</rule>

<!-- Fraudulent marker (simulator only) -->
<rule id="100750" level="0">
  <decoded_as>router-roa-fraudulent</decoded_as>
  <description>ROA creation marked fraudulent</description>
  <group>roa,rpki,simulator,</group>
</rule>

<!-- Correlate: login followed by ROA creation -->
<rule id="100741" level="10">
  <if_sid>100740</if_sid>
  <if_matched_sid>100730</if_matched_sid>
  <same_user />
  <timeframe>300</timeframe>
  <description>ROA creation following authentication within 5 minutes</description>
  <group>roa,correlation,</group>
</rule>

<!-- Escalate if marked fraudulent (simulator training) -->
<rule id="100751" level="12">
  <if_sid>100750</if_sid>
  <description>Fraudulent ROA creation detected (simulator)</description>
  <group>roa,rpki,attack,simulator,</group>
</rule>
```

Rule 100741 catches ROA creation following authentication. This is normal behaviour that needs review. Rule 100751 only works in the simulator because production logs lack the FRAUDULENT marker.

## Detecting validation enforcement mapping (Playbook 2)

Playbook 2 systematically tests RPKI validation in different regions:

```
BMP ROUTE: prefix 198.51.100.0/24 AS_PATH [65001, 64514] NEXT_HOP 198.51.100.254 ORIGIN_AS 64514
<13>Jan 01 00:51:00 edge-router-01 Validation test AMER: Announcement 198.51.100.0/24 AS64514 - peer rejected
BMP ROUTE: prefix 198.51.100.0/24 AS_PATH [65001, 64514] NEXT_HOP 198.51.100.254 ORIGIN_AS 64514
<13>Jan 01 00:52:00 edge-router-01 Validation test EMEA: Announcement 198.51.100.0/24 AS64514 - peer accepted
BMP ROUTE: prefix 198.51.100.0/24 AS_PATH [65001, 64514] NEXT_HOP 198.51.100.254 ORIGIN_AS 64514
<13>Jan 01 00:53:00 edge-router-01 Validation test APAC: Announcement 198.51.100.0/24 AS64514 - peer mixed
```

The attacker announces the same prefix with wrong origin to different regions, observing responses. This is reconnaissance.

### Decoder for validation tests

```xml
<decoder name="router-validation-test">
  <prematch>edge-router-01 Validation test</prematch>
</decoder>

<decoder name="router-validation-test-result">
  <parent>router-validation-test</parent>
  <regex offset="after_parent">(\w+): Announcement (\S+) AS(\d+) - peer (\w+)</regex>
  <order>test.region, test.prefix, test.origin_as, test.result</order>
</decoder>
```

### Correlation rule detecting systematic testing

```xml
<!-- Validation test events -->
<rule id="100760" level="0">
  <decoded_as>router-validation-test-result</decoded_as>
  <description>Validation enforcement test</description>
  <group>router,rpki,testing,</group>
</rule>

<!-- Single test is low severity -->
<rule id="100761" level="4">
  <if_sid>100760</if_sid>
  <description>RPKI validation enforcement test observed</description>
  <group>rpki,reconnaissance,</group>
</rule>

<!-- Multiple tests in short time is reconnaissance -->
<rule id="100762" level="9">
  <if_matched_sid>100761</if_matched_sid>
  <frequency>3</frequency>
  <timeframe>600</timeframe>
  <description>Systematic RPKI validation enforcement mapping (reconnaissance)</description>
  <group>rpki,reconnaissance,attack,</group>
</rule>
```

This triggers when three or more validation tests occur within 10 minutes. Level 9 because this is clear reconnaissance preceding attack.

## Testing correlation with actual simulator output

Run each playbook and feed output to Wazuh:

```bash
# Playbook 2 (fraudulent ROA creation)
python -m simulator.cli simulator/scenarios/medium/playbook2/scenario.yaml --mode practice --output cli | nc wazuh-server 514

# Playbook 3 (hijack execution)
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli | nc wazuh-server 514
```

Expected alerts in `/var/ossec/logs/alerts/alerts.json`:

For playbook 2:
```json
{"rule":{"id":"100751","level":12,"description":"Fraudulent ROA creation detected (simulator)"}}
{"rule":{"id":"100762","level":9,"description":"Systematic RPKI validation enforcement mapping (reconnaissance)"}}
```

For playbook 3:
```json
{"rule":{"id":"100721","level":10,"description":"RPKI validators endorse announcement as valid (possible control-plane attack)"}}
```

If alerts do not appear:

1. Check decoders with `wazuh-logtest`
2. Verify rules have correct parent IDs
3. Check correlation timeframes are not too short
4. Ensure syslog priority is not causing decoder mismatches

## What these rules actually detect

These correlation rules catch:

Playbook 1: Nothing, because playbook 1 is legitimate presence establishment. No alerts expected.

Playbook 2: Fraudulent ROA creation (rule 100751) and validation mapping reconnaissance (rule 100762). This provides warning before attack execution.

Playbook 3: Hijack that validators endorse as valid (rule 100721). This catches the attack during execution.

Detecting playbook 2 provides days of warning. Detecting only playbook 3 means the attack already succeeded and you are observing damage.

## Next steps

Proceed to [Cross-source correlation](cross-source.md) to learn how to correlate events from BGP feeds, RPKI validators, 
router logs, CMDB systems, and authentication logs when you actually have those data sources available.

Remember that sophisticated attacks unfold over weeks, not minutes. Your correlation must handle long time windows, 
accept that perfect detection is impossible, and acknowledge that some patterns are only visible in hindsight. 
The Scarlet Semaphore does not rush. Neither should your correlation logic, though your SIEM's memory constraints 
might force compromises.

