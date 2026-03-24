# Detecting exfiltration

## DNS-based exfiltration detection

Classic DNS tunnelling generates detectable signals: high query volume,
long subdomain strings, high entropy in subdomain portions.

```python
# detect DNS tunnelling by subdomain entropy
import math, collections

def entropy(s):
    freq = collections.Counter(s)
    return -sum(p/len(s) * math.log2(p/len(s)) for p in freq.values())

def analyse_dns_log(logfile):
    with open(logfile) as f:
        for line in f:
            # parse query name from Zeek/Suricata/dnsmasq log
            # (format varies; adjust as needed)
            parts = line.split()
            if len(parts) < 5:
                continue
            query = parts[4].rstrip('.')
            labels = query.split('.')
            if len(labels) < 3:
                continue
            subdomain = '.'.join(labels[:-2])
            e = entropy(subdomain.replace('.', ''))
            if e > 3.8 or len(subdomain) > 60:
                print(f'SUSPICIOUS: {query} (entropy={e:.2f}, len={len(subdomain)})')
```

```bash
# Zeek: count DNS queries per source per second-level domain
# flag sources with >500 queries to a single SLD in a 5-minute window
zeek-cut id.orig_h query -d '\t' < dns.log |
  awk '{
    split($2, parts, ".");
    n = length(parts);
    if (n >= 2) sld = parts[n-1] "." parts[n];
    count[$1 ":" sld]++
  }
  END { for (k in count) if (count[k] > 500) print k, count[k] }' |
  sort -k3 -rn
```

## Cloud sync tool detection

Rclone specifically generates detectable signatures:

```powershell
# Sysmon: detect rclone execution
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object {
    $_.Id -eq 1 -and
    ($_.Message -match 'rclone' -or
     $_.Message -match '\\AppData\\Local\\Temp\\.*\.exe.*s3\|.*gcs\|.*onedrive')
  } | Format-List TimeCreated, Message
```

Sigma rule for Rclone:

```yaml
title: Rclone Execution for Data Exfiltration
status: experimental
logsource:
  product: windows
  service: sysmon
detection:
  selection_image:
    EventID: 1
    Image|endswith: '\rclone.exe'
  selection_cmdline:
    EventID: 1
    CommandLine|contains:
      - 's3:'
      - 'drive:'
      - 'onedrive:'
      - 'dropbox:'
      - 'mega:'
      - '--config'
  condition: selection_image or selection_cmdline
level: high
falsepositives:
  - Legitimate IT use of Rclone for backup operations
```

## Beaconing and upload anomaly detection

```python
# detect upload volume anomalies: user uploading significantly more than baseline
import pandas as pd
from scipy import stats

# load cloud API logs (SharePoint, OneDrive, S3, etc.)
df = pd.read_csv('cloud_api_logs.csv', parse_dates=['timestamp'])
df['date'] = df['timestamp'].dt.date
df['hour'] = df['timestamp'].dt.hour

# calculate per-user daily upload volume
daily = df.groupby(['user', 'date'])['bytes_uploaded'].sum().reset_index()

# flag users where today's volume is >3 std deviations above their 30-day mean
for user, group in daily.groupby('user'):
    if len(group) < 7:
        continue
    mean = group['bytes_uploaded'].mean()
    std  = group['bytes_uploaded'].std()
    today = group.iloc[-1]['bytes_uploaded']
    if std > 0 and (today - mean) / std > 3:
        print(f'ANOMALY: {user} uploaded {today/1e6:.1f}MB today '
              f'(mean={mean/1e6:.1f}MB, z={((today-mean)/std):.1f})')
```

## DLP: cloud upload monitoring

```bash
# proxy/CASB log analysis: detect uploads to cloud storage
# filter for PUT/POST requests to known cloud storage endpoints
grep -E '(PUT|POST).*(s3\.amazonaws\.com|storage\.googleapis\.com|onedrive\.live\.com|dropboxapi\.com)' \
  /var/log/squid/access.log |
  awk '{print $7, $10}' |  # URL, bytes
  sort -k2 -rn | head -20
```

## Covert channel detection

```bash
# detect unusual Slack API usage (bot tokens making file uploads)
# Slack access logs (enterprise tier only) or endpoint proxy logs
grep 'slack.com/api/files.upload\|slack.com/api/chat.postMessage' \
  /var/log/proxy/access.log |
  awk '{print $1, $7}' |  # timestamp, URL
  sort | uniq -c | sort -rn | head -20
```

```bash
# detect git push to external repositories from production systems
# (production hosts should not be pushing to GitHub)
grep 'github.com.*git-upload-pack\|gitlab.com.*git-upload-pack' \
  /var/log/proxy/access.log
```

## Network baseline and exfiltration detection

```python
# calculate upload/download ratio per user
# legitimate users download more than they upload
# exfiltration inverts this ratio

def flag_upload_ratio(log_df, threshold=0.8):
    ratios = log_df.groupby('user').apply(lambda g: {
        'upload_bytes': g['bytes_out'].sum(),
        'download_bytes': g['bytes_in'].sum(),
        'ratio': g['bytes_out'].sum() / (g['bytes_in'].sum() + 1)
    })
    for user, data in ratios.items():
        if data['ratio'] > threshold and data['upload_bytes'] > 50_000_000:
            print(f'HIGH UPLOAD RATIO: {user}: '
                  f'{data["upload_bytes"]/1e6:.0f}MB up, '
                  f'{data["download_bytes"]/1e6:.0f}MB down, '
                  f'ratio={data["ratio"]:.2f}')
```
