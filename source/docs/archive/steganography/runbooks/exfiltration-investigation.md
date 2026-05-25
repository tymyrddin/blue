# Runbook: investigating suspected steganographic exfiltration

Responding to a suspected case where sensitive data was exfiltrated from the network by
embedding it in image or audio files uploaded to an external service. The investigation
aims to confirm the channel, estimate what was taken, and establish a timeline.

## Initial indicators

Steganographic exfiltration typically surfaces through one or more of:

- A DLP alert on an unusual upload pattern (many images uploaded in a short window)
- An EDR alert on a steganography tool running on an endpoint
- A network alert on high-volume uploads to a cloud storage or social media platform
- Discovery of encoded payload files (named unusually, in temp directories) on an endpoint

Establish which indicator triggered the investigation and which endpoint is the starting
point.

## Endpoint triage

Collect the following from the suspect endpoint before taking it offline:

Memory image. Post-extraction, the decrypted payload and the decryption key may still be
in memory. A memory image preserves these where a disk image does not.

```text
# Linux: LiME module
sudo insmod lime-$(uname -r).ko "path=/evidence/memory.lime format=lime"

# Windows: WinPmem
winpmem_mini_x64_rc2.exe memory.raw
```

File system artefacts. Look for:

```text
# Linux
find /tmp /home -name "*.jpg" -o -name "*.png" -o -name "*.wav" -newer /var/log/auth.log
ls -la /tmp/
cat ~/.bash_history | grep -iE "steghide|steg|openssl|base64"

# Windows
Get-ChildItem $env:TEMP -Include *.jpg,*.png,*.bmp,*.wav -Recurse
Get-Content (Get-PSReadlineOption).HistorySavePath | Select-String -Pattern "stegh|openssl|base64"
```

Installed tools:

```text
# Linux
which steghide stegseek zsteg outguess
pip list | grep -iE "steg|piexif|Pillow"
dpkg -l | grep -i steg

# Windows
Get-ChildItem "C:\Users" -Recurse -Include steghide.exe,zsteg.exe 2>$null
Get-Package | Where-Object Name -match "steg"
```

Browser and application history for uploads to cloud storage or social media platforms.

## Network evidence collection

Pull proxy logs and NetFlow for the suspect endpoint for the 30 days preceding the
investigation. The exfiltration window is likely shorter, but the staging and tool
installation may precede the actual upload.

Identify external destinations that received image file uploads:

```text
cat proxy.log | grep "ENDPOINT_IP" | awk '{print $1, $7, $8, $10}' \
  | grep -iE "POST|PUT" \
  | grep -iE "image/(jpeg|png|gif|bmp)|multipart" \
  | sort -k3 -rn
```

For each identified destination, extract the uploaded files from the proxy log or packet
capture if available:

```text
tshark -r capture.pcap -Y "ip.src == ENDPOINT_IP && http.request.method == POST" \
  --export-objects http,./uploads/
```

## Analyse the uploaded files

Run the image analysis runbook on each captured upload. The goal is to:

1. Confirm that payload was embedded (detection score, extraction attempt)
2. Identify the tool used (steghide, neural, LSB)
3. Recover the payload if possible

If steghide was used, attempt extraction with blank password and common passwords. If the
endpoint's bash/PowerShell history includes an openssl command with a `-k` parameter, that
may be the steghide password as well.

If extraction succeeds, document:

- The payload file type and size
- Any recovered content (credentials, documents, configuration)
- The encryption parameters if the payload itself was encrypted

If extraction fails (neural embedding, unknown key), document the detection score and the
algorithm it most closely matches.

## Estimate the scope of exfiltration

Count the number of images uploaded to the identified destinations. Each image can carry
a fixed maximum payload at a given embedding density:

| Tool | Format | Approximate capacity |
|---|---|---|
| steghide (default) | JPEG | ~15% of image file size |
| LSB (zsteg) | PNG | ~12.5% of image dimensions x 3 bits |
| StegaStamp | PNG | ~100 bits (fixed) |
| SteganoGAN (dense) | PNG | ~4.4 bits/pixel |

Multiply the number of images by the per-image capacity for the tool identified. This
gives a maximum upper bound on the data volume. The actual volume may be much lower if
the payload density was kept low for detection evasion.

If chunks were embedded (split payload across multiple images), look for sequential
naming patterns in the uploaded files or matching upload timestamps.

## Establish the timeline

Reconstruct the sequence of events:

1. When was the steganography tool installed or first run?
2. When were the carrier images acquired or generated?
3. When were the target files accessed or copied?
4. When were the uploads made?
5. When was the collection account on the receiving platform last accessed?

Cross-reference process creation logs, file access logs, and network logs to build the
timeline. Sysmon event IDs 1 (process creation), 11 (file creation), and 3 (network
connection) on Windows, or auditd records on Linux, provide the necessary data.

## Preserve evidence and report

Hash all collected files (SHA256). Package the memory image, disk image, proxy log
extracts, and recovered payloads into an evidence container with documented chain of
custody.

Report should include:

- Confirmed or probable exfiltration channel and tool
- Estimated data volume and classification
- Timeline of attacker activity
- Identified destination accounts or services
- Whether the receiving end could be identified or seized
- Recommended containment actions (revoke access, rotate affected credentials, notify
  impacted data owners)
