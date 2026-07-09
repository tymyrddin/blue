# API access abuse hunting

Three hunts for post-authentication API abuse: object-level authorisation bypass through
resource ID enumeration, bulk data access indicating exfiltration via the API, and token
anomalies that suggest theft and replay. These patterns are visible only in authenticated
session logs; they require knowing which identity accessed which resource, not just
whether the request was authorised.

Data source: structured JSON API access logs with authentication context. The identity
field is the resolved user or service identity, not the session token. Token theft
detection also requires an IP geolocation or ASN database.

## BOLA and object enumeration

Hypothesis: an authenticated identity is systematically accessing resources that belong
to other accounts by incrementing or enumerating object identifiers.

```bash
# count distinct resource IDs accessed per identity for a specific resource type
# adjust the path pattern to match the API's URL structure
# example: /api/v1/orders/12345 or /api/v1/users/uuid/profile
RESOURCE_PATH='/api/v1/orders/'
jq -r --arg prefix "$RESOURCE_PATH" \
  'select(.method == "GET" and .status == 200 and (.path | startswith($prefix))) |
   [.identity, (.path | split("/") | last)] | @tsv' \
  api.log | \
  sort -u | \
  awk '{count[$1]++} END {for (id in count) if (count[id] > 10) print count[id], id}' | \
  sort -rn | head -20

# review the IDs accessed by a flagged identity
IDENTITY="user_123"
jq -r --arg id "$IDENTITY" --arg prefix "$RESOURCE_PATH" \
  'select(.identity == $id and .status == 200 and (.path | startswith($prefix))) |
   .path | split("/") | last' \
  api.log | sort | head -40
```

Legitimate users access their own resources. An identity that reads hundreds of distinct
order or account records, especially in sequential or alphabetically clustered patterns,
is enumerating rather than browsing. BOLA is often silent: every request succeeds with
`200`, nothing triggers rate limits, and no anomaly is visible in isolation.

## Bulk data access

Hypothesis: a session is downloading large quantities of records through repeated paginated
requests, consistent with data exfiltration via the API.

```bash
# high record access volume per identity per hour
# assumes log entries include a record_count field; adapt if using response size instead
jq -r '[.ts[0:13], .identity, (.record_count // 1 | tostring)] | @tsv' api.log | \
  awk '{sum[$1 ":" $2] += $3}
       END {for (k in sum) if (sum[k] > 500) print sum[k], k}' | \
  sort -rn | head -20

# if record_count is not available, use response body size as a proxy
jq -r '[.ts[0:13], .identity, (.response_bytes // 0 | tostring)] | @tsv' api.log | \
  awk '{sum[$1 ":" $2] += $3}
       END {for (k in sum) if (sum[k] > 10000000) print sum[k]/1048576 "MB", k}' | \
  sort -rn | head -20

# paginated access pattern: same identity repeatedly requesting sequential pages
IDENTITY="user_123"
jq -r --arg id "$IDENTITY" \
  'select(.identity == $id and (.path | test("page=|offset=|cursor="))) |
   [.ts, .path] | @tsv' \
  api.log | sort | head -40
```

Legitimate bulk exports are typically authorised operations with a corresponding audit
trail. A session that issues fifty paginated requests to a data endpoint in ten minutes,
with no prior history of bulk access, is more likely to be extraction than coincidence.

## Token anomalies

Hypothesis: an API token has been stolen and is being replayed from infrastructure not
associated with its original issuance, while possibly still in use by the legitimate owner.

```bash
# distinct source IPs per token (or per identity) across the log period
jq -r '[.identity, .source_ip] | @tsv' api.log | \
  sort -u | \
  awk '{count[$1]++} END {for (id in count) if (count[id] > 3) print count[id], id}' | \
  sort -rn | head -20

# for a flagged identity: timeline of IPs used
IDENTITY="user_123"
jq -r --arg id "$IDENTITY" \
  'select(.identity == $id) | [.ts, .source_ip] | @tsv' \
  api.log | sort | head -40

# concurrent requests from different IPs for the same identity within a 30-second window
jq -r '[.ts[0:19], .identity, .source_ip] | @tsv' api.log | \
  sort -k2,2 -k1,1 | \
  awk '
  prev_id == $2 && $1 == prev_ts {
    if ($3 != prev_ip)
      printf "concurrent IPs: %s and %s for %s at %s\n", $3, prev_ip, $2, $1
  }
  {prev_ts=$1; prev_id=$2; prev_ip=$3}'
```

A token used from more than two distinct IP addresses in a session is suspicious unless
the service is deployed in a load-balanced environment where source NAT changes the
observed IP. Concurrent requests from different IPs for the same authenticated identity
within a short window is a stronger indicator: a single user cannot be in two places at
once at the request level.

Tokens used after their stated expiry time are either a clock skew issue or a validation
bypass. Either finding warrants investigation.
