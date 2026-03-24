# Exfiltration hunting

Proactively hunting for data exfiltration in progress or recently completed,
before the impact phase begins.

## Hunt 1: DNS tunnelling indicators

```bash
# Zeek: identify sources with high DNS query volume to a single domain
zeek-cut ts id.orig_h query -d '\t' < dns.log |
  awk '{
    split($3, p, ".");
    n = length(p);
    if (n >= 2) {
      sld = p[n-1] "." p[n];
      count[$2 ":" sld]++;
      last_ts[$2 ":" sld] = $1
    }
  }
  END {
    for (k in count)
      if (count[k] > 300)
        printf "%s queries=%d last=%s\n", k, count[k], last_ts[k]
  }' | sort -t= -k2 -rn | head -20
```

```bash
# calculate average subdomain label length per source
# DNS tunnelling uses long, encoded subdomains
zeek-cut id.orig_h query -d '\t' < dns.log |
  awk '{
    split($2, p, ".");
    maxlen = 0;
    for (i=1; i<length(p)-1; i++)
      if (length(p[i]) > maxlen) maxlen = length(p[i]);
    if (maxlen > 40) print $1, $2, maxlen
  }' | sort -k3 -rn | head -20
```

## Hunt 2: Rclone or sync tool on endpoints

```powershell
# fleet-wide: check for Rclone, MEGAsync, or similar tools
# (use EDR query or Velociraptor)
Invoke-Command -ComputerName $allHosts -ScriptBlock {
    $tools = @('rclone.exe', 'megatools.exe', 'mega-cmd.exe', 'MEGAsync.exe')
    foreach ($tool in $tools) {
        $found = Get-Process -Name ($tool -replace '\.exe','') -ErrorAction SilentlyContinue
        if ($found) { Write-Output "$env:COMPUTERNAME: $tool running" }
        $path = Get-ChildItem -Path C:\,C:\Temp,$env:LOCALAPPDATA -Recurse `
                  -Filter $tool -ErrorAction SilentlyContinue
        if ($path) { Write-Output "$env:COMPUTERNAME: $tool found at $($path.FullName)" }
    }
}
```

## Hunt 3: cloud upload volume anomalies

```powershell
# Microsoft 365: identify users with high upload volume this week
$startDate = (Get-Date).AddDays(-7)

$uploads = Search-UnifiedAuditLog `
  -StartDate $startDate -EndDate (Get-Date) `
  -Operations 'FileUploaded','FileSyncUploadedFull' |
  ForEach-Object {
    $data = $_.AuditData | ConvertFrom-Json
    [PSCustomObject]@{
        User    = $_.UserIds
        Date    = $_.CreationDate.Date
        Size    = $data.FileSizeBytes
    }
  }

$uploads |
  Group-Object -Property User |
  ForEach-Object {
    [PSCustomObject]@{
        User      = $_.Name
        FileCount = $_.Count
        TotalMB   = [math]::Round(($_.Group | Measure-Object Size -Sum).Sum / 1MB, 1)
    }
  } |
  Where-Object { $_.TotalMB -gt 500 } |  # flag users with >500MB uploaded
  Sort-Object TotalMB -Descending
```

## Hunt 4: network traffic to cloud storage from unexpected hosts

```bash
# identify production servers (not workstations) uploading to cloud storage
# production servers should not be initiating outbound uploads to consumer cloud
grep -E 's3\.amazonaws\.com|storage\.googleapis\.com|dropbox\.com|mega\.nz' \
  /var/log/firewall/allowed.log |
  awk '{print $5, $7, $9}' |  # src_ip, dst_ip, bytes
  sort -k3 -rn |
  head -30
# cross-reference src_ip against known workstation vs server subnets
```

## Hunt 5: covert channel indicators

```bash
# unusual GitHub push volume from non-developer systems
grep 'github.com' /var/log/proxy/access.log |
  grep 'POST\|PUT' |
  awk '{print $3, $7}' |  # timestamp, URL
  sort | uniq -c |
  awk '$1 > 10 {print}' |  # flag IPs with >10 pushes
  sort -rn | head -20
```

```bash
# Slack file upload API calls from endpoint IPs (not Slack desktop app servers)
grep 'api.slack.com/api/files.upload' /var/log/proxy/access.log |
  awk '{print $3}' |  # source IP
  sort | uniq -c | sort -rn | head -20
# cross-reference against known Slack server IPs
```

## Hunt 6: encrypted archive creation followed by outbound transfer

```powershell
# Sysmon: look for zip/7z/rar archive creation shortly before unusual outbound
# Event ID 11: file created with .zip, .7z, .tar.gz extension in temp directories
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' |
  Where-Object {
    $_.Id -eq 11 -and
    $_.Message -match '\\Temp\\.*\.(zip|7z|gz|enc|tar)$'
  } |
  Select-Object TimeCreated,
    @{N='File'; E={($_.Message | Select-String 'TargetFilename: (.+)').Matches.Groups[1].Value}} |
  Format-Table
# then check for outbound network connections from the same process in the next 30 minutes
```

## Triage workflow

When an exfiltration hunt produces a hit:

1. Identify the source host, identity, and approximate data volume
2. Determine the destination: which cloud account, which external IP?
3. Check whether the destination is attacker-controlled or a legitimate
   business account (verify with the user if possible)
4. Check whether the source file(s) have been deleted from the host
   (suggests cleanup; exfiltration was intentional)
5. Check persistence mechanisms on the host (exfiltration often occurs
   after persistence is established, not before)
6. Estimate whether this is an isolated event or part of an ongoing campaign
7. Preserve all relevant logs before any remediation that might clear them
