# Monitoring and anomaly detection

Monitoring an API means more than watching for 5xx responses. Most API abuse (credential stuffing, quota
exploitation, workflow shortcutting, data enumeration) produces requests that individually look legitimate. The
signal is in the pattern across requests.

## Log targets

Log enough to reconstruct what happened: authenticated user identity (not the credential itself), endpoint path,
HTTP method, response status, response size, and request timing. Logging full request and response bodies is
expensive and creates its own data handling obligations; logging structured metadata is usually sufficient for
investigation.

Failed authentication attempts are worth logging at a higher priority: the account targeted, the source address,
and the timestamp. A sudden cluster of failures against many accounts from a single IP is credential stuffing;
many IPs against a single account is a distributed attack. Neither is visible from a single request in isolation.

## Anomaly patterns

[Business logic abuse](https://red.tymyrddin.dev/docs/in/api/notes/business-logic.html) and rate limit evasion
generate characteristic patterns:

- Requests that skip workflow steps: a state-change endpoint called without the preceding setup or read call. If
  the API has a documented flow (initiate, verify, confirm), calls that arrive out of sequence are worth flagging.
- Quota consumption that spikes and then resets in a predictable cycle. This often indicates probing against a
  fixed-window rate limit: the attacker is measuring when the window resets to time requests around it.
- Sequential object ID access from a single session: a caller stepping through `/orders/1000`, `/orders/1001`,
  `/orders/1002` is enumerating resources rather than accessing their own.
- Unusually large responses from export or search endpoints called at a high rate. This is a data exfiltration
  pattern even when the caller is authenticated.
- High request rates against authentication endpoints from many source IPs against a single account. IP-based
  rate limiting does not catch this; account-level monitoring does.

## Alerting thresholds

Thresholds that are too tight generate noise; too loose and they miss real events. Starting points worth tuning to
baseline traffic:

- More than N failed authentication attempts against a single account in M minutes.
- More than N export or bulk-read requests from a single account in an hour.
- Any request to an administrative endpoint from an account that does not hold an administrative role (in
  production, these are expected near-zero).
- Responses significantly larger than the documented maximum for an endpoint.

## Tools

AWS API Gateway paired with CloudWatch supports per-endpoint metrics and log-based alarms. The Elastic Stack (ELK)
works well for log aggregation and structured query across request metadata. Prometheus with Grafana covers the
metrics side: per-endpoint request rates, error rates, and latency distributions. Anomaly detection that requires
understanding the semantics of the request (workflow sequence, object ownership) typically needs a custom layer
on top of the metrics infrastructure.
