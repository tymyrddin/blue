# PCAP analysis procedures

Runbook for capturing and analysing full packet captures when an incident requires deeper investigation than Zeek and Suricata logs provide. PCAPs are not collected continuously; they are taken on demand. The Zeek and Suricata logs are the ongoing record. PCAPs are the magnifying glass brought out when something specific needs examining. Dr. Crucible keeps the magnifying glass in a locked drawer, metaphorically speaking.

## When to capture

Take a PCAP when:

- A Zeek or Suricata alert requires understanding the content of a specific connection, not just its metadata
- A suspected beacon has been identified and you need to confirm the payload pattern
- An anomaly is visible in connection logs (unusual port, unexpected protocol, irregular timing) that needs protocol-level analysis
- A post-incident reconstruction requires the exact sequence of packets

Do not take continuous full PCAPs of all traffic. The storage requirements are prohibitive and the privacy implications are significant. Customer portal traffic, in particular, may contain personal data; capturing it indiscriminately is inconsistent with Golem Trust's data protection obligations. Targeted captures of specific connections or short windows are appropriate. Continuous capture is not.

## Capturing traffic

Use `tcpdump` on the `gre-mirror` interface on `nsm.golemtrust.am`. Always specify a filter to limit the capture to the relevant traffic:

```
tcpdump -i gre-mirror -w /opt/pcap/capture_$(date +%Y%m%d_%H%M%S).pcap \
  -G 300 -W 1 \
  'host 203.0.113.45'
```

This captures traffic to or from IP `203.0.113.45` for 300 seconds (five minutes) and writes to a timestamped file. The `-G 300 -W 1` flags rotate after 300 seconds and write only one file, preventing runaway captures.

To capture a specific connection by port:

```
tcpdump -i gre-mirror -w /opt/pcap/capture_$(date +%Y%m%d_%H%M%S).pcap \
  'host 203.0.113.45 and port 443'
```

To capture traffic between two internal hosts:

```
tcpdump -i gre-mirror -w /opt/pcap/capture_$(date +%Y%m%d_%H%M%S).pcap \
  'src 10.0.0.2 and dst 10.0.0.3'
```

PCAP files are stored in `/opt/pcap/`. Create the directory with restricted permissions:

```
mkdir -p /opt/pcap
chmod 700 /opt/pcap
```

Only root and members of the `security` group should be able to read PCAP files.

## Analysing with Zeek

Zeek can process a PCAP file and produce its standard log output without reading from a live interface. This is useful for applying detection scripts retroactively or for analysing a PCAP from an external source:

```
mkdir -p /tmp/zeek-analysis
cd /tmp/zeek-analysis
zeek -r /opt/pcap/capture_20260301_143000.pcap \
  /opt/zeek/share/zeek/site/local.zeek
ls -la
```

The resulting logs (conn.log, http.log, etc.) are in the current directory. Inspect them with `zeek-cut`:

```
zeek-cut ts id.orig_h id.orig_p id.resp_h id.resp_p proto duration orig_bytes \
  < conn.log | sort -k7 -rn | head -20
```

This shows the longest-duration connections, which is a useful starting point when looking for beaconing or data exfiltration.

To extract all HTTP user agents seen in a capture:

```
zeek-cut user_agent < http.log | sort | uniq -c | sort -rn
```

To extract all DNS queries:

```
zeek-cut query qtype_name answers < dns.log | sort | uniq -c | sort -rn | head -30
```

## Analysing with Suricata

Process a PCAP through Suricata to check it against the current rule set:

```
mkdir -p /tmp/suricata-analysis
suricata -r /opt/pcap/capture_20260301_143000.pcap \
  -c /etc/suricata/suricata.yaml \
  -l /tmp/suricata-analysis/
cat /tmp/suricata-analysis/fast.log
```

`fast.log` contains a summary of triggered alerts. `eve.json` contains the full structured output. Use `eve.json` for detailed rule analysis:

```
python3 -c "
import json, sys
for line in open('/tmp/suricata-analysis/eve.json'):
  ev = json.loads(line)
  if ev.get('event_type') == 'alert':
    print(ev['timestamp'], ev['src_ip'], ev['dest_ip'],
          ev['alert']['signature_id'], ev['alert']['signature'])
"
```

## Analysing with Wireshark or tshark

For interactive or detailed packet-level analysis, use `tshark` (the command-line version of Wireshark) on the NSM instance, or copy the PCAP to an analyst workstation for use with the Wireshark GUI.

Copy a PCAP to a local workstation for GUI analysis:

```
scp -P 22 analyst@nsm.golemtrust.am:/opt/pcap/capture_20260301_143000.pcap ~/Desktop/
```

Use Wireshark's `Follow TCP Stream` function to read the content of a specific TCP connection. For TLS connections, only the handshake metadata is readable without the server's private key.

To extract HTTP objects from a PCAP (useful for finding downloaded files or exfiltrated data):

```
tshark -r /opt/pcap/capture_20260301_143000.pcap \
  --export-objects http,/tmp/http-objects/
ls /tmp/http-objects/
```

## PCAP retention and disposal

PCAPs taken during an incident are retained for the duration of the incident plus 90 days. After that period they should be deleted unless specifically required for legal proceedings, in which case Adora Belle decides retention.

PCAPs taken during routine testing or tuning activities are deleted after analysis is complete. Do not accumulate unreviewed PCAPs; they take up space and may contain personal data.

When deleting PCAPs, use secure deletion:

```
shred -u /opt/pcap/capture_20260301_143000.pcap
```

Log all PCAP captures and deletions in the internal security log, including the capture filter used, the duration, the analyst who initiated it, and the reason. Adora Belle reviews this log quarterly.
Last updated: 20 March 2026
