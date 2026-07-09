# Network-level detection of evasion

When endpoint telemetry is suppressed or unavailable, network analysis is the fallback.
Traffic patterns, timing, protocol anomalies, and destination behaviour provide signals
even when payload inspection is impossible due to encryption or steganography.

## Network visibility

DNS queries: every hostname resolution is logged by a recursive resolver. DNS is
visible even when all application traffic is encrypted. The full query log reveals
what hosts were contacted, in what order, and at what frequency.

TLS metadata: even with TLS, the destination IP, Server Name Indication (SNI), and
certificate information are visible. Certificate mismatches, self-signed certificates,
or unusual certificate subjects are detectable without decrypting traffic.

Traffic volume and timing: the pattern of when connections occur and how much data
is transferred is visible regardless of encryption. Beaconing (regular small outbound
connections on a fixed interval) is a classic C2 pattern.

NetFlow: connection records (source, destination, port, bytes, duration) are available
from most network infrastructure. Aggregated flow data covers the entire network
without requiring full packet capture.

## Beaconing detection

A C2 implant that polls for commands produces a periodic connection pattern. Even
with jitter (random variation in polling interval), statistical analysis can identify
beaconing.

```python
import statistics, datetime

# given a list of connection timestamps to a specific destination:
timestamps = [...]  # Unix timestamps of observed connections

# calculate inter-arrival times
intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]

mean_interval = statistics.mean(intervals)
stdev_interval = statistics.stdev(intervals)
cv = stdev_interval / mean_interval  # coefficient of variation

print(f'Mean interval: {mean_interval:.1f}s')
print(f'Coefficient of variation: {cv:.3f}')
# CV < 0.3 suggests regular beaconing (even with jitter)
# legitimate browsing produces CV > 1.0 typically
```

Most SIEM and NDR platforms include beaconing detection algorithms. The key parameters
are the destination, the time window, and the acceptable variability threshold.

## DNS analysis

Suspicious DNS patterns:

High-entropy subdomains: DNS-based C2 encodes commands or data in subdomain labels.
These labels are long, random-looking, and different for every query.

```python
import math, collections

def dns_entropy(label):
    counts = collections.Counter(label.lower())
    total = len(label)
    return -sum((c/total) * math.log2(c/total) for c in counts.values())

# flag subdomains with entropy above 3.5 bits/character
# legitimate subdomains (mail, www, api, cdn) are low entropy
# encoded data is high entropy
```

Query volume anomalies: an endpoint that generates hundreds of DNS queries per hour
to a single domain, or queries with progressively incrementing subdomains, is likely
running DNS-based C2.

New domains: DNS requests to domains registered within the last 30 days are a risk
indicator. Attackers register new infrastructure per-operation to avoid blocklists.

```text
# zeek DNS log analysis
# zeek produces dns.log with all query/response pairs
zcat dns.log.gz | zeek-cut query | sort | uniq -c | sort -rn | head -50

# flag recently registered domains via WHOIS or third-party domain age services
# integrate with threat intel feeds for newly registered domain data
```

## TLS inspection and metadata

Without breaking TLS, metadata is still useful:

```text
# JA3 fingerprinting: fingerprint the TLS client hello
# malware often uses specific TLS library versions producing characteristic JA3 hashes
# known-bad JA3 hashes are maintained in threat intel feeds

# zeek generates ssl.log with JA3 hashes
zcat ssl.log.gz | zeek-cut ja3 ja3s server_name | sort | uniq -c | sort -rn

# flag connections to IPs without matching SNI (possible certificate misuse)
# flag self-signed certificates to external destinations
```

## Detecting steganographic C2

Steganographic C2 through image platforms is designed to be invisible to traffic
analysis. What remains detectable:

Upload/download imbalance: an implant that downloads instruction images and uploads
result images produces a specific asymmetric pattern to image hosting services.
If an endpoint downloads many images from a cloud storage API but uploads to the
same service (unusual for a browser), investigate.

Frequency analysis: image C2 polls at a semi-regular interval. Even mixed in with
legitimate image traffic, the polling frequency to a specific bucket or account may
be statistically unusual.

Content analysis: image inspection at the network perimeter (if proxied) can flag
images with high pixel entropy in the LSBs (LSB steganography produces statistical
artefacts in bit planes). This is expensive but detectable in high-value environments.

Unusual user agents: C2 polling code often uses Python requests, curl, or custom
user agent strings. Filter proxy logs for non-browser user agents making image
requests to cloud storage APIs.

## Low-and-slow exfiltration

Small-volume exfiltration over long periods produces no spike. Detecting it requires:

Baseline and anomaly: establish a per-host baseline of outbound data volume. Flag
hosts that consistently exceed their baseline by a small but sustained amount.
A host that normally transfers 50MB/day and now consistently transfers 70MB/day over
three weeks is worth investigating.

Destination consistency: legitimate user traffic goes to many different destinations.
An implant exfiltrating to a single cloud storage bucket goes to one destination
repeatedly. Long-term flow analysis identifying hosts with unusual destination
concentration is a useful signal.

```text
# netflow analysis: hosts with high volume to single destinations
# using nfdump for netflow data
nfdump -r /var/netflow/nfcapd.current -n 20 \
  -s dstip/bytes -o "fmt:%da %byt" |
  sort -k2 -rn | head -20
```
