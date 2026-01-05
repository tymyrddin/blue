# Testing Wazuh rules

## Why testing matters, truly

Writing a rule that *looks* correct in an editor is not the same as writing one that *works* correctly. The department has learned this through bitter experience, rules that were poetry in XML but, in production, either slept through an attack or cried wolf at every passing packet.

The [Red lantern simulator](https://github.com/ninabarzh/red-lantern-sim) provides what production logs cannot, ground truth. When you run a scenario, you know an attack *is* happening, what it looks like, and when. This lets you answer critical questions. Did my rule fire. Did it fire *only* when it should. How long did detection take. Without this, you are just guessing in the dark, which is a poor strategy for security.

## Running easy scenarios against your rules

Start with the straightforward scenarios. If your rules cannot catch a clumsy, obvious hijack, they will not stand a chance against something clever.

### Testing a basic hijack scenario

To run the "fat finger" hijack scenario and send its output directly to your Wazuh server's syslog port
```bash
python -m simulator.cli simulator/scenarios/easy/fat_finger_hijack/scenario.yaml | nc your-wazuh-server-ip 514
```
To save the output to a JSON file for Wazuh to read later
```bash
python -m simulator.cli simulator/scenarios/easy/fat_finger_hijack/scenario.yaml --output json --json-file /var/log/simulator_test.json
```
Then, check `/var/ossec/logs/alerts/alerts.json` for any alerts that fired.

### What a successful detection looks like

If your rules and decoders are working, you should see an alert like this in the logs
```json
{
  "timestamp": "2025-12-28T14:23:45Z",
  "rule": {
    "id": "100100",
    "level": 10,
    "description": "BGP prefix announced from wrong origin AS"
  },
  "decoder": {
    "name": "red-lantern-json"
  },
  "data": {
    "event_type": "bgp_announcement",
    "origin_asn": "64999",
    "expected_origin": "64500"
  }
}
```
If this alert appears, celebrate, your detection pipeline works. If it does not, the problem is in your decoder, is it extracting the fields, or your rule, are the conditions correct.

### Testing systematically

Do not test one scenario at a time. Run them all. A simple shell script can do this
```bash
cd simulator/scenarios/easy/
for scenario in */scenario.yaml; do
    echo "Testing: $(basename $(dirname $scenario))"
    python -m simulator.cli "$scenario" --output json --json-file "/tmp/test_$(basename $(dirname $scenario)).json"
    # Feed the file to Wazuh, then check for alerts
done
```
Keep a simple table of your results. It reveals your strengths and gaps at a glance.

| Scenario | Rule ID | Detected? | Notes |
| :--- | :--- | :--- | :--- |
| fat_finger_hijack | 100100 | Yes | Good. |
| unauthorised_peer | 100101 | No | **Decoder/rule gap** |
| rpki_invalid | 100102 | Yes | Good. |

## The crucial difference between training and practice mode

The simulator has two modes, and confusing them is a classic mistake.

*   **Training mode (`--mode training`)**. The simulator helpfully adds an `"intent": "hijack"` field to the JSON. This is for **development and learning only**. It lets you write a simple rule that catches *everything* labelled as an attack, which is great for validating your data pipeline is connected.
*   **Practice mode (default)**. The `intent` field is **removed**. This simulates reality, where attackers do not label their work for you. Your rules must detect the attack based on observable evidence alone, for example, `origin_asn != expected_origin`.

**Your final, production rules must work in practice mode.** Use training mode to get started, but always make the final test without it.

## Measuring what actually matters, false positives

A rule that fires for every attack but also for a hundred normal events is worse than useless, it teaches your team to ignore alerts.

### Simulating a noisy network

The simulator can generate background noise, normal BGP updates and configuration changes, against which your rules must operate.
```bash
python -m simulator.cli simulator/scenarios/easy/fat_finger_hijack/scenario.yaml --background --bgp-noise-rate 1.0
```
Run this for a while, then check your alerts. Calculate a simple false positive rate
```bash
# Count total alerts during the test period
total_alerts=$(grep -c '"rule"' /var/ossec/logs/alerts/alerts.json)
# Count alerts that were for the actual attack (using your known rule ID)
true_alerts=$(grep -c '"id":"100100"' /var/ossec/logs/alerts/alerts.json)
# Calculate false positives
false_positives=$((total_alerts - true_alerts))
echo "False positive rate: $((false_positives * 100 / total_alerts))%"
```

### What is an acceptable rate

There is no perfect number, but here is a sensible guide
*   **Under 10%**. Good. Your analysts will trust the alerts.
*   **10-25%**. Tolerable for lower-severity rules, but needs improvement.
*   **Over 25%**. Unacceptable. The rule is more noise than signal and must be refined.

### Tuning a noisy rule

If a rule fires too often, you must narrow its focus. Add more specific conditions.

**Before, too noisy**
```xml
<rule id="100200" level="8">
  <if_sid>100000</if_sid>
  <field name="event_type">bgp_announcement</field>
  <description>Any BGP announcement</description>
</rule>
```

**After, more focused**
```xml
<rule id="100200" level="8">
  <if_sid>100000</if_sid>
  <field name="event_type">bgp_announcement</field>
  <field name="origin_asn" compare="not_equal">expected_origin</field>
  <description>BGP announcement from unexpected origin</description>
</rule>
```

## Automating the tedium, a basic test script

You will test your rules often. Automate it. Here is a foundational script to build upon.
```bash
#!/bin/bash
# test_rules.sh
SCENARIO="simulator/scenarios/easy/fat_finger_hijack/scenario.yaml"
ALERT_LOG="/var/ossec/logs/alerts/alerts.json"
TEST_LOG="/tmp/test_output.json"

echo "Clearing old alerts..."
sudo truncate -s 0 "$ALERT_LOG"

echo "Running scenario: $SCENARIO"
python -m simulator.cli "$SCENARIO" --output json --json-file "$TEST_LOG"

echo "Feeding events to Wazuh..."
# Assuming Wazuh is configured to read /var/log/simulator_test.json
sudo cp "$TEST_LOG" /var/log/simulator_test.json

echo "Waiting for processing..."
sleep 10

echo "--- Results ---"
if grep -q '"id":"100100"' "$ALERT_LOG"; then
    echo "✅ SUCCESS: Rule 100100 fired."
else
    echo "❌ FAILURE: Rule 100100 did not fire."
    echo "Check: 1) Is the decoder working? 2) Are field names correct?"
fi
```
Run this script every time you change a rule or decoder.

## A realistic warning about "BGP update" rules

Much of the advanced testing logic in the original document, checking `as_path` fields, complex prefix matching, assumes you are working with rich BGP update data.

**Remember.** Standard router syslog does *not* provide this data. If your rules are designed to parse fields like `as_path` or specific prefix announcements, they will only work if you are testing with the Red lantern simulator's JSON output **or** if you have gone to the considerable effort of setting up a dedicated BGP monitoring feed, like BMP, in production.

Do not expect a rule checking `bgp.as_path` to work if your only data source is a Cisco router's standard `%BGP-5-ADJCHANGE` syslog. Test with the right data.

## The iterative cycle of refinement

Rule-writing is not a one-time event. It is a cycle.

1.  **Write** a rule based on your understanding of a threat.
2.  **Test** it with a simulator scenario.
3.  **Measure** its false positive rate with background noise.
4.  **Refine** the rule based on the results.
5.  **Repeat.**

A rule might go through this cycle three to five times before it is good enough. Document what you changed and why. Future you will be grateful.

## The path forward

You now have the tools to move from hopeful rule-writing to verified detection. The next step is 
[Integration patterns](integrations.md) for regular workflows, perhaps even automating it with a Git hook that runs 
tests before committing a new rule.

The goal is not perfect detection, that is the realm of fairy tales. As the Scarlet Semaphore adapts their techniques, 
rules need adaptation too. Regular testing with new scenarios ensures your detection stays effective. Perfect 
detection does not exist. Continuously improving detection through systematic testing is achievable and substantially 
better than hoping your rules work without ever validating they do.
