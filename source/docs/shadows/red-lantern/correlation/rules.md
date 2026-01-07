# Building correlation rules

## Time windows and event ordering

Correlation rules detect sequences of events within time constraints. The attacker announces a prefix at T+60, validators endorse it at T+180, traffic is hijacked at T+300. Your correlation window must be wide enough to capture all three events but narrow enough to avoid correlating unrelated activity.

The playbook scenarios provide ground truth for tuning time windows. You know exactly when events occur, so you can measure whether your correlation windows catch them.

### Playbook 3 event timing

Run playbook 3 and examine timestamps:

```bash
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli
```

Key events:

```
00:01:00 - BMP ROUTE announcement
00:01:00 - Router logs BGP announcement
00:03:00 - Cloudflare validator confirms
00:03:00 - Router logs RPKI validation (cloudflare)
00:03:20 - Routinator validator confirms
00:03:20 - Router logs RPKI validation (routinator)
```

The sequence spans 140 seconds (2 minutes 20 seconds). Your correlation timeframe needs to be at least 150 seconds to catch all events. Round up to 180 seconds (3 minutes) to account for logging delays and clock skew.

### Correlation rule with appropriate timeframe

```xml
<!-- Stage 1: BMP announcement -->
<rule id="100900" level="4">
  <if_sid>100700</if_sid>
  <field name="bmp.prefix" type="pcre2">^203\.0\.113\.</field>
  <description>BMP announcement for monitored prefix block</description>
  <group>bmp,monitored,</group>
</rule>

<!-- Stage 2: Router confirmation (180 second window) -->
<rule id="100901" level="6">
  <if_sid>100710</if_sid>
  <if_matched_sid>100900</if_matched_sid>
  <field name="router.prefix" type="pcre2">^203\.0\.113\.</field>
  <timeframe>180</timeframe>
  <description>Router confirmed BMP announcement within 3 minutes</description>
  <group>router,correlation,</group>
</rule>

<!-- Stage 3: Validator endorsement (180 second window from stage 2) -->
<rule id="100902" level="10">
  <if_sid>100720</if_sid>
  <if_matched_sid>100901</if_matched_sid>
  <field name="rpki.prefix" type="pcre2">^203\.0\.113\.</field>
  <field name="rpki.state">valid</field>
  <timeframe>180</timeframe>
  <description>Validators endorsed hijack as valid (control-plane attack detected)</description>
  <group>rpki,attack,correlation,</group>
</rule>
```

The timeframe is measured from when the parent rule last fired. Rule 100901 triggers if router logs appear within 180 seconds of the BMP announcement. Rule 100902 triggers if validator logs appear within 180 seconds of rule 100901 firing.

Total correlation window: up to 360 seconds (6 minutes) from initial BMP announcement to final validator confirmation.

### Testing timeframe adequacy

Run the simulator and check alert timestamps:

```bash
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli | nc wazuh-server 514

# Wait for processing
sleep 10

# Check when alerts fired
grep -E "100900|100901|100902" /var/ossec/logs/alerts/alerts.json | jq '.timestamp, .rule.id'
```

Expected output:

```json
"2025-01-01T00:01:00Z"
"100900"
"2025-01-01T00:01:00Z"
"100901"
"2025-01-01T00:03:20Z"
"100902"
```

If rule 100902 does not fire, your timeframe is too short. If it fires for unrelated events hours later, your timeframe is too long.

### Timeframe tuning guidelines

For fast attack sequences (seconds to minutes):
- Simulator easy scenarios: 60-120 second windows
- Simulator medium scenarios: 180-300 second windows
- Simulator advanced scenarios: 300-600 second windows

For slow attack sequences (hours to days):
- Playbook 1 reconnaissance: events span hours, timeframes of 3600-7200 seconds (1-2 hours)
- Playbook 2 ROA publication: events span 40+ minutes, timeframes of 3600 seconds
- Long-term correlation (reconnaissance to exploitation): requires external storage, Wazuh timeframes are impractical

Production adjustments:
- Add 30-60 seconds to simulator timeframes to account for logging delays
- Add 60-120 seconds if log sources have clock skew
- Increase timeframes if correlation frequently fails to trigger
- Decrease timeframes if false positives increase due to coincidental correlation

### Visualising correlation windows

Run playbook 3 in training mode to see timing annotations:

```bash
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode training --output cli
```

Training mode adds `SCENARIO:` markers:

```
SCENARIO: T+0 - Phase 2 recap complete
SCENARIO: T+60 - Hijack announcement initiated
SCENARIO: T+180 - RPKI validation checks begin
SCENARIO: T+300 - Traffic interception confirmed
```

These markers show when attack stages occur. Your correlation windows should span the relevant stages. If your window is 180 seconds but the attack spans 300 seconds, correlation fails.

## Stateful versus stateless correlation

Correlation can be stateful (remembers previous events) or stateless (matches patterns in single events).

### Stateless correlation

Stateless rules match patterns within individual log lines. No memory required:

```xml
<!-- Stateless: single log shows RPKI validation failure -->
<rule id="100910" level="8">
  <if_sid>100720</if_sid>
  <field name="rpki.state">invalid</field>
  <description>RPKI validation failure detected</description>
  <group>rpki,</group>
</rule>
```

This triggers when a single RPKI validator log shows "invalid". No correlation with other events. Simple, fast, no memory overhead.

When to use stateless:
- Single-source detection
- Clear attack indicators in individual logs
- High-volume environments where stateful correlation is expensive

### Stateful correlation

Stateful rules remember previous events and trigger when sequences occur:

```xml
<!-- Stateful: BMP announcement followed by router confirmation -->
<rule id="100920" level="4">
  <if_sid>100700</if_sid>
  <description>BMP announcement observed</description>
  <group>bmp,</group>
</rule>

<rule id="100921" level="7">
  <if_sid>100710</if_sid>
  <if_matched_sid>100920</if_matched_sid>
  <timeframe>180</timeframe>
  <description>Router confirmed BMP announcement (stateful correlation)</description>
  <group>router,correlation,</group>
</rule>
```

Rule 100921 only fires if rule 100920 fired previously. Wazuh stores the fact that 100920 triggered and checks each router log to see if it correlates. Memory and CPU intensive.

When to use stateful:
- Multi-stage attacks (playbook scenarios)
- Cross-source correlation
- Attack chains spanning multiple events

### Memory implications of stateful correlation

Wazuh stores matched events in memory until the timeframe expires. A 180-second timeframe means storing up to 180 seconds of matching events.

On a busy network with 10 BMP announcements per second, rule 100920 fires 1800 times in 180 seconds. Wazuh stores all 1800 matches in case rule 100921 needs to correlate against them. This consumes memory proportional to event rate times timeframe.

Memory usage formula:

```
Memory ≈ (parent rule trigger rate) × (timeframe seconds) × (event size)
```

For 10 events/second, 180-second timeframe, 1KB event size:

```
Memory ≈ 10 × 180 × 1024 = 1.8 MB
```

This seems manageable until you have 50 stateful correlation rules active simultaneously. Then you are using 90 MB just for correlation state. On a system processing hundreds of thousands of events per day, this adds up.

Mitigation strategies:
1. Use stateless correlation where possible
2. Keep timeframes as short as feasible
3. Limit the number of active stateful rules
4. Increase Wazuh's memory allocation if correlation is critical
5. Use more specific parent rules to reduce trigger rates

### Testing stateful correlation memory impact

Monitor Wazuh memory usage whilst running scenarios:

```bash
# Start monitoring
watch -n 1 'ps aux | grep wazuh-analysisd | grep -v grep'

# In another terminal, run simulator with background noise
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --background --bgp-noise-rate 5.0 --output cli | nc wazuh-server 514
```

The `--background --bgp-noise-rate 5.0` generates 5 BGP updates per second in addition to the attack. Watch memory usage of the `wazuh-analysisd` process. If it increases significantly during correlation rule processing, your stateful rules are expensive.

## Performance considerations

Correlation rules have CPU and memory costs. Complex correlation slows down Wazuh's ability to process logs, potentially causing event backlogs and delayed detection.

### Measuring rule performance

Wazuh provides rule statistics:

```bash
/var/ossec/bin/wazuh-analysisd -t
```

This shows per-rule statistics including total times fired and time spent processing. After running scenarios, check which correlation rules consume the most resources.

Example output:

```
Rule id: 100900, times: 150, time: 0.025s
Rule id: 100901, times: 120, time: 0.148s
Rule id: 100902, times: 45, time: 0.086s
```

Rule 100901 fired 120 times and spent 0.148 seconds total processing. That is roughly 1.2ms per event, which is acceptable. If a rule takes 10-20ms per event, it becomes a bottleneck.

### Performance-intensive correlation patterns

Multiple if_matched_sid conditions:

```xml
<rule id="100930" level="12">
  <if_sid>100720</if_sid>
  <if_matched_sid>100920</if_matched_sid>
  <if_matched_sid>100921</if_matched_sid>
  <timeframe>300</timeframe>
  <description>Complex correlation requiring three previous rules</description>
  <group>correlation,</group>
</rule>
```

This requires Wazuh to check if rules 100920 AND 100921 both fired within 300 seconds. For each triggering event, Wazuh searches through stored correlation state for both parent rules. Expensive.

Long timeframes:

```xml
<rule id="100940" level="10">
  <if_sid>100720</if_sid>
  <if_matched_sid>100920</if_matched_sid>
  <timeframe>3600</timeframe>
  <description>Correlation over 1 hour window</description>
  <group>correlation,</group>
</rule>
```

One-hour timeframes mean storing one hour of matching events. Memory usage and search time increase linearly with timeframe length.

High-frequency parent rules:

```xml
<rule id="100950" level="0">
  <if_sid>100700</if_sid>
  <description>Every BMP announcement</description>
  <group>bmp,</group>
</rule>

<rule id="100951" level="8">
  <if_sid>100710</if_sid>
  <if_matched_sid>100950</if_matched_sid>
  <timeframe>180</timeframe>
  <description>Correlate every router announcement with every BMP announcement</description>
  <group>correlation,</group>
</rule>
```

If BMP announcements occur frequently, rule 100950 fires frequently, storing many events. Rule 100951 must search through all stored BMP events for each router log. On busy networks, this becomes computationally expensive.

### Optimising correlation performance

Strategy 1: Use more specific parent rules

Instead of correlating every BMP announcement:

```xml
<!-- Bad: triggers on every BMP announcement -->
<rule id="100960" level="0">
  <if_sid>100700</if_sid>
  <description>BMP announcement</description>
</rule>
```

Narrow to monitored prefixes only:

```xml
<!-- Good: triggers only for monitored prefixes -->
<rule id="100961" level="0">
  <if_sid>100700</if_sid>
  <field name="bmp.prefix" type="pcre2">^203\.0\.113\.</field>
  <description>BMP announcement for monitored prefix</description>
</rule>
```

This reduces trigger rate by potentially 90% or more, dramatically reducing correlation overhead.

Strategy 2: Cascade correlations instead of parallel

Instead of correlating many rules simultaneously:

```xml
<!-- Expensive: correlate A, B, C, D all at once -->
<rule id="100970" level="12">
  <if_sid>100720</if_sid>
  <if_matched_sid>100901</if_matched_sid>
  <if_matched_sid>100902</if_matched_sid>
  <if_matched_sid>100903</if_matched_sid>
  <timeframe>300</timeframe>
  <description>Complex correlation</description>
</rule>
```

Build sequentially:

```xml
<!-- Cheaper: correlate A+B, then result+C, then result+D -->
<rule id="100971" level="5">
  <if_sid>100720</if_sid>
  <if_matched_sid>100901</if_matched_sid>
  <timeframe>180</timeframe>
  <description>Stage 1 correlation</description>
</rule>

<rule id="100972" level="8">
  <if_sid>100720</if_sid>
  <if_matched_sid>100971</if_matched_sid>
  <timeframe>180</timeframe>
  <description>Stage 2 correlation</description>
</rule>
```

Sequential correlation is easier for Wazuh to process because each stage filters events, reducing the search space for subsequent stages.

Strategy 3: Shorten timeframes where possible

Use the minimum timeframe that catches your attack:

```xml
<!-- Tighter timeframe reduces memory and search overhead -->
<rule id="100980" level="8">
  <if_sid>100710</if_sid>
  <if_matched_sid>100900</if_matched_sid>
  <timeframe>60</timeframe>
  <description>Correlation with 60-second window</description>
</rule>
```

Test with the simulator to determine the minimum viable timeframe, then add 20-30% margin for production variability.

Strategy 4: Limit active correlation rules

If you have 100 correlation rules active simultaneously, Wazuh spends most of its time managing correlation state instead of processing new events. Prioritise:

1. Correlation rules detecting critical threats (playbook scenarios)
2. Correlation rules with low false positive rates
3. Correlation rules that actually trigger in your environment

Disable or remove correlation rules that never fire or that generate mostly false positives. The Department maintains approximately 20-30 active correlation rules. More than 50 becomes unwieldy.

## Testing correlation rule performance

Run the simulator with high event rates and monitor Wazuh:

```bash
# Generate high volume of events
for i in {1..10}; do
  python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --background --bgp-noise-rate 10.0 --output cli | nc wazuh-server 514 &
done

# Monitor Wazuh CPU and memory
top -p $(pgrep wazuh-analysisd)

# Check for event backlogs
tail -f /var/ossec/logs/ossec.log | grep "Queue"
```

If you see messages like "Event queue is 90% full," Wazuh cannot process events fast enough. Correlation rules are probably the bottleneck. Simplify them or reduce the number of active rules.

### Benchmarking correlation overhead

Measure performance with and without correlation rules:

```bash
# Baseline: disable correlation rules
sed -i 's/<if_matched_sid>/<!-- <if_matched_sid>/g' /var/ossec/etc/rules/local_rules.xml
systemctl restart wazuh-manager

# Run scenario and measure throughput
time python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli | nc wazuh-server 514

# With correlation: enable rules
sed -i 's/<!-- <if_matched_sid>/<if_matched_sid>/g' /var/ossec/etc/rules/local_rules.xml
systemctl restart wazuh-manager

# Run same scenario and compare
time python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli | nc wazuh-server 514
```

If correlation adds significant processing time (more than 20-30% overhead), your rules need optimisation.

## Practical limits of Wazuh correlation

Wazuh is excellent for simple stateful correlation (2-3 rules in sequence, timeframes under 300 seconds). Beyond that, its limitations become apparent:

- Cannot correlate across more than 4-5 rules easily. Each additional `if_matched_sid` increases complexity and processing time. The playbook scenarios span many more events than Wazuh can practically correlate.
- Cannot store state for hours or days. Long-term correlation (playbook 1 reconnaissance followed by playbook 3 exploitation days later) exceeds Wazuh's memory and timeframe capabilities.
- Cannot dynamically match field values across rules. You cannot write "if prefix in rule A equals prefix in rule B". You need hardcoded prefixes or regex ranges.
- Cannot correlate across arbitrary numbers of sources. Cross-source correlation works for 2-3 sources. Beyond that, rule complexity explodes.

For sophisticated correlation beyond Wazuh's capabilities, forward alerts to Splunk, Elastic, or Sentinel and perform correlation there. Wazuh does initial detection, external platforms do complex correlation.

## Next steps

You now understand time windows, stateful versus stateless correlation, and performance considerations for implementing 
correlation at scale. Proceed to [Testing correlation logic](testing.md) to learn systematic validation of correlation 
rules using simulator scenarios.

Correlation is a tool, not a goal. Use the minimum correlation necessary to detect attacks in your threat model. Excessive correlation consumes resources without improving detection. The playbook scenarios represent sophisticated attacks requiring correlation. Simpler attacks detected by single-source rules do not justify correlation overhead. Budget reality means you cannot correlate everything. Prioritise correlation for threats that matter.
