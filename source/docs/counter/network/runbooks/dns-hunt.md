# DNS anomaly hunting

Five hunts for DNS-based attack activity: query volume concentration, long and high-entropy
subdomain labels, TXT and NULL record abuse, and NXDomain rate anomalies that indicate
domain generation algorithm use. DNS tunnelling and C2-over-DNS leave characteristic marks
in resolver logs; the hunts below operationalise the detection patterns from the network
notes.

Data source: Zeek `dns.log`. Queries are filtered to exclude RFC 1918 reverse lookups
(`in-addr.arpa`) and IPv6 reverse lookups (`ip6.arpa`) where noted, as these add volume
without signal.

## Query volume per host per base domain

Hypothesis: a host is sending an elevated volume of queries to a single authoritative
domain, consistent with DNS tunnelling or C2 beaconing over DNS.

```bash
# queries per source host per base domain (last two labels)
zeek-cut id.orig_h query < dns.log | \
  awk '!/^#/ && $2 !~ /\.(arpa|local)$/ {
    n = split($2, parts, ".")
    base = (n >= 2) ? parts[n-1] "." parts[n] : $2
    print $1, base
  }' | sort | uniq -c | sort -rn | head -30
```

Legitimate DNS generates queries across many base domains. A single host generating
hundreds of queries to one domain that is not a recognised CDN or update service
warrants investigation.

## Long subdomain labels

Hypothesis: data is being encoded in subdomain names and transmitted in DNS queries.
DNS tunnelling tools split payloads into subdomain labels; label lengths routinely exceed
what any legitimate application generates.

```bash
# queries containing labels longer than 40 characters
zeek-cut id.orig_h query < dns.log | \
  awk '!/^#/ && $2 !~ /\.(arpa|local)$/' | \
  python3 -c '
import sys
for line in sys.stdin:
    parts = line.strip().split(None, 1)
    if len(parts) < 2:
        continue
    host, query = parts
    for label in query.split(".")[:-2]:
        if len(label) > 40:
            print(len(label), host, query)
            break
' | sort -rn | head -30
```

A label length above 40 characters has no legitimate explanation in practice. DNS tunnelling
tools like `iodine` and `dns2tcp` produce labels of 60 characters or more.

## High-entropy subdomain labels

Hypothesis: randomly generated or encoded subdomain names are being used for C2 or
exfiltration. Legitimate subdomains are short and human-readable; encoded data produces
labels with Shannon entropy above 3.5 bits per character.

```bash
zeek-cut id.orig_h query < dns.log | \
  awk '!/^#/ && $2 !~ /\.(arpa|local)$/' | \
  python3 -c '
import sys, math, collections
for line in sys.stdin:
    parts = line.strip().split(None, 1)
    if len(parts) < 2:
        continue
    host, query = parts
    for label in query.split(".")[:-2]:
        if len(label) < 8:
            continue
        freq = collections.Counter(label)
        entropy = -sum((c/len(label)) * math.log2(c/len(label)) for c in freq.values())
        if entropy > 3.5:
            print(f"{entropy:.2f}  {host}  {query}")
            break
' | sort -rn | head -30
```

An entropy threshold of 3.5 bits per character filters most legitimate subdomains while
flagging base32- and base64-encoded payloads. Adjust the threshold based on the
environment: environments with many CDN or analytics subdomains may need a higher value
to reduce noise.

## TXT and NULL record queries

Hypothesis: a tool is using TXT or NULL DNS record types to carry payload data. These
record types have no routine use in standard applications and appear in DNS tunnelling
tools including `dnscat2`.

```bash
zeek-cut id.orig_h query qtype_name < dns.log | \
  awk '!/^#/ && ($3 == "TXT" || $3 == "NULL") && $2 !~ /\.(arpa|local)$/' | \
  sort | uniq -c | sort -rn | head -20
```

A single TXT query for a domain not associated with email infrastructure (SPF, DKIM) or
certificate validation (ACME) is unusual. Repeated TXT queries to the same domain from
the same host, especially with long subdomain labels, is a reliable indicator.

## NXDomain rate and DGA patterns

Hypothesis: a host is querying algorithmically generated domain names, most of which do
not resolve, producing an elevated NXDomain rate. Domain generation algorithms use this
pattern to make C2 infrastructure harder to block; the generating host produces many
failed lookups before finding an active C2 domain.

```bash
# NXDomain rate per source host (flag hosts where >50% of queries return NXDOMAIN)
zeek-cut id.orig_h rcode_name < dns.log | \
  awk '!/^#/ {
    total[$1]++
    if ($2 == "NXDOMAIN") nx[$1]++
  }
  END {
    for (h in total) {
      if (total[h] < 50) continue
      rate = nx[h] / total[h]
      if (rate > 0.5)
        printf "%.0f%%  NX=%d  total=%d  %s\n",
               rate*100, nx[h], total[h], h
    }
  }' | sort -rn | head -20

# high-volume unique subdomain queries to the same base domain (DGA volume check)
zeek-cut id.orig_h query < dns.log | \
  awk '!/^#/ && $2 !~ /\.(arpa|local)$/ {
    n = split($2, parts, ".")
    base = (n >= 2) ? parts[n-1] "." parts[n] : $2
    seen[$1, base, $2]++
  }
  END {
    for (key in seen) {
      split(key, k, SUBSEP)
      count[k[1], k[2]]++
    }
    for (key in count) {
      if (count[key] > 100) {
        split(key, k, SUBSEP)
        printf "%d unique subdomains  %s -> %s\n", count[key], k[1], k[2]
      }
    }
  }' | sort -rn | head -20
```

A legitimate host querying the same base domain 100+ times with different subdomains is
unusual. CDNs and analytics platforms do generate many subdomains, but they resolve
successfully; the combination of high unique subdomain count and a high NXDomain rate
for the same base domain is the stronger indicator.
