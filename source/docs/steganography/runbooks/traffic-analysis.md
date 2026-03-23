# Runbook: network traffic analysis for steganographic channels

Identifying steganographic C2 or exfiltration channels in captured network traffic.
The goal is not to decode the hidden content (which may require the key) but to confirm
that a covert channel exists, identify the endpoints, and scope the timeframe.

## Collect and prepare traffic data

Full packet capture is ideal; NetFlow or proxy logs are the minimum.

For proxy logs, ensure image MIME types are logged. Most enterprise web proxies log
`Content-Type` headers; filter for `image/jpeg`, `image/png`, `image/gif`, and
`application/octet-stream` responses from image hosting domains.

For packet capture, extract image files from HTTP/HTTPS traffic using NetworkMiner or
tcpflow:

```text
# extract all files from pcap
networkminercli -r capture.pcap -o ./extracted/

# extract HTTP objects
tshark -r capture.pcap --export-objects http,./http_objects/
```

For HTTPS traffic without decryption capability, limit analysis to metadata: IP, port,
timing, response sizes, request frequency.

## Identify candidate endpoints

Query proxy logs for endpoints that retrieved image files from external hosts. Filter for
anomalies:

Non-browser user agents retrieving images:

```text
cat proxy.log | awk '{print $5, $7, $10}' \
  | grep -iE "image/(jpeg|png|gif)" \
  | grep -v -iE "Mozilla|Chrome|Safari|Firefox|Edge" \
  | sort | uniq -c | sort -rn
```

Unusual source processes making image requests are a primary indicator. Python's
`urllib.request`, `curl`, and custom agents retrieve images but are not browsers.

High-frequency requests to the same image URL:

```text
cat proxy.log | awk '{print $3, $7}' | sort | uniq -c | sort -rn | head -50
```

A URL that is requested 24 times in 24 hours at regular intervals is not browsing
behaviour.

## Analyse timing patterns

Extract timestamps for requests to a candidate URL and plot the inter-request interval:

```python
import re
from datetime import datetime
import statistics

url = 'https://target-domain.com/path/image.jpg'
timestamps = []

with open('proxy.log') as f:
    for line in f:
        if url in line:
            # adjust regex to match your log format
            m = re.search(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', line)
            if m:
                timestamps.append(datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S'))

if len(timestamps) > 2:
    intervals = [(timestamps[i+1]-timestamps[i]).seconds for i in range(len(timestamps)-1)]
    print(f'Mean interval: {statistics.mean(intervals)}s')
    print(f'StdDev: {statistics.stdev(intervals)}s')
    print(f'Min/Max: {min(intervals)}s / {max(intervals)}s')
```

A low standard deviation relative to the mean indicates a programmatic polling interval.
Human browsing does not repeat to the same URL at consistent second-level intervals.

## Analyse response sizes

For a steganographic C2 channel, the controller posts a new image each time a command
changes. Images with different payloads at the same URL will have slightly different file
sizes (steghide changes the JPEG structure slightly per embedding). Log and compare
response sizes for repeated requests to the same URL:

```text
tshark -r capture.pcap -Y "http.response_code == 200" \
  -T fields -e frame.time -e http.request.uri -e http.content_length \
  | grep "image.jpg"
```

Varying `Content-Length` values for the same URL over time confirm the image is changing.
A static file served from cache will have the same size each time.

## Extract and analyse captured images

Once candidate images are extracted from traffic, run the image analysis runbook on each.

For bulk processing of extracted JPEGs with Aletheia:

```text
aletheia auto-test --dir ./http_objects/ --output traffic_analysis.csv
cat traffic_analysis.csv | awk -F',' '$2 > 0.5' | sort -t',' -k2 -rn
```

Flag all images scoring above 0.5 on any model for manual review and extraction attempts.

## DNS analysis

Check DNS logs for the affected endpoint over the same time period. Steganographic
channels sometimes use DNS for return traffic (result exfiltration) while using image
polling for command delivery.

```text
# extract DNS queries from the endpoint's IP
tshark -r capture.pcap -Y "ip.src == ENDPOINT_IP && dns.flags.response == 0" \
  -T fields -e frame.time -e dns.qry.name \
  | awk '{print $2}' | sort | uniq -c | sort -rn | head -50
```

Look for domains queried frequently with long random-looking subdomains. Calculate the
entropy of subdomain labels to distinguish data-carrying subdomains from normal traffic:

```python
import math, collections

def entropy(s):
    counts = collections.Counter(s)
    total = len(s)
    return -sum((c/total) * math.log2(c/total) for c in counts.values())

# high entropy (>4.0 bits/char) on long subdomains suggests encoded data
```

## Scope the incident

Once a covert channel is confirmed, determine:

- First and last observed request to the polling URL (operational window)
- Number of distinct images retrieved (lower bound on number of commands issued)
- Whether return traffic was identified (DNS, secondary HTTP) and its volume
- Other endpoints in the same network that accessed the same URL

The image count gives a minimum bound on C2 activity; the actual number of commands may
be lower if not every image change represents a new command.

Report the polling URL, the endpoint IP, the time range, and any DNS or secondary return
channel identified. Preserve all captured images and traffic for forensic analysis.
