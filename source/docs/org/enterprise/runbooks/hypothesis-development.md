# Hypothesis development

The hypothesis is what makes chaos engineering science rather than sabotage. Anyone can delete a pod. The question that matters is: what do you expect to happen, and how will you know whether it happened? Dr. Crucible learned this at the Unseen University, where the difference between a controlled experiment and an uncontrolled one is often the difference between a publishable result and a singed laboratory. Ponder has added his own corollary: document the hypothesis before you run the experiment, so that you cannot retrospectively claim you expected the outcome all along.

## Hypothesis template

Every experiment starts with a written hypothesis using this template:

"If [failure condition], we expect [observable outcome] within [timeframe], verified by [measurement]."

The four components are mandatory:

Failure condition: what Litmus will do. Must be specific enough that someone unfamiliar with the experiment can understand exactly what is being changed.

Observable outcome: what the application should do in response. Must be specific enough to be measurable. "No user impact" is not specific enough; "HTTP 5xx rate remains below 0.1%" is.

Timeframe: how long recovery should take. Without a timeframe, a hypothesis that says "the service will recover" can be claimed as passing even after a 30-minute outage.

Measurement: the specific tool and metric that will confirm the outcome. Prometheus query, Graylog alert, Litmus ChaosExporter metric, or manual health check.

## Golem Trust hypothesis examples

Payments service pod deletion:

```
Hypothesis: payments-service pod-delete-001

If we delete 33% of payments-service pods in the production namespace,
we expect Kubernetes to reschedule the deleted pods within 60 seconds
and we expect no customer-facing errors (HTTP 5xx rate on the payments
API remains below 0.1% throughout the experiment), verified by:
  - Prometheus: rate(http_requests_total{service="payments",code=~"5.."}[1m]) < 0.001
  - Litmus ChaosExporter: experiment duration and verdict
  - Kubernetes: all pods Running within 60 seconds of deletion
```

Database connection latency:

```
Hypothesis: payments-service network-latency-001

If we inject 500ms network latency on the connection between
payments-service and payments-db for 120 seconds,
we expect the payments API to return degraded-but-successful responses
(HTTP 200 or 202 with a "degraded" flag) rather than errors,
with p99 API latency below 2000ms throughout the experiment,
verified by:
  - Prometheus: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket
    {service="payments"}[2m])) < 2.0
  - Graylog: no ERROR log entries in payments-service during experiment window
  - Manual: test payment submission returns success (not error) response
```

Region failover simulation:

```
Hypothesis: region-failover-finland-001

If the entire Finland (Hetzner NBG1) region becomes unavailable
(simulated by blocking all ingress and egress at the network level
for all Finland nodes),
we expect automated DNS failover to redirect traffic to Germany (HEL1)
within 4 minutes with no data loss (replication lag at time of failover
below 1 second) and with customer-facing error rate below 1% during
the failover window,
verified by:
  - DNS TTL propagation: verified by external DNS monitoring (UptimeRobot)
  - Prometheus: error_rate < 0.01 during experiment
  - Database: check replica lag was <= 1s at the moment of failover
    (from replication lag Prometheus metric at T-60s before failover)
  - Graylog: customer-facing error log count during failover window
```

## Hypothesis register

All hypotheses are stored at `chaos/hypotheses.md` in the `ansible-playbooks` repository. The file is structured as a YAML-formatted markdown document:

```
hypotheses:
  - id: payments-service-pod-delete-001
    service: payments-service
    experiment_type: pod-delete
    status: active
    last_run: 2026-03-16
    last_verdict: pass
    hypothesis: >
      If we delete 33% of payments-service pods in the production namespace,
      we expect Kubernetes to reschedule the deleted pods within 60 seconds
      and we expect no customer-facing errors...
    measurements:
      - tool: prometheus
        query: rate(http_requests_total{service="payments",code=~"5.."}[1m])
        threshold: "< 0.001"
      - tool: kubernetes
        check: all pods Running within 60 seconds
    notes: "Passing consistently for 4 months. No issues."

  - id: payments-service-network-latency-001
    service: payments-service
    experiment_type: network-latency
    status: failed
    last_run: 2026-02-02
    last_verdict: fail
    hypothesis: >
      If we inject 500ms network latency on the database connection...
    failure_notes: >
      Application returned HTTP 503 errors (not degraded responses) when
      latency exceeded 300ms. Circuit breaker threshold misconfigured.
      See chaos/failures.md entry CF-2026-002.
```

## Failed hypothesis register

Hypotheses that fail (the experiment revealed the outcome did not match what was expected) are documented separately at `chaos/failures.md`:

```
# CF-2026-002: payments-service circuit breaker misconfiguration

Date: 2026-02-02
Experiment: payments-service-network-latency-001
Hypothesis: Application returns degraded responses under 500ms latency
Actual outcome: Application returned HTTP 503 after 180ms latency threshold
  exceeded, rather than degraded responses

Root cause: The circuit breaker timeout was set to 200ms (default), much
  lower than the injected latency. Once latency exceeded the timeout,
  the circuit breaker opened and returned 503 to all requests.

Expected behaviour: Circuit breaker should have opened but returned a
  cached/degraded response rather than an error.

Remediation: Update payments-service circuit breaker configuration to
  return cached data on open state. Update timeout to 1000ms.
  Owner: Ponder. Target: 2026-02-16.

Status: Remediated 2026-02-14. Hypothesis re-tested 2026-03-02: pass.
```

## Hypothesis review process

Before an experiment runs in production for the first time, the hypothesis is reviewed by Ponder. The review confirms three things:

1. The hypothesis is falsifiable: there is a specific, measurable criterion for pass and fail.
2. The measurement tools are configured and accessible before the experiment starts.
3. The failure condition is specific enough that the experiment cannot be run in a way that avoids triggering the condition but still claims to test the hypothesis.

Ponder is thorough about point 3. He once spent twenty minutes asking Dr. Crucible to clarify the definition of "33% of pods" in a hypothesis until Dr. Crucible agreed that "at least one pod" was not the same thing and updated the hypothesis accordingly.
Last updated: 20 March 2026
