# C2 framework activity hunt

Four hunts covering the main detection surfaces for C2 framework activity: Named Pipe
indicators on endpoints, TLS fingerprinting in network logs, HTTP beacon pattern
recognition in proxy logs, and beaconing interval analysis.

## Named Pipe creation matching C2 framework patterns

Hypothesis: a C2 framework is using SMB Named Pipes for internal pivoting or
post-exploitation communication, with default pipe names that have not been customised.

Data sources: `Sysmon Event ID 17` (Pipe Created) and `Event ID 18` (Pipe Connected);
requires Sysmon with PipeEvent logging enabled in the configuration.

```powershell
$startTime = (Get-Date).AddHours(-24)

Get-WinEvent -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = @(17, 18)
    StartTime = $startTime
} | ForEach-Object {
    $xml  = [xml]$_.ToXml()
    $data = $xml.Event.EventData.Data

    $pipeName = ($data | Where-Object Name -eq 'PipeName').'#text'
    $image    = ($data | Where-Object Name -eq 'Image').'#text'

    # Cobalt Strike default pipe name patterns:
    # MSSE-*-server (psexec module), msagent_* and postex_* (post-exploitation jobs)
    if ($pipeName -match 'MSSE-|msagent_|postex_') {
        [PSCustomObject]@{
            Time     = $_.TimeCreated
            EventId  = $_.Id
            PipeName = $pipeName
            Process  = $image
        }
    }
} | Sort-Object Time
```

Legitimate software that creates named pipes includes database engines, print spoolers,
and IPC-based services. These appear on the same hosts consistently from the same process
images. A named pipe matching a CS pattern created by a process other than a known service
binary, particularly from a parent chain including a scripting host or a
process-injected image, is high confidence. Pipe events without a corresponding legitimate
service context are the signal.

To broaden beyond known patterns, flag pipes with names that are short random hex strings
(eight to sixteen characters) or random alphanumeric sequences, which suggest
programmatically generated names rather than named service pipes:

```powershell
    # additional heuristic: pipe names matching random-looking patterns
    # eight or more hex characters, or long random alphanumeric strings
    if (($pipeName -match '^\\PIPE\\[0-9a-f]{8,}$' -or
         $pipeName -match '^\\PIPE\\[A-Za-z0-9]{12,}$') -and
        $pipeName -notmatch 'chrome|firefox|sql|oracle|print|spooler|wkssvc|srvsvc') {
        [PSCustomObject]@{
            Time     = $_.TimeCreated
            EventId  = $_.Id
            PipeName = $pipeName
            Process  = $image
        }
    }
```

## JA3S fingerprint analysis in Zeek TLS logs

Hypothesis: a C2 framework team server is identifiable by its TLS ServerHello
fingerprint (JA3S), which reflects the server-side TLS library rather than the certificate.

Data sources: Zeek `ssl.log`; requires JA3 and JA3S logging enabled in Zeek (included
in standard Zeek deployments from version 3.x).

```bash
# extract TLS connections with JA3S values; check against known-bad hashes
# ja3s fingerprints for major C2 frameworks are maintained in threat intel feeds
# (abuse.ch, Emerging Threats, commercial feeds)

zeek-cut ts id.orig_h id.resp_h id.resp_p server_name ja3 ja3s issuer \
  < ssl.log | \
  awk '$6 != "-" && $7 != "-"' | \
  sort -t$'\t' -k7 | \
  join -t$'\t' -1 7 -2 1 - known_bad_ja3s.txt
```

For environments without a maintained feed, flag connections where the JA3S value
matches the Java TLS (JSSE) fingerprint family, identifiable by specific cipher suite
orderings characteristic of Java's default TLS configuration, to external IPs with no
matching domain or certificate in the organisation's inventory:

```bash
# flag connections where issuer contains non-standard country codes or known default
# C2 certificate attributes; also flag self-signed certificates to external IPs
zeek-cut ts id.orig_h id.resp_h id.resp_p server_name issuer validation_status \
  < ssl.log | \
  awk '$7 == "self signed certificate"' | \
  grep -v '\.corp\|\.internal\|\.local'
```

Also flag connections where `server_name` (the SNI) is absent but the connection is
to port 443: legitimate HTTPS from browsers always sends SNI; a beacon that does not
send SNI is using a non-browser HTTP stack.

```bash
zeek-cut ts id.orig_h id.resp_h id.resp_p server_name \
  < ssl.log | \
  awk '$5 == "-" && $4 == "443"'
```

## HTTP beacon pattern recognition in proxy logs

Hypothesis: a C2 beacon is communicating over HTTP/HTTPS through the organisation's
web proxy, producing a regular GET/POST alternation pattern to a single external destination.

Data sources: web proxy logs with full URL, method, response size, and timestamp;
or Zeek `http.log`.

```bash
# in Zeek http.log: find hosts making regular GETs and POSTs to the same URI
# fields: ts, uid, id.orig_h, id.resp_h, id.resp_p, method, host, uri, resp_mime_types

zeek-cut ts id.orig_h host uri method resp_body_len \
  < http.log | \
  awk '$5 == "POST" || $5 == "GET"' | \
  sort -k2,2 -k3,3 -k4,4 | \
  awk '{print $2, $3, $5}' | \
  sort | uniq -c | sort -rn | head -50
```

Sources with many POST requests to a single URI on a single destination, interleaved with
GETs to the same destination, at regular intervals are the beacon pattern. Legitimate
browser traffic goes to many different URIs and hosts; a source making repeated identical
requests to one host over hours is anomalous.

For proxy logs with timestamps, a frequency analysis per source-destination pair
identifies beaconing cadence:

```python
import sys, collections, statistics

# read proxy log lines: timestamp source_ip dest_host
# usage: cut -d' ' -f1,3,5 proxy.log | python3 this_script.py

pairs = collections.defaultdict(list)
for line in sys.stdin:
    parts = line.strip().split()
    if len(parts) >= 3:
        ts, src, dst = parts[0], parts[1], parts[2]
        pairs[(src, dst)].append(float(ts))

for (src, dst), times in pairs.items():
    if len(times) < 5:
        continue
    times.sort()
    intervals = [times[i+1] - times[i] for i in range(len(times) - 1)]
    if not intervals:
        continue
    mean = statistics.mean(intervals)
    cv = statistics.stdev(intervals) / mean if mean > 0 else 0
    if cv < 0.4 and 30 < mean < 7200:  # regular interval, 30s–2h sleep range
        print(f'{src} -> {dst}: {len(times)} requests, mean interval {mean:.0f}s, CV {cv:.3f}')
```

A CV below 0.4 with a mean interval in the range typical for C2 sleep times (30 seconds
to two hours) and more than a handful of requests is worth investigating.

## Cobalt Strike staging URI detection

Hypothesis: a Cobalt Strike stager is downloading a full payload from a staging server.

Data sources: proxy logs or Zeek `http.log` with request URI.

Cobalt Strike stagers make an HTTP or HTTPS GET request to retrieve the full beacon
payload. The staging URI in the default profile, and in many circulated malleable C2
profiles, follows specific patterns. Stagerless payloads do not make this request;
staged payloads do.

```bash
# in Zeek http.log: flag requests whose response was a Windows PE (MZ header in body)
# and whose URI path does not correspond to a known software distribution endpoint

zeek-cut ts id.orig_h host uri resp_mime_types resp_body_len \
  < http.log | \
  awk '$5 ~ /octet|executable|x-msdownload/ && $6 > 50000' | \
  grep -v 'windows\.com\|microsoft\.com\|windowsupdate\|download\.sysinternals'
```

A large binary download from an unfamiliar host, particularly outside business hours or
from a host that is not a software deployment server, is the staging signal. The same
host making a further series of regular short requests after the large download confirms
a staged beacon deployment.
