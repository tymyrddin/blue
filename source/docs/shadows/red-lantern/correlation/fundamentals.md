# Correlation fundamentals

## What event correlation actually is

Event correlation is the art of noticing that three perfectly innocent-looking things, when they happen in the right 
order from the right place, are actually one very suspicious thing. It is pattern recognition across time and space, 
the security equivalent of realising that the person who bought rope, a shovel, and a large tarp from three different 
shops might be planning something other than gardening.

Individual events rarely tell the full story. A BGP session goes down. Someone queries routes. A new prefix appears. 
Each event alone might be routine. All three from the same source within an hour suggests reconnaissance followed by 
attack. Correlation connects the dots.

The Department learnt the value of correlation after a simulated attack breezed past rules that checked individual 
events but missed the sequence. The post-mortem was uncomfortable. We now correlate aggressively.

## The three types of correlation

### Temporal correlation (events in sequence)

Temporal correlation detects events happening in a particular order within a time window. Event A followed by Event 
B followed by Event C, all within an hour, suggests an attack chain. The same three events spread across a week might 
be coincidence.

Example from BGP security:

1. Time T+0: BGP route query from 192.0.2.99
2. Time T+30: BGP session established from 192.0.2.99  
3. Time T+45: Suspicious prefix announcement from 192.0.2.99

Each event alone is unremarkable. In sequence, they indicate reconnaissance, access, and exploitation. The time window 
matters. If the query happened last Tuesday and the announcement happens today, correlation is probably spurious.

Implementation challenges:

Time windows are tricky to tune. Too short and you miss slow attacks. Too long and you correlate unrelated events. 
The Red Lantern simulator lets you test different windows against known attack timelines to find what works.

Wazuh's `if_matched_sid` with `timeframe` does this. Elastic's EQL sequences are purpose-built for it. Splunk's 
transaction command correlates events by field values within time spans.

### Spatial correlation (events across sources)

Spatial correlation detects events from different log sources that together indicate compromise. A failed 
authentication on the router, a CMDB change adding a BGP peer, and an RPKI validation failure from three different 
systems might all be parts of the same attack.

Example from BGP security:

1. Router syslog: New BGP peer 192.0.2.99 added
2. CMDB: No change ticket for BGP peer addition
3. RPKI validator: Validation failure for prefix announced by 192.0.2.99

The router tells you what happened. The CMDB tells you it was unauthorised. The RPKI validator tells you the 
announcement is invalid. Individually, these might be configuration errors. Together, they scream "attack."

Implementation challenges:

Different log sources have different field names, timestamps, and formats. You need to normalise before correlating. 
The simulator outputs consistent JSON specifically to make spatial correlation easier to test.

Correlation also requires storing events from multiple sources long enough to detect patterns. This has memory and 
performance costs. You cannot correlate everything with everything. Prioritise based on likely attack chains.

### Statistical correlation (anomaly detection)

Statistical correlation detects events that deviate from baseline behaviour. Not "Event A followed by Event B" but 
"Event A is happening 10 times more frequently than normal" or "Event B is coming from an ASN we have never seen before."

Example from BGP security:

1. Baseline: AS64500 announces 50-60 prefixes daily
2. Today: AS64500 announces 200 prefixes in one hour
3. Alert: Unusual announcement volume from known peer

Or:

1. Baseline: Prefixes in 203.0.113.0/24 announced by AS64500-AS64502
2. Today: Prefix in 203.0.113.0/25 announced by AS64999
3. Alert: Unexpected origin for monitored prefix block

Implementation challenges:

Statistical correlation requires baselines, which require historical data and assumptions about what "normal" looks 
like. Networks change. Your baseline from six months ago might be completely wrong today.

Machine learning can help but adds complexity. Elastic's anomaly detection, Splunk's MLTK, and Chronicle's entity 
analytics all do statistical correlation. The simulator's background noise lets you test whether your anomaly 
detection can spot attacks amongst routine variance.

## Common correlation patterns for attack detection

### Kill chain correlation

The kill chain model describes attack stages: reconnaissance, weaponisation, delivery, exploitation, installation, 
command and control, actions on objectives. Detecting multiple stages in sequence indicates a sophisticated attack 
rather than random probing.

BGP kill chain example:

1. Reconnaissance: BGP route queries, traceroutes, AS path analysis
2. Weaponisation: Preparing bogus route announcements
3. Delivery: Establishing BGP session or compromising legitimate peer
4. Exploitation: Announcing hijacked prefixes
5. Installation: Traffic redirection established
6. Command and Control: Maintaining control of hijacked routes
7. Actions on Objectives: Data exfiltration, traffic manipulation, denial of service

Detecting stages 1, 3, and 4 in sequence within a reasonable timeframe gives high confidence of deliberate attack. 
Detecting only stage 4 might be misconfiguration.

Correlation rule logic:

```
IF reconnaissance_event
  FOLLOWED BY session_establishment (same source)
  FOLLOWED BY suspicious_announcement (same source)
  WITHIN 4 hours
THEN alert: BGP attack chain detected
```

The simulator's medium and advanced scenarios exercise multi-stage attacks specifically to test kill chain correlation.

### Privilege escalation chains

In traditional IT security, privilege escalation involves gaining higher access levels. In BGP security, the 
equivalent is gaining greater control over routing decisions.

BGP privilege escalation example:

1. Attacker establishes session as low-privilege peer (customer)
2. Attacker announces routes beyond their allocated prefixes
3. Attacker attempts to influence upstream routing decisions
4. Attacker achieves traffic redirection

Each step increases control. Detecting the sequence reveals the attacker's goals.

Correlation rule logic:

```
IF new_peer_session (customer tier)
  FOLLOWED BY announcement_beyond_allocation
  FOLLOWED BY upstream_route_changes
THEN alert: BGP privilege escalation attempt
```

This requires knowing customer allocations and monitoring announcement scope, which implies integration with your 
IP address management database.

### Lateral movement detection

After initial compromise, attackers move laterally to other systems. In network terms, this means compromising one 
router then using BGP relationships to affect others.

BGP lateral movement example:

1. Router A compromised (session manipulation detected)
2. Router A's BGP peers start exhibiting anomalies
3. Router B (peer of A) shows unauthorised configuration changes
4. Attack spreads across BGP mesh

Correlation rule logic:

```
IF compromise_detected(router_A)
  FOLLOWED BY anomalies_from_peers(router_A)
  WITHIN 24 hours
THEN alert: Potential lateral movement via BGP
```

This is advanced correlation requiring topological awareness. You need to know which routers peer with which to 
detect spread patterns. The simulator does not yet model lateral movement (budget reality), but the correlation 
logic remains valid.

### Attack timeline reconstruction

After an incident, you need to understand what happened and when. Correlation reconstructs the timeline from 
scattered log events.

Post-incident correlation:

```
Query all events from attacker_IP between T-24h and T+1h
Correlate by timestamp
Build timeline:
  T-2h: Initial reconnaissance
  T-1h: Session established
  T-30m: First announcement
  T-15m: RPKI failures begin
  T-0: Detection and response
  T+30m: Incident contained
```

This is forensic correlation rather than real-time detection. You are looking backwards to understand what you missed. 
The simulator's training mode provides ground truth timelines for validating your reconstruction logic.

## Correlation in practice with the Red Lantern simulator

The simulator provides attack timelines, letting you test correlation logic against ground truth. This is 
invaluable because production logs lack labels saying "this is step 2 of a 3-step attack."

### Testing temporal correlation

Run a scenario with multiple stages:

```bash
python -m simulator.cli simulator/scenarios/medium/staged_attack/scenario.yaml --mode training
```

Training mode shows when each stage occurs:

```
SCENARIO: T+0 - Reconnaissance initiated
SCENARIO: T+120 - Session establishment attempt
SCENARIO: T+180 - Prefix announcement (hijack)
```

Now test the correlation rule. Did it trigger when all three stages completed? Did it trigger on stage 1 alone 
(false positive)? Did it miss the sequence entirely (detection gap)?

### Testing spatial correlation

Run a scenario with background noise:

```bash
python -m simulator.cli simulator/scenarios/medium/staged_attack/scenario.yaml --background --bgp-noise-rate 1.0
```

Background noise simulates legitimate BGP churn. Can your correlation rule detect the attack amongst the noise? Or 
does it correlate legitimate events into false attack chains?

### Testing statistical correlation

Run multiple scenarios to establish baseline:

```bash
for i in {1..10}; do
    python -m simulator.cli simulator/scenarios/easy/playbook1/scenario.yaml --background
done
```

This builds a baseline of "normal" plus occasional hijacks. Now test anomaly detection. Does it spot hijacks as 
statistical outliers? Or does background noise swamp the signal?

## Correlation challenges and trade-offs

### Memory and performance

Correlation requires remembering events. Temporal correlation stores events until the time window expires. Spatial 
correlation stores events from multiple sources until they can be matched. Statistical correlation stores historical 
data for baseline comparison.

This has costs. A Wazuh correlation rule with a 24-hour timeframe must store 24 hours of events matching the parent 
rule. On a busy network, this accumulates quickly. Monitor memory usage and tune timeframes to balance detection 
capability against resource consumption.

### False positive management

Correlation reduces false positives by requiring multiple conditions. A single RPKI failure might be misconfiguration. 
An RPKI failure preceded by reconnaissance and followed by traffic anomalies is probably attack.

But correlation can also create false positives. Legitimate maintenance often follows patterns similar to attacks: 
query routes, update configurations, announce new prefixes. Distinguish legitimate from malicious through context 
(change tickets, maintenance windows, known operators).

### Time window tuning

Too short: miss slow attacks. Too long: correlate unrelated events. The "correct" window depends on attacker behaviour, 
which you discover through testing and incident analysis.

The simulator lets you experiment. Run scenarios with different speeds (slow reconnaissance over hours, fast 
exploitation in minutes) and test whether your time windows catch both patterns without correlating unrelated events.

### Baseline drift

Statistical correlation assumes stable baselines. But networks change. New peers are added. Traffic patterns shift. 
Your six-month baseline might be obsolete.

Solutions: rolling windows (baseline last 30 days, not all time), automatic retraining (ML models update periodically), 
manual review (quarterly baseline validation). The simulator's background noise helps test whether your baseline 
adapts or becomes stale.

## Designing correlation rules

### Start with individual event detection

Before correlating, ensure individual events are detected correctly. If your rule for "BGP session established" never 
fires, your correlation rule looking for "session followed by announcement" will also never fire.

Test individual rules first using easy simulator scenarios. Once those work, add correlation logic.

### Choose correlation type based on attack pattern

Temporal correlation for multi-stage attacks. Spatial correlation for attacks spanning multiple systems. Statistical 
correlation for detecting deviations from normal behaviour.

BGP attacks often combine types. A sophisticated attack might:
1. Deviate statistically (unusual announcement volume)
2. Correlate temporally (recon followed by exploitation)
3. Correlate spatially (changes across router, RPKI, and CMDB)

Start simple. Add complexity only when simpler correlation misses attacks.

### Document expected attack chains

Write down the attack sequence you are trying to detect:

```
Attack: BGP hijack with prior reconnaissance

Expected sequence:
1. BGP route query from attacker_IP
2. BGP session established from attacker_IP
3. Prefix announcement with wrong origin from attacker_IP

Timeframe: All within 2 hours
Confidence: High if all three occur
           Medium if only 2 and 3 occur
           Low if only 3 occurs

False positive risks:
- Legitimate network troubleshooting follows similar pattern
- Mitigate by checking for change tickets
```

This documentation guides rule implementation and helps explain to analysts why the alert fired.

### Test with known attack scenarios

The simulator provides ground truth. If your correlation rule does not trigger on the `staged_attack` scenario, it 
will not trigger on a real staged attack. Fix the rule before deploying it.

Test both positive (attack scenarios) and negative (background noise alone). Correlation should trigger on attacks 
but not on legitimate activity.

## Platform-specific correlation capabilities

### Wazuh

Temporal correlation with `if_matched_sid` and `timeframe`. Can correlate rules that fired previously. Limited 
spatial correlation (requires rules to emit comparable fields). No built-in statistical correlation.

Strengths: Simple, deterministic, efficient.  
Weaknesses: Complex correlation logic gets unwieldy. Long timeframes are expensive.

### Splunk

Temporal correlation with transaction and streamstats. Spatial correlation with join. Statistical correlation 
with stats, timechart, and MLTK.

Strengths: Flexible query language, powerful analytics.  
Weaknesses: Performance tuning required for complex queries.

### Elastic

Temporal correlation with EQL sequences. Spatial correlation with Elasticsearch joins. Statistical correlation 
with ML anomaly detection.

Strengths: Purpose-built sequence detection (EQL), strong ML.  
Weaknesses: EQL learning curve, ML requires tuning.

### Sentinel

Temporal correlation with KQL and Fusion. Spatial correlation with joins across workspaces. Statistical correlation 
with user and entity behaviour analytics (UEBA).

Strengths: Cross-workspace correlation, Fusion ML for multi-stage attacks.  
Weaknesses: Azure ecosystem lock-in, costs scale with data volume.

### Chronicle

Temporal correlation with YARA-L sequences. Spatial correlation with multi-event rules. Statistical correlation 
with entity context.

Strengths: Built for scale, fast searches over long periods.  
Weaknesses: Smaller ecosystem, newer platform.

## Next steps

You now understand the fundamentals of event correlation and common attack patterns. Proceed to 
[Practical correlation with the simulator](practice.md) to implement these concepts with real scenarios, or jump 
to [Correlation in different platforms](/docs/shadows/red-lantern/correlation/platforms/) for platform-specific syntax.

Remember that correlation is not magic. It is structured thinking about how attacks unfold and translating that 
thinking into detection logic. The simulator provides ground truth for testing whether your thinking matches reality. 
Perfect correlation does not exist, but good enough correlation that catches attacks before they succeed is entirely 
achievable.
