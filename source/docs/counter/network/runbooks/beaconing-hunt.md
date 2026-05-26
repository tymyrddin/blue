# Beaconing and C2 channel detection

Four hunts for network-level indicators of command and control communication:
high-frequency outbound connections, consistent beacon intervals, TLS client fingerprinting,
and protocol-port mismatches. The network layer view complements endpoint-side C2 detection
with evidence that survives endpoint log gaps and is harder for an attacker to suppress.

Data source: Zeek `conn.log` and `ssl.log`. The hunts assume log files in the current
directory; adjust paths to match the collection environment. Compressed logs can be
piped via `zcat`.

## High-frequency outbound connections

Hypothesis: a beacon is checking in periodically, producing many short connections to the
same external address.

```bash
# connections per source/destination/port, excluding RFC 1918 destinations
zeek-cut id.orig_h id.resp_h id.resp_p < conn.log | \
  awk '!/^#/ && $2 !~ /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/' | \
  sort | uniq -c | sort -rn | head -30
```

A workstation with hundreds of connections to a single external IP on an unusual port is
worth investigating. Software update services, NTP, and time synchronisation appear in
the same list and can be suppressed once confirmed legitimate.

## Consistent connection intervals

Hypothesis: an implant is beaconing at a fixed interval with low timing variance, a
pattern that distinguishes automated check-ins from human-driven browsing.

```bash
# write sorted connection data to a temp file, then analyse with Python
zeek-cut ts id.orig_h id.resp_h id.resp_p < conn.log | \
  awk '!/^#/' | sort -k2,2 -k3,3 -k4,4 -k1,1n > /tmp/conn_sorted.txt

python3 << 'EOF'
import math

pairs = {}
with open('/tmp/conn_sorted.txt') as f:
    for line in f:
        parts = line.split()
        if len(parts) < 4:
            continue
        ts, src, dst, port = parts[:4]
        pairs.setdefault((src, dst, port), []).append(float(ts))

for (src, dst, port), times in pairs.items():
    if len(times) < 10:
        continue
    intervals = [times[i+1] - times[i] for i in range(len(times)-1)]
    mean = sum(intervals) / len(intervals)
    if mean == 0:
        continue
    stddev = math.sqrt(sum((x - mean)**2 for x in intervals) / len(intervals))
    cv = stddev / mean
    if cv < 0.2:
        print(f"CV={cv:.3f}  count={len(times)}  interval={mean:.1f}s  {src} -> {dst}:{port}")
EOF

rm -f /tmp/conn_sorted.txt
```

A coefficient of variation below 0.2 across ten or more connections is unusual for
legitimate traffic. Browser and application connections have high interval variance; a
beacon sleeping for exactly 60 seconds has near-zero variance. Some C2 frameworks add
jitter to raise the CV; the threshold for suspicion rises accordingly, but the
interval distribution remains distinct from organic traffic.

## TLS fingerprinting

Hypothesis: a C2 implant is presenting a recognisable TLS client hello that can be
fingerprinted regardless of the destination hostname or IP.

```bash
# JA3 fingerprints seen in ssl.log, sorted by frequency
zeek-cut id.orig_h id.resp_h server_name ja3 < ssl.log | \
  awk '!/^#/ && $4 != "-" {print $4, $1, $2, $3}' | \
  sort | uniq -c | sort -rn | head -30

# check against hashes associated with known C2 defaults
# Cobalt Strike default profile:  72a589da586844d7f0818ce684948eea
# Metasploit Meterpreter default: c1b547cba89e2579e772d2e67b898c85
for hash in \
  72a589da586844d7f0818ce684948eea \
  c1b547cba89e2579e772d2e67b898c85; do
  result=$(zeek-cut id.orig_h id.resp_h server_name ja3 < ssl.log | \
    awk -v h="$hash" '!/^#/ && $4 == h {print $1, $2, $3}')
  [ -n "$result" ] && echo "=== $hash ===" && echo "$result"
done
```

JA3 hashes are bypassable: a motivated attacker randomises the TLS client hello. Their
value is catching frameworks using default configurations, which describes a large
proportion of intrusions in practice. The hash is a property of the client library and
settings, not the payload; changing it requires recompiling or reconfiguring the implant.

## Protocol-port mismatches

Hypothesis: C2 traffic is disguised on port 80 or 443 but carries a binary protocol that
does not match the expected service.

```bash
# service type identified by Zeek on common web ports
zeek-cut id.orig_h id.resp_h id.resp_p service < conn.log | \
  awk '!/^#/ && $4 != "-" && $4 != "" {
    port = $3
    svc  = $4
    if ((port == "443" && svc != "ssl") ||
        (port == "80"  && svc != "http"))
      printf "port=%s service=%s  %s -> %s\n", port, svc, $1, $2
  }' | sort | uniq -c | sort -rn | head -20

# connections on uncommon ports with significant data transfer
zeek-cut id.orig_h id.resp_h id.resp_p orig_bytes resp_bytes < conn.log | \
  awk '!/^#/ &&
       $3 !~ /^(80|443|22|53|25|587|465|143|993|110|995|21|3306|5432|3389|8080|8443)$/ &&
       ($4 + $5) > 100000 {
    print $3, $4+$5, $1, $2
  }' | sort -k2 -rn | head -20
```

A service value of `dtls`, an empty string, or a protocol name inconsistent with the port
is worth a second look. Zeek's protocol detection is not perfect, but a connection on port
443 that does not complete a TLS handshake is a reliable anomaly.
