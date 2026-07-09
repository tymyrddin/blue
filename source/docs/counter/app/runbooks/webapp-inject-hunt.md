# Web application injection hunting

Four hunts for injection probe activity in web application logs: SQL injection, server-side
template injection, path traversal and local file inclusion, and command injection. Detection
from logs is a trailing indicator (the probe has already been sent), but it provides
attribution, timing, and scope that confirm whether a vulnerability reached an exploitable
target.

Data source: nginx or Apache access logs in combined log format. URL-encoded characters
in the request path are logged as-encoded; some probes appear in decoded form, others
in encoded form or mixed. The patterns below match both where practical.

A limitation: logs capture what the server recorded in the URL and query string. Injection
payloads in POST body parameters require application-level logging of the request body.
Where application logs are available with decoded parameter values, they are more
sensitive than access logs alone.

## SQL injection probes

Hypothesis: a caller is testing parameters for SQL injection by inserting SQL syntax
into query strings or form fields that appear in the URL.

```bash
# SQL injection patterns in the request path and query string
grep -iE \
  "(%27|'|%22|\")[[:space:]]*(or|and)[[:space:]]+['\"]?[0-9]+['\"]?[[:space:]]*(=|like)|" \
  "union[[:space:]]+(all[[:space:]]+)?select|" \
  "sleep\([0-9]+\)|waitfor[[:space:]]+delay|" \
  "information_schema|sysobjects|sys\.tables|" \
  "0x[0-9a-f]{4,}|char\([0-9]+\)" \
  access.log | \
  awk '{print $1, $7}' | head -30

# encoded apostrophes and common SQLi entry points
grep -E "%27|%2527|%60|%5C" access.log | \
  awk '{print $1, $7}' | sort | uniq -c | sort -rn | head -20

# source IPs generating SQL injection indicators
grep -iE "union.*select|sleep\([0-9]+\)|0x[0-9a-f]{4,}" access.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head -20
```

Time-based blind injection probes (`SLEEP`, `WAITFOR DELAY`) generate a characteristic
response time spike if successful. Correlate flagged requests with response time logs
to identify cases where the probe may have executed.

## Server-side template injection probes

Hypothesis: a caller is injecting template syntax into parameter values to test for
SSTI. Probe payloads are distinctive: they contain template delimiters that are unusual
in legitimate input.

```bash
# template injection syntax in URLs
grep -E '\{\{.*\}\}|#\{[^}]+\}|%7B%7B|<%=|<\?php|\${[^}]+}' access.log | \
  awk '{print $1, $7}' | head -30

# common SSTI probe payloads (arithmetic expressions used to confirm execution)
grep -E '\{\{[0-9]+\*[0-9]+\}\}|\$\{[0-9]+\*[0-9]+\}' access.log | \
  awk '{print $1, $7}' | head -20

# responses to SSTI probe lines (a 200 with unexpected response size may indicate execution)
grep -E '\{\{.*\}\}' access.log | \
  awk '{print $9, $10, $1, $7}' | sort -k2 -rn | head -20
```

SSTI confirmation probes use arithmetic: `{{7*7}}` is the canonical example. An application
that returns the string `49` in a response confirms template execution. Correlation between
the probe request and the response body requires application-level logging; access logs
alone confirm the probe was sent but not whether it succeeded.

## Path traversal and local file inclusion

Hypothesis: a caller is requesting paths containing directory traversal sequences to
reach files outside the web root, or is injecting file paths into parameters to trigger
local file inclusion.

```bash
# directory traversal sequences in URLs
grep -E '(\.\.\/|\.\.\\|%2[Ee]%2[Ee]%2[Ff]|%2[Ee]%2[Ee]%5[Cc]|\.\.%2[Ff]|\.\.%5[Cc])' \
  access.log | \
  awk '{print $1, $7}' | sort | uniq -c | sort -rn | head -20

# common LFI targets
grep -iE '(/etc/passwd|/etc/shadow|/proc/self/environ|/proc/self/cmdline|' \
  'win\.ini|boot\.ini|system32|web\.config|' \
  'php://filter|php://input|data://|expect://)' \
  access.log | \
  awk '{print $1, $7}' | head -30

# requests with file parameter values that look like absolute paths
grep -iE '[?&](file|path|page|template|include|load|doc|document|folder|root)=(/|%2F|\.\.)' \
  access.log | \
  awk '{print $1, $7}' | head -20
```

Successful LFI shows as a `200` response to a path that resolves to a system file outside
the web root. The access log captures the `200` but not the file content returned;
application logging or a WAF with response inspection is required to confirm exploitation.

## Command injection probes

Hypothesis: a caller is injecting shell metacharacters into parameters to test for
command injection. The probe payloads are recognisable in URL-encoded form.

```bash
# shell metacharacters in URLs
grep -E '([;&|`$]|%3[Bb]|%7[Cc]|%26|%60|%24).*(%3[Bb]|%7[Cc]|%26|[;&|`$])' \
  access.log | \
  awk '{print $1, $7}' | head -20

# common command injection payloads
grep -E '(;[[:space:]]*(id|whoami|cat|ls|pwd|wget|curl|ping|nc )|' \
  '\|[[:space:]]*(id|whoami|cat|ls)|' \
  '`id`|`whoami`|$(id)|$(whoami))' \
  access.log | \
  awk '{print $1, $7}' | head -20

# DNS callback patterns (used by out-of-band injection testing tools like Burp Collaborator)
grep -iE 'burpcollaborator|oastify|interactsh|' \
  'nslookup|dig[[:space:]]|host[[:space:]][a-z]' \
  access.log | \
  awk '{print $1, $7}' | head -20
```

DNS callback-based injection testing does not require the response to carry the payload
output; instead it triggers an out-of-band DNS lookup to a controlled domain. The request
URL may look innocuous. The indicator is the presence of a known callback domain in any
parameter value. Detection from access logs requires the callback domain to appear in the
URL; POST-body injection evades this hunt.
Last updated: 03 June 2026
