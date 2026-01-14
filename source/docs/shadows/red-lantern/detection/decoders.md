# Wazuh decoders

## How the decoder pipeline works

The journey of a log line through Wazuh follows a sensible, orderly queue:

1.  The Log Arrives from syslog, a file, or the network, looking rather lost.
2.  Wazuh tries each decoder in its list, in order, until one politely raises a hand and says, "I know this one."
3.  The matching decoder extracts fields using a regex or, if it's a modern log, by parsing JSON.
4.  These fields become available to the rules, which can now make intelligent decisions.
5.  Rules match on field values and, if something is amiss, trigger an alert to spoil someone's day.

## Decoder basics

Decoders live in XML files under `/var/ossec/etc/decoders/`. Wazuh comes with a decent starter set for common things 
like SSH and Windows. For the peculiar logs from your network routers or the Red Lantern simulator, we will need 
to write some.

A minimal decoder that just says "I see this type of log" looks like this

```xml
<decoder name="example">
  <prematch>some text that indicates this log type</prematch>
</decoder>
```

The `prematch` is a literal string or regex that must be in the log for this decoder to wake up. If not, Wazuh moves 
on, and the decoder goes back to its nap.

To be actually useful, a decoder needs to extract information:

```xml
<decoder name="example">
  <prematch>some text</prematch>
  <regex>pattern with (\S+) capture groups</regex>
  <order>field_name</order>
</decoder>
```

The parentheses `(\S+)` in the regex are capture groups. The `order` tag gives those captured bits a proper name. 
Now the rules can ask for `field_name`.

## Examples

[Red Lantern detections: Wazuh decoders](https://github.com/ninabarzh/red-lantern-detection/tree/main/wazuh)

## Order matters for ambiguous logs

If two decoders could match the same log, the first one in the file wins. Always put the specific decoders before the 
general ones. It's like dealing with a mob, address the one with the detailed grievance list before the one just 
shouting "I'm angry."

## Using `wazuh-logtest`

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

If the fields are not extracting, you will know immediately, and can adjust your decoder before it faces real traffic.

## Organising decoder files

The Department keeps its custom decoders in `/var/ossec/etc/decoders/`. These files persists across 
Wazuh updates, unlike the default rule files which might be overwritten.

After making changes, you must restart the Wazuh manager for them to take effect

```bash
systemctl restart wazuh-manager
```

It is mildly annoying but prevents a stray typo from instantly breaking production alerting.

