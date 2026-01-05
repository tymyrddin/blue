# Writing Wazuh rules

## What rules actually do

Rules are the final cog in the detection machine. Decoders have done the messy work of turning log lines into neat 
fields, much like a scribe translating ancient Ephebian. Rules look at those fields, spot the patterns that shouldn't 
be there, and decide when to raise the clacks alarm.

A good rule walks a tightrope. Make it too broad, and you will drown in alerts about perfectly normal routing flaps. 
Make it too specific, and a clever hijack will slip through dressed as legitimate traffic. Getting this balance right 
involves testing, tuning, and the occasional humble pie.

Rules live in `/var/ossec/etc/rules/`. Custom rules belong in `local_rules.xml` so they survive Wazuh's updates. 
The Department's previous habit of storing them on loose parchment did not end well.

## Rule anatomy

A rule at its most basic is not very clever:

```xml
<rule id="100001" level="5">
  <description>Something happened</description>
</rule>
```

This triggers on every single event, which is splendidly useless but shows the required bits. Every rule needs

*   `id` - A unique number. For your own rules, start at 100000.
*   `level` - A severity from 0 (ignore) to 15 (panic).
*   `description` - What appears in the alert.

A useful rule adds conditions. For instance, to catch a hijack from our Red Lantern simulator

```xml
<rule id="100001" level="10">
  <if_sid>100000</if_sid>
  <field name="event_type">bgp_announcement</field>
  <field name="intent">hijack</field>
  <description>BGP prefix hijack detected (simulator)</description>
</rule>
```

Now it only fires when:

1.  Parent rule 100000 matched first (`if_sid`)
2.  The `event_type` is `bgp_announcement`
3.  The `intent` is `hijack`

This is specific enough to be meaningful, but not so specific it would miss a hijack that used AS 65001 instead of 65000.

## Severity levels

Wazuh uses levels 0 to 15. Higher numbers mean more urgent alerts. The Department suggests this scale

*   Level 0-3, Informational - BGP sessions establishing, routine updates. Logged, but don't page anyone.
*   Level 4-7, Low Severity - A peer added without a ticket, a single failed login. Note it for the morning report.
*   Level 8-10, Medium Severity - An RPKI invalid, an unexpected route. An analyst should look within the hour.
*   Level 11-12, High Severity - A clear hijack, unauthorised config change. Investigate immediately.
*   Level 13-15, Critical - Multiple hijacks, evidence of a coordinated attack. Wake people up.

Your thresholds depend on contextual tolerance for drama. A university network might tolerate more than a bank.

## Rule syntax for different types of logs

### For BGP syslog (session state)

Standard router syslog tells about neighbour sessions, not individual prefixes. 

Match a session going down:

```xml
<rule id="105001" level="5">
  <decoded_as>bgp-adjchange</decoded_as>
  <field name="bgp.state">Down</field>
  <description>BGP neighbour session went down</description>
  <group>bgp,availability,</group>
</rule>
```

### For rich JSON logs (simulator & RPKI)

This is where you can write more sophisticated logic, as the data is richer.

Match a specific bad origin AS:

```xml
<rule id="100003" level="10">
  <if_sid>100000</if_sid> <!-- Parent is the simulator rule -->
  <field name="event_type">bgp_announcement</field>
  <field name="origin_asn">64999</field>
  <description>BGP announcement from suspicious origin AS</description>
</rule>
```

Use regex to match a critical prefix block

```xml
<rule id="100004" level="9">
  <if_sid>100000</if_sid>
  <field name="prefix" type="pcre2">^203\.0\.113\.</field>
  <description>Announcement affecting critical prefix range</description>
</rule>
```

The `type="pcre2"` lets you use regular expressions. This catches any prefix in the `203.0.113.0/24` block.

Detect when two fields don't match (e.g., a hijack)

```xml
<rule id="100030" level="9">
  <if_sid>100000</if_sid>
  <field name="event_type">bgp_announcement</field>
  <field name="origin_asn" compare="not_equal">expected_origin</field>
  <description>BGP announcement from unexpected origin AS</description>
</rule>
```

This is a classic hijack detection rule, comparing the seen `origin_asn` against the `expected_origin` provided by the simulator or an internal database.

## A vital note on BGP prefix monitoring

The complex, field-rich rules shown above (`origin_asn`, `prefix`, `as_path`) are only possible if you have the corresponding data.

*   If your source is the Red Lantern simulator or an RPKI validator (outputting JSON), you have this data. Proceed.
*   If your source is standard Cisco/Juniper syslog, you do not have this data. You cannot write rules to detect prefix hijacks from this source alone.

To monitor prefixes in production, you must set up a dedicated feed using the BGP Monitoring Protocol (BMP) or similar. 
This is a separate, more advanced piece of architecture. The rules document is correct in its logic, but you must ensure 
the data pipeline exists to support it.

## Chaining Rules to Tell a Story

Simple rules spot single events. Clever rules spot sequences.

Find reconnaissance followed by a hijack from the same source

```xml
<!-- Rule 1: Spot the recon -->
<rule id="100110" level="3">
  <if_sid>100000</if_sid>
  <field name="event_type">reconnaissance</field>
  <description>BGP reconnaissance activity</description>
  <group>recon,</group>
</rule>

<!-- Rule 2: Spot the correlated attack -->
<rule id="100111" level="12">
  <if_sid>100000</if_sid>
  <if_matched_sid>100110</if_matched_sid>
  <same_source_ip />
  <timeframe>3600</timeframe>
  <field name="intent">hijack</field>
  <description>BGP hijack following reconnaissance (attack chain detected)</description>
  <group>correlation,attack,</group>
</rule>
```

Rule 100111 only fires if a hijack (`intent: hijack`) occurs within an hour (`3600` seconds) of recon activity from the same IP. This turns two low-severity events into one high-severity alert.

## Using Groups to Organise the Chaos

Groups help you categorise alerts. Add them with the `<group>` tag.

```xml
<rule id="100006" level="10">
  <if_sid>100000</if_sid>
  <field name="intent">hijack</field>
  <description>BGP prefix hijack detected</description>
  <group>bgp,attack,network,</group>
</rule>
```

The trailing comma in `bgp,attack,network,` is important. Wazuh's grouping is a bit particular. Useful groups include `bgp`, `attack`, `policy_violation`, and `availability`.

## Practical Examples from the Trenches

Detecting an RPKI Validation Failure

```xml
<rule id="100102" level="9">
  <decoded_as>rpki-validator-json</decoded_as>
  <field name="validation_state">invalid</field>
  <description>RPKI validation failed for BGP announcement</description>
  <group>bgp,rpki,security,</group>
</rule>
```

Escalating Severity for a Critical Prefix

```xml
<rule id="100103" level="12">
  <if_sid>100102</if_sid> <!-- Parent is the RPKI failure rule -->
  <field name="prefix">203.0.113.0/24</field>
  <description>CRITICAL: RPKI validation failed for core network prefix</description>
  <group>bgp,rpki,critical,</group>
</rule>
```

## Testing, Documentation, and Maintenance

Test Before You Deploy
Use the `wazuh-logtest` tool with a sample log to see if your rule triggers.

```bash
echo '{"timestamp":"2025-12-28T14:23:45Z","event_type":"bgp_announcement","intent":"hijack"}' | /var/ossec/bin/wazuh-logtest
```

Document Your Rules
A comment saves future-you a world of confusion.

```xml
<!--
Rule: Detect basic BGP hijack in simulator.
Purpose: Catches announcements where origin AS != expected origin.
Tested Against: simulator/scenarios/easy/fat_finger_hijack/
False Positive Note: Will fire during legitimate AS migrations.
Last Review: 2025-12-28
-->
<rule id="100100" level="10">...</rule>
```

Deploy in Stages
1.  Deploy a new rule at Level 3 for a week to see what it catches silently.
2.  If the alerts are valid, increase it to its true severity (e.g., Level 10).
3.  Monitor. Tune. Repeat.

## Common Pitfalls in the Watchtower

*   Rule Never Fires - Check the decoder first with `wazuh-logtest`. If fields aren't being extracted, the rule is blind. Ensure parent rule IDs (`if_sid`) are correct.
*   Too Many False Alerts - Your rule is too broad. Add more specific fields to the match, or use a `timeframe` and `frequency` to require multiple occurrences.
*   Performance Grinds to a Halt - Complex correlation rules with long timeframes can be heavy. Use them sparingly and monitor your `wazuh-analysisd` process.

## The Path Forward

You now understand how to craft rules for the logs you actually have. The next step is systematic validation. Proceed to [Rule testing with simulator scenarios](testing.md) to learn how to prove your detection works before the real Scarlet Semaphore tries to slip past.

Remember, the perfect set of rules is a myth, like an honest politician or a quiet goblin. A good set of rules, well-tested and regularly reviewed, is what keeps the network safe.
