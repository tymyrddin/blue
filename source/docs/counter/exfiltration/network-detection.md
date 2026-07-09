# Network and behavioural detection

When file-level steganalysis is unreliable, detection shifts to network traffic patterns,
endpoint behaviour, and cross-correlation across multiple signals. An attacker using
steganographic channels still has to transfer files, run tools, and use the extracted
content: each of those steps leaves traces.

## Traffic pattern indicators

Steganographic C2 channels depend on periodic polling. The implant retrieves a new image
at regular intervals to check for commands. This periodicity is detectable in NetFlow
or proxy logs even when the content is encrypted or appears normal.

Look for:

- An endpoint making HTTP or HTTPS requests to the same URL or domain at regular intervals
  (every hour, every 24 hours) over multiple days
- Requests that consistently return an image file type (JPEG, PNG) but originate from a
  process that is not a browser or known application
- Low-volume, regular outbound requests to image hosting services (Imgur, Flickr, Discord
  CDN) from endpoints that do not have a business reason to access them

Zeek/Bro can extract this pattern from packet captures:

```text
zeek -r capture.pcap
cat http.log | zeek-cut ts host uri resp_mime_types \
  | awk '$4 ~ /image/' \
  | sort -k2,2 -k1,1n
```

Look for the same host appearing at consistent time intervals.

## DNS indicators

DNS exfiltration and DNS-based C2 produce distinct patterns. Standard user DNS traffic
has a relatively flat subdomain distribution (www, mail, cdn, api). Steganographic DNS
channels produce subdomains that are long, random-looking base32 or base64 strings.

Extract and inspect subdomains from DNS logs:

```text
tshark -r capture.pcap -T fields -e dns.qry.name \
  | grep -v "^$" \
  | awk -F'.' '{if (length($1) > 30) print}' \
  | sort | uniq -c | sort -rn
```

Subdomains longer than 30 characters are unusual. High-frequency queries to the same
second-level domain with varying long subdomains are a strong indicator.

Check for subdomains that are valid base32 or base64:

```python
import base64, sys

def is_encoded(s):
    try:
        base64.b32decode(s.upper() + '=' * (8 - len(s) % 8))
        return True
    except Exception:
        pass
    try:
        base64.b64decode(s + '=' * (4 - len(s) % 4))
        return True
    except Exception:
        pass
    return False

for line in sys.stdin:
    sub = line.strip().split('.')[0]
    if len(sub) > 20 and is_encoded(sub):
        print(line.strip())
```

## Endpoint indicators

On the endpoint, steganographic activity leaves artefacts that are independent of the
carrier content:

Tool presence: `steghide`, `zsteg`, `stegseek`, `outguess`, and Python packages such as
`stegano`, `steganography`, and `piexif` are not standard enterprise software. Their
presence on a managed endpoint warrants investigation.

```text
# Windows: check for common stego tools
Get-ChildItem -Path C:\Users -Recurse -Include steghide.exe,zsteg.exe -ErrorAction SilentlyContinue

# Linux
find /home /tmp /var -name steghide -o -name zsteg 2>/dev/null
pip list 2>/dev/null | grep -iE "steg|steganography"
```

Process behaviour: an implant polling a URL, writing a temporary image file, running
steghide, and deleting the output file creates a characteristic sequence of file system
and process events. EDR tools that log process creation and file writes can surface this
pattern in their timeline view.

Temporary image files: extraction typically writes the payload to a temp file. Short-lived
files in `%TEMP%` or `/tmp` with image extensions followed immediately by deletion are
worth catching. Sysmon rule example:

```xml
<RuleGroup name="StegExtract" groupRelation="and">
  <FileCreate onmatch="include">
    <TargetFilename condition="contains">\Temp\</TargetFilename>
    <TargetFilename condition="end with">.jpg</TargetFilename>
  </FileCreate>
</RuleGroup>
```

## Correlating signals

No single indicator is conclusive. The useful detection posture correlates:

- Periodic image retrieval from a non-browser process (network signal)
- Stego tool or library present on the same endpoint (endpoint signal)
- Unusual process or network activity shortly after each retrieval (post-extraction signal)

A SIEM query that joins these three within a time window will produce a small, high-quality
alert set. Tune the time window to the polling interval; a 1-hour polling channel means
joining events within a 5-minute window around each polling event.

## What to collect for investigation

When a suspected steganographic channel is identified:

1. Capture the image files at the network level (proxy logs, full packet capture) for
   steganalysis.
2. Collect a memory image or process dump from the endpoint to look for decryption keys
   and extracted payloads in memory.
3. Preserve DNS query logs covering the period of activity for subdomain analysis.
4. Extract the browser history and download history from the affected endpoint to understand
   the full scope of retrieved content.
Last updated: 09 June 2026
