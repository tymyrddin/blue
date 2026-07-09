# Web application scanner and recon hunting

Three hunts for automated web application recon: path enumeration from error response
patterns, scanner tool fingerprinting from user-agent strings, and credential probing
from authentication failure sequences. All three are visible in web server access logs
before exploitation begins.

Data source: nginx or Apache access logs in combined log format. Field positions used
throughout:

```
$1  source IP
$7  request path
$9  HTTP status code
$11 referer
$12 user-agent (within quotes; use grep patterns on the full line)
```

Example log line:
```
1.2.3.4 - - [26/May/2026:10:30:00 +0000] "GET /admin/config.php HTTP/1.1" 404 162 "-" "Nikto/2.1.6"
```

For JSON-structured application logs, adapt the field references to match the logging
schema. The detection logic is the same; only the field extraction changes.

## Path enumeration

Hypothesis: an automated tool is walking a wordlist against the application, producing a
burst of requests to non-existent paths from a single source.

```bash
# distinct paths returning 404 or 405 per source IP
awk '$9 == 404 || $9 == 405 {print $1, $7}' access.log | \
  sort -u | \
  awk '{count[$1]++} END {for (ip in count) if (count[ip] > 50) print count[ip], ip}' | \
  sort -rn | head -20

# examine all paths requested by a flagged IP (sorted for pattern inspection)
IP="1.2.3.4"
grep "^$IP " access.log | awk '{print $9, $7}' | sort | head -60

# requests to sensitive paths regardless of source volume
grep -E '"(GET|POST|HEAD) /(admin|\.git|\.env|backup|phpinfo\.php|wp-admin|wp-config|\.htaccess|config\.php|web\.config|actuator|swagger|api-docs|\.svn|Dockerfile|docker-compose)' \
  access.log | awk '{print $1, $7, $9}' | sort | uniq -c | sort -rn | head -30
```

Wordlist-based enumeration concentrates on common framework paths. A run of fragments
from a security scanner wordlist alongside many `404` responses is distinguishable from
a legitimate client that occasionally follows a broken link: the request timing is
machine-paced, the user-agent does not vary, and the paths follow alphabetical or
categorical wordlist order rather than organic browsing patterns.

## Scanner tool fingerprinting

Hypothesis: a known web scanner is probing the application. Many scanners use recognisable
user-agent strings even when configured to be stealthy.

```bash
# known scanner and security tool user-agents
grep -iE \
  'nikto|nmap|sqlmap|dirbuster|gobuster|ffuf|feroxbuster|nuclei|burpsuite|' \
  'zgrab|masscan|wfuzz|hydra|acunetix|nessus|openvas|zap|w3af|' \
  'python-requests|go-http-client|curl/|wget/' \
  access.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# all distinct user-agents from a flagged IP
IP="1.2.3.4"
grep "^$IP " access.log | grep -oP '"[^"]*"$' | sort | uniq -c | sort -rn

# requests with no user-agent or empty user-agent
awk '$0 ~ /" "-"$/ || $0 ~ / "-" "-"$/' access.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head -20
```

User-agent matching catches default tool configurations. A scan conducted with a browser
user-agent is invisible to this hunt; the enumeration pattern in the first hunt catches
it instead. Both hunts together cover the spectrum from default to evasion-aware scanners.

## Authentication probing

Hypothesis: an attacker is credential-stuffing or spraying against the application's
login endpoint, visible as repeated authentication failures.

```bash
# source IPs generating many 401 or 403 responses to the authentication path
# adjust the path pattern to match the application's login endpoint
grep -E '"POST /login|"POST /signin|"POST /auth|"POST /session' access.log | \
  awk '$9 == 401 || $9 == 403 {print $1}' | \
  sort | uniq -c | sort -rn | awk '$1 > 5' | head -20

# requests to the login endpoint — volume per IP regardless of status
grep -E '"POST /login|"POST /signin|"POST /auth' access.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# authentication successes following failure bursts (spray success indicator)
IP="1.2.3.4"
grep "^$IP " access.log | \
  grep -E '"POST /login|"POST /signin' | \
  awk '{print $9}' | uniq -c
```

Password spraying produces many `401` or `403` responses across a login endpoint in a
short window. Credential stuffing against a list of username/password pairs produces a
similar pattern but with a higher success rate. A source IP that produces repeated
authentication failures followed by a `200` or `302` on the login endpoint has either
guessed correct credentials or triggered a lockout bypass. The subsequent session
activity is worth reviewing.
Last updated: 10 July 2026
