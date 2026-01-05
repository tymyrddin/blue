# Wazuh decoders

Before Wazuh's rules can raise the alarm, they need to make sense of the logs. Think of it like the clacks system before the little hods are clicked into place—the message is there in the flickers, but without the right sequence, it's just a pretty light show. Decoders are what click those hods into place, turning a raw line of text into structured fields with names and meanings.

If your logs are not decoded correctly, your rules are as useless as a chocolate teapot. Getting decoders right is foundational. It's not glamorous work, but it is necessary work, much like ensuring the clacks towers are actually pointing at each other before you try to send a message about invading armies.

## How the decoder pipeline works

The journey of a log line through Wazuh follows a sensible, orderly queue, much like the line for a decent pie shop.

1.  **The Log Arrives** from syslog, a file, or the network, looking rather lost.
2.  **Wazuh Tries Each Decoder** in its list, in order, until one politely raises a hand and says, "I know this one."
3.  **The Matching Decoder Extracts Fields** using a regex or, if it's a modern log, by parsing JSON.
4.  **These Fields Become Available** to the rules, which can now make intelligent decisions.
5.  **Rules Match on Field Values** and, if something is amiss, trigger an alert to spoil someone's day.

## Decoder basics, without the fuss

Decoders live in XML files under `/var/ossec/etc/decoders/`. Wazuh comes with a decent starter set for common things like SSH and Windows. For the peculiar logs from your network routers or our own Red Lantern simulator, you'll need to write your own.

A minimal decoder that just says "I see this type of log" looks like this

```xml
<decoder name="example">
  <prematch>some text that indicates this log type</prematch>
</decoder>
```

The `prematch` is a literal string or regex that must be in the log for this decoder to wake up. If not, Wazuh moves on, and the decoder goes back to its nap.

To be actually useful, a decoder needs to extract information

```xml
<decoder name="example">
  <prematch>some text</prematch>
  <regex>pattern with (\S+) capture groups</regex>
  <order>field_name</order>
</decoder>
```

The parentheses `(\S+)` in the regex are capture groups. The `order` tag gives those captured bits a proper name. Now your rules can ask for `field_name`.

## Parsing BGP syslog, a necessary headache

### What router syslog looks like

BGP events from routers typically arrive via syslog, dressed up like this

```
2025-12-28 14:23:45 router01 %BGP-5-ADJCHANGE, neighbour 192.0.2.1 Up
```

A sensible breakdown
*   `2025-12-28 14:23:45` - The timestamp.
*   `router01` - The hostname, usually self-assigned.
*   `%BGP-5-ADJCHANGE` - The facility, severity, and event type.
*   `neighbour 192.0.2.1 Up` - The actual news of the day.

Wazuh's built-in syslog decoders handle the timestamp and hostname. Your job is to deal with the BGP-specific drama.

### A basic BGP catch-all decoder

```xml
<decoder name="bgp-syslog">
  <prematch>%BGP-</prematch>
</decoder>
```

This matches any log containing `%BGP-`, which is a good way to corral all BGP messages into the same pen. On its own, it's not terribly clever, but it sets the stage for its more talented children.

### Extracting BGP session changes

To get the details from `%BGP-5-ADJCHANGE, neighbour 192.0.2.1 Up`, you need a child decoder with a regex

```xml
<decoder name="bgp-adjchange">
  <parent>bgp-syslog</parent>
  <regex offset="after_parent">(\d+)-ADJCHANGE, neighbour (\S+) (\w+)</regex>
  <order>bgp.severity, bgp.neighbour, bgp.state</order>
</decoder>
```

How it works
*   The `parent` attribute chains this to `bgp-syslog`. The child only works if the parent matched first.
*   `regex offset="after_parent"` means "start matching after the `prematch` from the parent." It saves you from repeating yourself.
*   The regex `(\d+)-ADJCHANGE, neighbour (\S+) (\w+)` has three capture groups for the severity, the neighbour IP, and the state (Up or Down).
*   The `order` tag names these fields `bgp.severity`, `bgp.neighbour`, and `bgp.state`.

Now you can write a rule that actually cares

```xml
<rule id="100001" level="3">
  <decoded_as>bgp-adjchange</decoded_as>
  <field name="bgp.state">Down</field>
  <description>BGP neighbour session went down</description>
</rule>
```

### A note on BGP prefix announcements

Cisco routers do not log individual prefix announcements in a verbose, helpful format to standard syslog. They log 
session state changes (`ADJCHANGE`).

To get the detailed prefix and path data for security monitoring, you cannot rely on syslog alone. You would need to 
use dedicated BGP monitoring protocols like BMP, packet capture, or specific debugging commands that are not meant 
for permanent use. The decoder example provided, while logically sound, is built for a log format that does not exist 
in the wild. It is the security equivalent of building a detector for dragon attacks—the logic is fine, but you'll 
be waiting a long time for a signal.

## Parsing JSON logs, a mercifully easy task

Modern tools like RPKI validators or our own Red Lantern simulator have the decency to output JSON, which is orders 
of magnitude easier to parse than syslog hieroglyphics.

An example RPKI log:

```json
{"timestamp": "2025-12-28T14:23:45Z", "prefix": "203.0.113.0/24", "origin_asn": 64500, "validation_state": "invalid", "expected_origin": [64500]}
```

### A JSON decoder for RPKI

```xml
<decoder name="rpki-validator-json">
  <prematch>"validation_state":</prematch>
  <plugin_decoder>JSON_Decoder</plugin_decoder>
</decoder>
```

And that is genuinely it. The `JSON_Decoder` plugin does all the heavy lifting. The field names will match the JSON keys (`prefix`, `origin_asn`, etc.), and rules can use them immediately.

```xml
<rule id="100003" level="9">
  <decoded_as>rpki-validator-json</decoded_as>
  <field name="validation_state">invalid</field>
  <description>RPKI validation failed</description>
</rule>
```

### Custom JSON decoders for the Red Lantern simulator

The [Red Lantern simulator](https://github.com/ninabarzh/red-lantern-sim) produces sensible JSON events. For example

```json
{
  "timestamp": "2025-12-28T14:23:45Z",
  "event_type": "bgp_announcement",
  "source_asn": 64500,
  "prefix": "203.0.113.0/24",
  "origin_asn": 64999,
  "as_path": [64500, 64999, 64502],
  "expected_origin": 64500,
  "intent": "hijack"
}
```

The decoder is just as simple:

```xml
<decoder name="red-lantern-json">
  <prematch>"event_type":</prematch>
  <plugin_decoder>JSON_Decoder</plugin_decoder>
</decoder>
```

All fields are extracted automatically. The `intent` field is particularly useful in training mode, as the simulator 
tells you outright what it's doing. In practice mode, this field is omitted, forcing your rules to detect the attack 
based on the evidence, not the confession.

## The hierarchy and order of decoders

Wazuh processes decoders in the order they appear in the file and stops at the first match. This has implications.

### Parent-child chains

Use them for related log types. It keeps things tidy.

```xml
<!-- Parent matches all BGP logs -->
<decoder name="bgp-syslog">
  <prematch>%BGP-</prematch>
</decoder>

<!-- Child matches specific BGP event types -->
<decoder name="bgp-adjchange">
  <parent>bgp-syslog</parent>
  <regex offset="after_parent">...</regex>
</decoder>
```

### Order matters for ambiguous logs

If two decoders could match the same log, the first one in the file wins. Always put the specific decoders before the 
general ones. It's like dealing with a mob, address the one with the detailed grievance list before the one just 
shouting "I'm angry."

## Testing your decoders, because trust is not a strategy

Before you deploy a decoder, test it. The Department learned this the hard way after a misconfigured decoder failed 
to spot a simulated "Fat Finger Hijack," leading to an awkward review meeting.

### Using `wazuh-logtest`

Wazuh includes a tool for this very purpose

```bash
/var/ossec/bin/wazuh-logtest
```

Paste a sample log line, and it will show you which decoders matched and what fields were extracted. If nothing matches, it tells you where it gave up, which is invaluable for debugging your regex.

### Testing with simulator output

This is the best way to see if your detection pipeline holds water. Run a simulator scenario and pipe it to the test tool

```bash
python -m simulator.cli simulator/scenarios/easy/playbook1/scenario.yaml | /var/ossec/bin/wazuh-logtest
```

If your fields are not extracting, you will know immediately, and can adjust your decoder before it faces real traffic.

## How to organise your decoder files

The Department keeps its custom decoders in `/var/ossec/etc/decoders/local_decoder.xml`. This file persists across 
Wazuh updates, unlike the default rule files which might be overwritten.

A bit of organisation saves future-you a headache

```xml
<decoder>
  <!-- BGP decoders -->
  <decoder name="bgp-syslog">...</decoder>
  <decoder name="bgp-adjchange">...</decoder>

  <!-- RPKI decoders -->
  <decoder name="rpki-validator-json">...</decoder>

  <!-- Simulator decoders -->
  <decoder name="red-lantern-json">...</decoder>
</decoder>
```

And for the love of a quiet life, **comment your decoders**. Future you, bleary-eyed at 3 a.m., will thank present you.

```xml
<!--
Decoder for BGP session state changes.
Matches: %BGP-5-ADJCHANGE, neighbour X.X.X.X Up/Down
Extracts: severity, neighbour IP, state
Last updated: 2025-12-28 by Archancellor Ridcully
-->
<decoder name="bgp-adjchange">
  <parent>bgp-syslog</parent>
  <regex offset="after_parent">(\d+)-ADJCHANGE, neighbour (\S+) (\w+)</regex>
  <order>bgp.severity, bgp.neighbour, bgp.state</order>
</decoder>
```

After making changes, you must restart the Wazuh manager for them to take effect

```bash
systemctl restart wazuh-manager
```

It is mildly annoying but prevents a stray typo from instantly breaking production alerting.

## The next step

Now that your logs are decoded into neat, structured fields, you can write rules that match on them. The next 
chapter in this adventure is [Writing Wazuh rules](wazuh.md), where you learn to turn those fields into meaningful 
alerts.

Decoders are the foundation. A rule cannot catch what its decoder cannot see. Invest the time here. It is less 
exciting than writing clever correlation logic, but it is what separates a system that works from one that just 
looks busy.
