# Writing Wazuh rules

## What rules actually do

Rules are the final cog in the detection machine. Decoders have done the messy work of turning log lines into neat 
fields. Rules look at those fields, spot the patterns that shouldn't be there, and decide when to raise the alarm.

A good rule walks a tightrope. Make it too broad, and you will drown in alerts from perfectly normal routing flaps. 
Make it too specific, and a clever hijack will slip through dressed as legitimate traffic. Getting this balance right 
involves testing, tuning, and the occasional humble pie.

Rules live in `/var/ossec/etc/rules/`. Custom rules in `local_rules.xml` survive Wazuh's updates.

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

## Examples

[Red Lantern detections: Wazuh rules](https://github.com/ninabarzh/red-lantern-detection/tree/main/wazuh)

## Severity levels

Wazuh uses levels 0 to 15. Higher numbers mean more urgent alerts. The Department suggests this scale

*   Level 0-3, Informational - BGP sessions establishing, routine updates. Logged, but don't page anyone.
*   Level 4-7, Low Severity - A peer added without a ticket, a single failed login. Note it for the morning report.
*   Level 8-10, Medium Severity - An RPKI invalid, an unexpected route. An analyst should look within the hour.
*   Level 11-12, High Severity - A clear hijack, unauthorised config change. Investigate immediately.
*   Level 13-15, Critical - Multiple hijacks, evidence of a coordinated attack. Wake people up.

Choosing thresholds depend on contextual tolerance for drama. A university network might tolerate more than a bank.

## Using groups

Groups help categorise alerts. Add them with the `<group>` tag.

```xml
<group name="red_lantern.rpki">
  <!-- Generic RPKI validation event -->
  <rule id="93001" level="5">
    <decoded_as>red_lantern_rpki_decoder</decoded_as>
    <description>Red Lantern | RPKI | Validation result observed</description>
    <group>red_lantern.rpki</group>
    <options>no_full_log</options>
  </rule>

  <!-- RPKI state change -->
  <rule id="93002" level="7">
    <if_sid>93001</if_sid>
    <description>Red Lantern | RPKI | Monitored prefix validation state</description>
    <group>red_lantern.rpki,bgp,correlation</group>
    <options>no_full_log</options>
    <field name="rpki.state" type="pcre2">^(VALID|INVALID|UNKNOWN)$</field>
  </rule>
</group>
```

## Testing

Before deploying a rule, [test it](testing.md).

### Using `wazuh-logtest`

Use the `wazuh-logtest` tool with a sample log to see if your rule triggers.

```bash
echo '{"timestamp":"2025-12-28T14:23:45Z","event_type":"bgp_announcement","intent":"hijack"}' | /var/ossec/bin/wazuh-logtest
```

## Common pitfalls

*   Rule Never Fires - Check the decoder first with `wazuh-logtest`. If fields aren't being extracted, the rule is blind. Ensure parent rule IDs (`if_sid`) are correct.
*   Too Many False Alerts - Your rule is too broad. Add more specific fields to the match, or use a `timeframe` and `frequency` to require multiple occurrences.
*   Performance Grinds to a Halt - Complex correlation rules with long timeframes can be heavy. Use them sparingly and monitor your `wazuh-analysisd` process.
