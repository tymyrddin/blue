# Testing correlation logic

## Why correlation rules need systematic testing

Correlation rules are complex. They depend on multiple decoders extracting fields correctly, parent rules firing in the right sequence, timeframes catching events that might be seconds or minutes apart, and field values matching across different log sources. Any failure in this chain breaks correlation silently. You think you are detecting attacks but your rules never trigger.

The Red Lantern simulator provides ground truth for testing correlation. You know exactly when attacks occur, what logs are generated, and what your rules should detect. This lets you validate correlation logic before deploying to production where ground truth is unavailable and mistakes are expensive.

## Using medium and advanced scenarios

Easy scenarios test basic detection. Medium and advanced scenarios test correlation because they involve multi-stage attacks spanning multiple log sources.

### Playbook 2 (medium difficulty)

Tests correlation of:
- TACACS authentication with ROA creation
- ROA publication with validator synchronisation
- Validation enforcement testing (frequency-based detection)

Run playbook 2 and identify correlation opportunities:

```bash
python -m simulator.cli simulator/scenarios/medium/playbook2/scenario.yaml --mode training --output cli
```

Training mode shows attack steps:

```
SCENARIO: T+60 - Credential use for RIR portal
SCENARIO: T+120 - Fraudulent ROA creation request
SCENARIO: T+2400 - Fraudulent ROA published
SCENARIO: T+3000 - Validation enforcement mapping begins
```

Your correlation rules should trigger at these timestamps. If they do not, either your rules are wrong or your decoders are broken.

### Playbook 3 (advanced difficulty)

Tests correlation of:
- BMP announcements with router logs
- Router logs with RPKI validator confirmations
- Traffic interception with forwarding establishment
- Multi-source confirmation of attack success

Run playbook 3 and validate full correlation chain:

```bash
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode training --output cli
```

Expected correlation points:

```
SCENARIO: T+60 - Hijack announcement (BMP + router should correlate)
SCENARIO: T+180 - RPKI validation begins (validators + router should correlate)
SCENARIO: T+300 - Traffic interception confirmed (multiple sources correlate)
```

## Validating event sequence detection

Correlation rules detect sequences. Testing validates that sequences trigger rules and non-sequences do not.

### Test case 1: Complete sequence

Run playbook 3 which contains a complete attack sequence:

```bash
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli | nc wazuh-server 514

# Wait for processing
sleep 10

# Check if correlation rule fired
grep "100902" /var/ossec/logs/alerts/alerts.json
```

Expected result: Alert with rule ID 100902 indicating full correlation chain detected.

If no alert appears:
1. Check each parent rule individually (`grep "100900\|100901\|100902"`)
2. Verify decoders extract fields correctly
3. Check timeframes are adequate
4. Confirm field names match across correlation stages

### Test case 2: Partial sequence (should not trigger final correlation)

Create a modified scenario with only BMP and router logs, no RPKI validator logs:

```bash
# Generate full logs
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli > full.log

# Extract only BMP and router logs (omit validators)
grep -E "^BMP ROUTE:|edge-router-01 BGP" full.log | nc wazuh-server 514

# Wait for processing
sleep 10

# Check alerts
grep "100902" /var/ossec/logs/alerts/alerts.json
```

Expected result: No alert with rule ID 100902 because the sequence is incomplete. Rules 100900 and 100901 might fire (BMP and router correlation) but 100902 should not (requires validator confirmation).

If 100902 fires anyway, your correlation logic is wrong. It is triggering on incomplete sequences.

### Test case 3: Events out of order

Correlation rules should respect event ordering. If router logs appear before BMP logs, correlation should fail:

```bash
# Generate logs
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli > full.log

# Reverse order: router logs first, then BMP
grep "edge-router-01 BGP" full.log | nc wazuh-server 514
sleep 2
grep "^BMP ROUTE:" full.log | nc wazuh-server 514

# Check alerts
sleep 10
grep "100901" /var/ossec/logs/alerts/alerts.json
```

Expected result: Rule 100901 should NOT fire because router logs arrived before BMP logs. Wazuh correlation is temporal; parent rules must fire first.

If 100901 fires, you have discovered a timing issue or your correlation rule is not properly using `if_matched_sid`.

### Test case 4: Events outside timeframe

Events that occur too far apart should not correlate:

```bash
# Send BMP log
grep "^BMP ROUTE:" full.log | nc wazuh-server 514

# Wait longer than correlation timeframe (e.g., 5 minutes if timeframe is 180 seconds)
sleep 300

# Send router log
grep "edge-router-01 BGP" full.log | nc wazuh-server 514

# Check alerts
sleep 10
grep "100901" /var/ossec/logs/alerts/alerts.json
```

Expected result: Rule 100901 should NOT fire because router logs arrived outside the 180-second correlation window.

If 100901 fires, your timeframe is too long or Wazuh's correlation state has not expired properly.

## Measuring correlation accuracy

Correlation accuracy has two dimensions: sensitivity (detecting actual attacks) and specificity (not triggering on benign activity).

### Sensitivity testing with attack scenarios

Run all playbook scenarios and measure detection rate:

```bash
#!/bin/bash
# test_sensitivity.sh

scenarios=(
  "simulator/scenarios/medium/playbook2/scenario.yaml"
  "simulator/scenarios/advanced/playbook3/scenario.yaml"
)

for scenario in "${scenarios[@]}"; do
  scenario_name=$(basename $(dirname "$scenario"))
  
  # Clear alerts
  > /var/ossec/logs/alerts/alerts.json
  
  # Run scenario
  python -m simulator.cli "$scenario" --mode practice --output cli | nc wazuh-server 514
  
  # Wait for processing
  sleep 15
  
  # Check if correlation rules fired
  if grep -q "100902\|100751\|100762" /var/ossec/logs/alerts/alerts.json; then
    echo "$scenario_name: DETECTED"
  else
    echo "$scenario_name: MISSED"
  fi
done
```

Expected result: All scenarios should show "DETECTED". If any show "MISSED", your correlation rules have sensitivity problems (false negatives).

### Specificity testing with background noise

Run scenarios with background noise and measure false positive rate:

```bash
# Generate logs with high background noise
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --background --bgp-noise-rate 10.0 --output cli | nc wazuh-server 514

# Wait for processing
sleep 30

# Count total correlation alerts
total=$(grep -c "correlation" /var/ossec/logs/alerts/alerts.json)

# Count attack-related alerts (rule IDs for actual attacks)
attacks=$(grep -cE "100902|100751|100762" /var/ossec/logs/alerts/alerts.json)

# False positives
false_positives=$((total - attacks))

echo "Total correlation alerts: $total"
echo "Attack alerts: $attacks"
echo "False positives: $false_positives"
echo "False positive rate: $(awk "BEGIN {printf \"%.2f\", ($false_positives / $total) * 100}")%"
```

Acceptable false positive rates:
- Under 10%: Excellent
- 10-20%: Good
- 20-30%: Acceptable for low-volume environments
- Over 30%: Too high, rules need tuning

If false positive rate exceeds 30%, review correlation rules. Common causes:
- Timeframes too long (correlating unrelated events)
- Field matching too broad (catching benign activity)
- Insufficient context (not checking all required conditions)

### Measuring time to detection

Correlation rules should detect attacks quickly. Measure time from attack initiation to alert:

```bash
# Run scenario in training mode to see attack timing
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode training --output cli | tee scenario.log | nc wazuh-server 514

# Extract attack initiation time from training output
attack_time=$(grep "SCENARIO: T+60 - Hijack announcement" scenario.log | awk '{print $2}')

# Wait for processing
sleep 10

# Extract alert time from Wazuh logs
alert_time=$(grep "100902" /var/ossec/logs/alerts/alerts.json | jq -r '.timestamp' | head -1)

# Calculate detection delay
echo "Attack occurred: $attack_time"
echo "Alert generated: $alert_time"
# (Manual calculation of difference)
```

Target detection times:
- Critical alerts (hijacks): under 60 seconds
- High severity (ROA manipulation): under 5 minutes
- Medium severity (reconnaissance): under 15 minutes

If detection takes longer, investigate:
- Log ingestion delays (slow syslog forwarding)
- Wazuh processing backlogs (check queue sizes)
- Correlation timeframes (too narrow to catch sequences)

## Testing with realistic traffic patterns

The simulator's background noise is synthetic. Production networks have different traffic patterns. Test correlation rules with production-like traffic when possible.

### Replaying production logs with injected attacks

If you have anonymised production logs, inject simulator output:

```bash
# Generate attack logs
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli > attack.log

# Combine with production logs
cat production_bgp.log attack.log production_bgp.log | sort | nc wazuh-server 514
```

This tests whether correlation rules work when attacks are buried in real traffic patterns. The simulator's background noise approximates real traffic but cannot perfectly replicate your specific environment.

### Testing during different times of day

Network traffic patterns vary by time. Test correlation during:
- Peak hours (high legitimate traffic might create false positives)
- Maintenance windows (legitimate changes might look like attacks)
- Off-hours (lower traffic might affect statistical baselines)

Run the same scenario at different times and compare results:

```bash
# Run at 0200 (low traffic)
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli | nc wazuh-server 514

# Run at 1400 (peak traffic)
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --background --bgp-noise-rate 20.0 --output cli | nc wazuh-server 514
```

Correlation should work equally well at both times. If detection fails during peak hours, your rules are sensitive to traffic volume.

## Automated correlation testing

Manual testing catches obvious problems. Automated testing catches regressions when you modify rules.

### Basic test script

```bash
#!/bin/bash
# test_correlation.sh

set -e

WAZUH_ALERTS="/var/ossec/logs/alerts/alerts.json"
FAIL=0

test_scenario() {
  local scenario=$1
  local expected_rule=$2
  local description=$3
  
  echo "Testing: $description"
  
  # Clear alerts
  > "$WAZUH_ALERTS"
  
  # Run scenario
  python -m simulator.cli "$scenario" --mode practice --output cli | nc localhost 514
  
  # Wait for processing
  sleep 10
  
  # Check for expected alert
  if grep -q "\"id\": \"$expected_rule\"" "$WAZUH_ALERTS"; then
    echo "  PASS: Rule $expected_rule triggered"
  else
    echo "  FAIL: Rule $expected_rule did not trigger"
    FAIL=1
  fi
}

# Test playbook 2 correlation
test_scenario \
  "simulator/scenarios/medium/playbook2/scenario.yaml" \
  "100751" \
  "Playbook 2: Fraudulent ROA detection"

# Test playbook 3 correlation
test_scenario \
  "simulator/scenarios/advanced/playbook3/scenario.yaml" \
  "100902" \
  "Playbook 3: Multi-source hijack correlation"

# Exit with error if any test failed
if [ $FAIL -eq 1 ]; then
  echo "Some tests failed"
  exit 1
fi

echo "All tests passed"
exit 0
```

Run this after modifying correlation rules to ensure changes do not break existing detection.

### Integration with CI/CD

Add correlation testing to your CI/CD pipeline:

```yaml
# .gitlab-ci.yml
test_correlation:
  stage: test
  script:
    - ./scripts/deploy_test_wazuh.sh
    - ./scripts/test_correlation.sh
  artifacts:
    reports:
      junit: correlation_test_results.xml
```

This prevents deploying broken correlation rules to production.

### Regression testing

When adding new correlation rules, ensure they do not interfere with existing rules:

```bash
# Run all scenarios before changes
./test_correlation.sh > baseline.txt

# Make rule changes
vim /var/ossec/etc/rules/local_rules.xml
systemctl restart wazuh-manager

# Run all scenarios after changes
./test_correlation.sh > updated.txt

# Compare results
diff baseline.txt updated.txt
```

If new rules break existing correlation (detection rate drops), you have introduced a regression.

## Debugging correlation failures

When correlation rules do not trigger, systematic debugging identifies the problem.

### Step 1: Verify parent rules fire

Check if parent rules trigger:

```bash
# Run scenario
python -m simulator.cli simulator/scenarios/advanced/playbook3/scenario.yaml --mode practice --output cli | nc wazuh-server 514

# Check all rules in correlation chain
grep -E "100900|100901|100902" /var/ossec/logs/alerts/alerts.json
```

If parent rules do not fire, the problem is decoders or rule conditions, not correlation logic.

### Step 2: Check field extraction

Use `wazuh-logtest` to verify decoders extract fields:

```bash
echo 'BMP ROUTE: prefix 203.0.113.128/25 AS_PATH [65001, 64513] NEXT_HOP 198.51.100.254 ORIGIN_AS 64513' | /var/ossec/bin/wazuh-logtest
```

Expected output should show extracted fields:
```
bmp.prefix: 203.0.113.128/25
bmp.as_path: 65001, 64513
bmp.next_hop: 198.51.100.254
bmp.origin_as: 64513
```

If fields are not extracted, decoder regex is wrong.

### Step 3: Verify timeframe adequacy

Check timestamps of parent rule alerts:

```bash
grep "100900" /var/ossec/logs/alerts/alerts.json | jq '.timestamp'
grep "100901" /var/ossec/logs/alerts/alerts.json | jq '.timestamp'
```

Calculate time difference. If difference exceeds correlation timeframe, rules cannot correlate.

### Step 4: Check field matching

Verify field values match across correlation stages:

```bash
# Extract prefix from parent rule alert
prefix_parent=$(grep "100900" /var/ossec/logs/alerts/alerts.json | jq -r '.data.bmp.prefix')

# Extract prefix from child rule alert
prefix_child=$(grep "100901" /var/ossec/logs/alerts/alerts.json | jq -r '.data.router.prefix')

echo "Parent prefix: $prefix_parent"
echo "Child prefix: $prefix_child"
```

If prefixes do not match (e.g., `203.0.113.128/25` vs `203.0.113.128 255.255.255.128`), field normalisation is needed.

## Next steps

You now understand systematic testing of correlation logic using simulator scenarios. Proceed to [Correlation in different platforms](platforms.md) to learn how to implement correlation in Splunk, Elastic, Sentinel, and custom engines when Wazuh's capabilities are insufficient for your correlation requirements.

Testing is ongoing, not one-time. As attacks evolve and the simulator adds new scenarios, retest correlation rules to ensure detection remains effective. The Scarlet Semaphore does not stand still. Neither should your validation process.