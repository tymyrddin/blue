# Cross-source correlation

## Why single-source detection fails

BGP attacks manifest across multiple log sources. The attacker announces a hijacked prefix (BMP feed), validators incorrectly endorse it as valid (RPKI validator logs), routers accept and propagate it (router syslog), configuration changes enable the attack (router configuration), and authentication logs show who made those changes (TACACS).

Examining any single source misses the complete picture. BMP logs show an announcement but cannot tell you if validators endorsed it. RPKI validators say "valid" without context about whether the ROA itself is fraudulent. Router logs show configuration changes without explaining who authenticated. TACACS shows logins without showing what happened afterwards.

Cross-source correlation assembles fragments from different log streams into a coherent attack narrative. This is substantially more difficult than single-source detection because each log source has different formats, different timestamps, and different levels of detail. The Department has spent considerable effort making these correlations work, and they remain fragile.

## What the simulator actually outputs

Run playbook 3 and examine the different log types:

```bash
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli
```

Produces three distinct formats in one stream:

```
BMP ROUTE: prefix 203.0.113.128/25 AS_PATH [65001, 64513] NEXT_HOP 198.51.100.254 ORIGIN_AS 64513
<14>Jan 01 00:01:00 edge-router-01 BGP announcement: 203.0.113.128/25 from AS64513, RPKI validation: valid
<30>Jan 01 00:03:00 cloudflare RPKI validation: 203.0.113.128/25 origin AS64513 -> valid
<14>Jan 01 00:03:00 edge-router-01 RPKI validation: 203.0.113.128/25 AS64513 -> valid (cloudflare)
<30>Jan 01 00:03:20 routinator RPKI validation: 203.0.113.128/25 origin AS64513 -> valid
```

In production, these would arrive as separate log streams:
- BMP feed from your BGP monitoring infrastructure
- Router syslog from edge-router-01
- RPKI validator logs from cloudflare, routinator, ripe validators

The simulator combines them for convenience. Real cross-source correlation requires ingesting all three streams and matching events based on prefix, timestamp, and origin AS.

## BMP feed plus RPKI validator plus router logs

The [multi-stage correlation page](multi-stage.md) showed decoders for each log type. Now we correlate events across 
all three sources to catch attacks that single-source detection misses.

### Splitting simulator output by source

To test cross-source correlation properly, split the simulator output:

```bash
# Run simulator
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli > full_output.log

# Extract BMP messages
grep "^BMP ROUTE:" full_output.log > bmp_feed.log

# Extract router syslog
grep "edge-router-01" full_output.log > router_syslog.log

# Extract validator logs
grep -E "(cloudflare|routinator|ripe) RPKI validation:" full_output.log > validator.log
```

Now you have three separate log files simulating three separate sources.

### Ingesting multiple sources into Wazuh

Configure Wazuh to monitor all three:

```xml
<!-- /var/ossec/etc/ossec.conf -->
<ossec_config>
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/simulator/bmp_feed.log</location>
  </localfile>
  
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/simulator/router_syslog.log</location>
  </localfile>
  
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/simulator/validator.log</location>
  </localfile>
</ossec_config>
```

Or send each to a different syslog port:

```bash
cat bmp_feed.log | nc wazuh-server 514 &
cat router_syslog.log | nc wazuh-server 515 &
cat validator.log | nc wazuh-server 516 &
```

The correlation rules do not care how logs arrive, only that decoders extract fields correctly from all three sources.

### Three-source correlation detecting playbook 3 hijack

From the [multi-stage correlation page](multi-stage.md), you have these parent rules:

```xml
<rule id="100700" level="0">
  <decoded_as>bmp-route-details</decoded_as>
  <description>BMP route message</description>
  <group>bmp,bgp,</group>
</rule>

<rule id="100710" level="0">
  <decoded_as>router-bgp-announcement</decoded_as>
  <description>Router BGP announcement</description>
  <group>router,bgp,</group>
</rule>

<rule id="100720" level="0">
  <decoded_as>rpki-validator-result</decoded_as>
  <description>RPKI validation result</description>
  <group>rpki,validator,</group>
</rule>
```

Cross-source correlation rule:

```xml
<!-- Stage 1: BMP shows prefix announcement -->
<rule id="100800" level="4">
  <if_sid>100700</if_sid>
  <description>BMP route announcement observed</description>
  <group>bmp,baseline,</group>
</rule>

<!-- Stage 2: Router logs BGP announcement with RPKI state -->
<rule id="100801" level="6">
  <if_sid>100710</if_sid>
  <if_matched_sid>100800</if_matched_sid>
  <match_prefix />
  <timeframe>120</timeframe>
  <description>Router logged announcement seen in BMP (cross-source correlation)</description>
  <group>router,correlation,</group>
</rule>

<!-- Stage 3: Validators confirm RPKI state -->
<rule id="100802" level="10">
  <if_sid>100720</if_sid>
  <if_matched_sid>100801</if_matched_sid>
  <match_prefix />
  <timeframe>120</timeframe>
  <field name="rpki.state">valid</field>
  <description>Multiple sources confirm RPKI-valid hijack (control-plane attack)</description>
  <group>rpki,attack,correlation,</group>
</rule>
```

The `match_prefix` is not a real Wazuh attribute. You need to match on the prefix field explicitly:

```xml
<!-- Corrected version -->
<rule id="100801" level="6">
  <if_sid>100710</if_sid>
  <if_matched_sid>100800</if_matched_sid>
  <field name="router.prefix">$bmp.prefix</field>
  <timeframe>120</timeframe>
  <description>Router logged announcement seen in BMP</description>
  <group>router,correlation,</group>
</rule>
```

Problem: Wazuh cannot reference field values from previous rules like `$bmp.prefix`. You need a different approach.

### Practical cross-source correlation with Wazuh

Wazuh's correlation is limited. It can detect "rule A fired, then rule B fired" but cannot easily compare field values across rules. For cross-source correlation based on matching fields (prefix, AS number), you have three options:

Option 1: Use static field values

```xml
<!-- Alert on BMP announcement for specific prefix -->
<rule id="100803" level="4">
  <if_sid>100700</if_sid>
  <field name="bmp.prefix">203.0.113.128/25</field>
  <description>BMP announcement for monitored prefix 203.0.113.128/25</description>
  <group>bmp,monitored,</group>
</rule>

<!-- Alert on router announcement for same prefix -->
<rule id="100804" level="6">
  <if_sid>100710</if_sid>
  <if_matched_sid>100803</if_matched_sid>
  <field name="router.prefix">203.0.113.128/25</field>
  <timeframe>120</timeframe>
  <description>Router confirmed BMP announcement for 203.0.113.128/25</description>
  <group>router,correlation,</group>
</rule>

<!-- Alert on validator for same prefix -->
<rule id="100805" level="10">
  <if_sid>100720</if_sid>
  <if_matched_sid>100804</if_matched_sid>
  <field name="rpki.prefix">203.0.113.128/25</field>
  <field name="rpki.state">valid</field>
  <timeframe>120</timeframe>
  <description>Validators confirm RPKI-valid announcement for 203.0.113.128/25 (attack)</description>
  <group>rpki,attack,correlation,</group>
</rule>
```

This works but only for prefixes you hardcode. Not scalable.

Option 2: Use prefix ranges

```xml
<!-- Match any prefix in monitored block -->
<rule id="100806" level="4">
  <if_sid>100700</if_sid>
  <field name="bmp.prefix" type="pcre2">^203\.0\.113\.</field>
  <description>BMP announcement for monitored block 203.0.113.0/24</description>
  <group>bmp,monitored,</group>
</rule>

<rule id="100807" level="6">
  <if_sid>100710</if_sid>
  <if_matched_sid>100806</if_matched_sid>
  <field name="router.prefix" type="pcre2">^203\.0\.113\.</field>
  <timeframe>120</timeframe>
  <description>Router confirmed announcement in monitored block</description>
  <group>router,correlation,</group>
</rule>

<rule id="100808" level="10">
  <if_sid>100720</if_sid>
  <if_matched_sid>100807</if_matched_sid>
  <field name="rpki.prefix" type="pcre2">^203\.0\.113\.</field>
  <field name="rpki.state">valid</field>
  <timeframe>120</timeframe>
  <description>Validators confirm RPKI-valid announcement in monitored block (attack)</description>
  <group>rpki,attack,correlation,</group>
</rule>
```

This triggers for any prefix in 203.0.113.0/24. More flexible but still requires knowing which blocks to monitor.

Option 3: Export to external platform

For dynamic cross-source correlation based on arbitrary field matches, use Splunk, Elastic, or Sentinel. Forward Wazuh alerts to these platforms and write correlation searches there.

Wazuh example forwarding to Splunk:

```xml
<!-- /var/ossec/etc/ossec.conf -->
<syslog_output>
  <server>splunk-server</server>
  <port>514</port>
  <format>json</format>
</syslog_output>
```

Then in Splunk:

```spl
index=wazuh source=wazuh 
| transaction prefix maxspan=2m 
  startswith=(rule.id=100700) 
  endswith=(rule.id=100720)
| where mvcount(rule.id) >= 3
```

This correlates events with the same prefix across sources regardless of which prefix it is. Wazuh cannot do this natively.

## TACACS authentication plus ROA creation

Playbook 2 shows credential use followed by ROA creation:

```
Jan 01 00:01:00 tacacs-server admin@victim-network.net login from 185.220.101.45
<29>Jan 01 00:02:00 ARIN ROA creation request: 203.0.113.0/24 origin AS64513 maxLength /25 by admin@victim-network.net via ARIN
```

Correlating authentication with ROA creation detects compromised accounts used for infrastructure manipulation.

### Decoders for both sources

From the [multi-stage correlation page](multi-stage.md):

```xml
<!-- TACACS authentication -->
<decoder name="tacacs-auth">
  <prematch>tacacs-server</prematch>
</decoder>

<decoder name="tacacs-login">
  <parent>tacacs-auth</parent>
  <regex offset="after_parent">(\S+) login from (\S+)</regex>
  <order>tacacs.user, tacacs.source_ip</order>
</decoder>

<!-- ROA creation -->
<decoder name="roa-creation">
  <prematch>ROA creation request:</prematch>
</decoder>

<decoder name="roa-creation-details">
  <parent>roa-creation</parent>
  <regex offset="after_parent">(\S+) origin AS(\d+) maxLength (/\d+) by (\S+) via (\w+)</regex>
  <order>roa.prefix, roa.origin_as, roa.max_length, roa.actor, roa.registry</order>
</decoder>
```

### Cross-source correlation rule

```xml
<!-- Parent rules -->
<rule id="100810" level="0">
  <decoded_as>tacacs-login</decoded_as>
  <description>TACACS authentication</description>
  <group>authentication,tacacs,</group>
</rule>

<rule id="100820" level="0">
  <decoded_as>roa-creation-details</decoded_as>
  <description>ROA creation request</description>
  <group>roa,rpki,</group>
</rule>

<!-- Detect login -->
<rule id="100811" level="3">
  <if_sid>100810</if_sid>
  <description>TACACS login observed</description>
  <group>authentication,baseline,</group>
</rule>

<!-- Correlate ROA creation by same user -->
<rule id="100821" level="10">
  <if_sid>100820</if_sid>
  <if_matched_sid>100811</if_matched_sid>
  <same_user />
  <timeframe>300</timeframe>
  <description>ROA creation within 5 minutes of authentication (verify authorisation)</description>
  <group>roa,correlation,</group>
</rule>
```

The `same_user` attribute in Wazuh only works if both decoders extract a field named `user`. Check your field names:

- TACACS decoder extracts `tacacs.user`
- ROA decoder extracts `roa.actor`

These do not match, so `same_user` will not work. You need consistent field naming:

```xml
<!-- Revised TACACS decoder using 'user' field -->
<decoder name="tacacs-login">
  <parent>tacacs-auth</parent>
  <regex offset="after_parent">(\S+) login from (\S+)</regex>
  <order>user, tacacs.source_ip</order>
</decoder>

<!-- Revised ROA decoder using 'user' field -->
<decoder name="roa-creation-details">
  <parent>roa-creation</parent>
  <regex offset="after_parent">(\S+) origin AS(\d+) maxLength (/\d+) by (\S+) via (\w+)</regex>
  <order>roa.prefix, roa.origin_as, roa.max_length, user, roa.registry</order>
</decoder>
```

Now `same_user` works because both decoders extract a `user` field.

## Router configuration changes plus BGP announcements

In production (not the simulator), router configuration changes should correlate with BGP session establishments. If sessions appear without configuration changes, someone is manipulating routers without proper access.

The simulator does not currently output router configuration logs, so this example is theoretical:

Router configuration log (example format):
```
<14>Jan 01 00:05:00 edge-router-01 CONFIG_CHANGE: user operator@attacker-as64513.net command "neighbor 198.51.100.1 remote-as 65001"
```

BGP session establishment (from simulator):
```
<14>Jan 01 00:05:30 edge-router-01 BGP session established with 198.51.100.1 AS65001
```

### Decoder for configuration changes

```xml
<decoder name="router-config">
  <prematch>edge-router-01 CONFIG_CHANGE:</prematch>
</decoder>

<decoder name="router-config-bgp">
  <parent>router-config</parent>
  <regex offset="after_parent">user (\S+) command "neighbor (\S+) remote-as (\d+)"</regex>
  <order>user, config.peer_ip, config.peer_as</order>
</decoder>
```

### Correlation rule

```xml
<rule id="100830" level="0">
  <decoded_as>router-config-bgp</decoded_as>
  <description>Router BGP configuration change</description>
  <group>router,configuration,</group>
</rule>

<rule id="100831" level="4">
  <if_sid>100830</if_sid>
  <description>BGP peer configuration changed</description>
  <group>router,bgp,configuration,</group>
</rule>

<!-- Correlate with session establishment -->
<rule id="100832" level="7">
  <if_sid>100710</if_sid>
  <if_matched_sid>100831</if_matched_sid>
  <timeframe>300</timeframe>
  <description>BGP session established following configuration change</description>
  <group>bgp,correlation,</group>
</rule>
```

This is simpler correlation (no field matching) because you are just detecting "config change followed by session establishment" within a time window.

## Field normalisation challenges

The biggest problem with cross-source correlation is that different sources use different field names and formats for the same data.

### Prefix format variations

BMP might output: `203.0.113.128/25`  
Router might output: `203.0.113.128 255.255.255.128`  
RPKI might output: `203.0.113.128/25`

Your decoders need to normalise these into a consistent format. Option 1 is to extract both notations:

```xml
<!-- Decoder handling both formats -->
<decoder name="router-bgp-prefix-cidr">
  <parent>router-bgp</parent>
  <regex offset="after_parent">announcement: (\d+\.\d+\.\d+\.\d+/\d+)</regex>
  <order>router.prefix</order>
</decoder>

<decoder name="router-bgp-prefix-mask">
  <parent>router-bgp</parent>
  <regex offset="after_parent">announcement: (\d+\.\d+\.\d+\.\d+) (\d+\.\d+\.\d+\.\d+)</regex>
  <order>router.prefix_ip, router.prefix_mask</order>
</decoder>
```

Option 2 is to preprocess logs with Logstash before Wazuh ingests them, converting all prefix notations to CIDR.

### AS number format variations

Some logs say `AS64513`, others say `64513`, others say `ASN64513`. Decoders need to handle all formats:

```xml
<!-- Extract AS number with or without AS prefix -->
<regex>origin[_ ]?(?:AS|ASN)?(\d+)</regex>
```

This regex matches `origin AS64513`, `origin_AS64513`, `origin64513`, and `originASN64513`.

### Timestamp normalisation

The simulator outputs consistent timestamps, but production logs do not:

- BMP: `2025-01-01T00:01:00Z` (ISO 8601 UTC)
- Router syslog: `Jan 01 00:01:00` (no year, no timezone)
- RPKI validator: `2025-01-01 00:01:02.345` (local time)

Wazuh's correlation timeframes account for these variations, but you need generous windows (120-300 seconds) to accommodate clock skew and logging delays.

## When cross-source correlation actually works

Cross-source correlation is worth the effort when:

- Attacks span multiple systems: The playbook scenarios demonstrate attacks visible only through multi-source correlation. Single-source detection misses them.
- Log sources are stable: If log formats change frequently, maintaining decoders across sources becomes unsustainable. Stable infrastructure makes correlation feasible.
- Field normalisation is achievable: If you can standardise field names and formats across sources (via preprocessing or careful decoder design), correlation works. If not, expect frequent correlation failures.
- Analyst capacity exists: Cross-source correlation generates more alerts (including false positives). Analysts need time to investigate them.

Cross-source correlation is not worth the effort when:

- Single-source detection suffices: If basic hijacks are your threat model, BMP feed alone detects them. Cross-source correlation adds complexity without value.
- Log sources are unstable: If vendors frequently change log formats, correlation rules break constantly. Maintenance burden exceeds detection value.
- Budget constraints prevent normalisation: Without Logstash or equivalent preprocessing, field normalisation is difficult. Accept that some correlations will fail.

## Testing cross-source correlation with the simulator

Split simulator output and feed to Wazuh separately:

```bash
# Generate logs
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli > full.log

# Split by source
grep "^BMP ROUTE:" full.log > /var/log/wazuh/bmp.log
grep "edge-router-01" full.log > /var/log/wazuh/router.log
grep -E "(cloudflare|routinator|ripe)" full.log > /var/log/wazuh/rpki.log

# Wait for Wazuh to ingest
sleep 10

# Check alerts
grep -E "100805|100808" /var/ossec/logs/alerts/alerts.json
```

Expected alert:

```json
{"rule":{"id":"100808","level":10,"description":"Validators confirm RPKI-valid announcement in monitored block (attack)"}}
```

If alert does not appear:

1. Verify all three decoders extract fields correctly (use `wazuh-logtest` on sample logs from each source)
2. Check field names match across decoders (BMP uses `bmp.prefix`, router uses `router.prefix`, RPKI uses `rpki.prefix`)
3. Ensure correlation timeframes accommodate logging delays (120 seconds minimum)
4. Confirm parent rule IDs are correct

## Next steps

Move on to [Building correlation rules](rules.md) to learn about stateful versus stateless correlation, time window 
tuning, and performance considerations when implementing correlation at scale.

Cross-source correlation is powerful but fragile. It catches sophisticated attacks but requires 
significant infrastructure and maintenance. The Department maintains cross-source correlation for critical 
infrastructure and accepts single-source detection for less important systems. Budget reality means you cannot 
correlate everything with everything. Prioritise what matters.
