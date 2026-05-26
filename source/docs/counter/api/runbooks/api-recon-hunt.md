# API recon and enumeration hunting

Three hunts for early-stage API attack activity: endpoint enumeration from error response
patterns, authentication probing from repeated failure sequences, and schema extraction
attempts against GraphQL APIs. All three are detectable in API access logs before any
exploitation attempt succeeds.

Data source: structured JSON API access logs. The queries below use `jq` to filter and
extract fields. Adjust field names to match the logging format in use. Minimum required
fields per log entry: timestamp, source IP, authenticated identity, HTTP method, request
path, response status code.

A log entry format assumed throughout:

```json
{"ts":"...","source_ip":"1.2.3.4","identity":"user_123","method":"GET",
 "path":"/api/v1/users/456","status":404,"user_agent":"..."}
```

## Endpoint enumeration

Hypothesis: an automated tool is walking a wordlist against the API, producing a burst
of requests to non-existent paths from a single source.

```bash
# source IPs with many distinct 404/405 responses in a single log file
jq -r 'select(.status == 404 or .status == 405) | [.source_ip, .path] | @tsv' api.log | \
  sort -u | \
  awk '{count[$1]++} END {for (ip in count) if (count[ip] > 30) print count[ip], ip}' | \
  sort -rn | head -20

# examine the paths requested by a flagged IP
IP="1.2.3.4"
jq -r --arg ip "$IP" \
  'select(.source_ip == $ip and (.status == 404 or .status == 405)) | .path' \
  api.log | sort | head -40
```

Wordlist-based enumeration concentrates on common framework paths (`/admin`, `/api/v2`,
`/graphql`, `/.env`, `/swagger.json`, `/actuator`). A run of path fragments that look
like a security scanner wordlist alongside many `404` responses is distinct from a
legitimate client that occasionally hits a moved endpoint.

## Authentication probing

Hypothesis: an attacker is spraying credentials or API keys against an authentication
endpoint, producing many `401` responses across multiple identities from the same source.

```bash
# source IPs with high 401 volume
jq -r 'select(.status == 401) | .source_ip' api.log | \
  sort | uniq -c | sort -rn | awk '$1 > 10' | head -20

# for a flagged IP: count distinct identities attempted and timing
IP="1.2.3.4"
jq -r --arg ip "$IP" \
  'select(.source_ip == $ip and .status == 401) | [.ts, .identity] | @tsv' \
  api.log | sort

# sessions with failed attempts followed by success (credential guess success)
jq -r '[.ts, .source_ip, .identity, (.status|tostring)] | @tsv' api.log | \
  awk '
  $4 == "401" { fail[$2 ":" $3]++; last_fail_ts[$2 ":" $3] = $1 }
  $4 == "200" && fail[$2 ":" $3] > 3 {
    printf "SUCCESS after %d failures: %s identity=%s at %s\n",
           fail[$2 ":" $3], $2, $3, $1
  }'
```

A source IP producing `401` responses against more than three distinct identities within
fifteen minutes is a spray pattern. A session that produces repeated failures before a
`200` is either a user who recovered their credentials or an attacker who guessed correctly;
the subsequent activity in either case is worth reviewing.

## GraphQL schema extraction

Hypothesis: a caller is issuing introspection queries or probing field names to extract
schema information the API is not intended to disclose.

```bash
# introspection queries (production APIs should log these even if introspection is disabled)
grep -i '__schema\|__type' api.log | \
  jq -r '[.ts, .source_ip, .identity, .status] | @tsv' 2>/dev/null | \
  sort | uniq -c | sort -rn | head -20

# if logs include the request body or GraphQL operation name
jq -r 'select(.body // "" | test("__schema|__type"; "i")) |
  [.ts, .source_ip, .identity, .status] | @tsv' api.log | head -20

# field suggestion exploitation: identities generating many validation errors
jq -r 'select(.status == 400) | [.identity, .source_ip] | @tsv' api.log | \
  sort | uniq -c | sort -rn | awk '$1 > 20' | head -20
```

An introspection query in a production environment is either a misconfiguration (if it
succeeds) or active reconnaissance (if it is blocked). Both are worth knowing about.
Field suggestion exploitation is harder to detect in isolation; the combination of many
`400` responses with field name variations in the request body is the stronger pattern.
