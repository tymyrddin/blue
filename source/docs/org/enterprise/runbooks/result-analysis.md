# Result analysis

Dr. Crucible keeps a lab notebook. Every experiment gets an entry: the hypothesis, the execution log, the results, and the conclusion. "At the Unseen University," she says, "an experiment with no written conclusion was not an experiment. It was an anecdote." Ponder has started keeping a similar notebook. The format described here is the institutional version of that habit.

## The analysis workflow

Result analysis happens in three stages: immediate review (within 24 hours of the experiment), root cause analysis for any failures (within one week), and trend analysis across experiments (monthly).

Each stage produces a specific artefact that feeds the next one.

## Stage 1: Immediate review

Within 24 hours of experiment completion, the experiment conductor completes the post-experiment report in ChaosCenter. This captures the raw results before memory fades.

Access the experiment in ChaosCenter, open the workflow run, and download the full log:

```
curl -s https://chaos.internal.golemtrust.am/api/query \
  -H "Authorization: Bearer ${LITMUS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { getWorkflowRun(workflowRunID: \"<run-id>\") { executionData } }"
  }' | jq '.data.getWorkflowRun.executionData' > experiment-$(date +%Y%m%d)-raw.json
```

Cross-reference with Graylog for the experiment time window:

```
source:kubernetes AND level:ERROR AND timestamp:[2025-11-15T14:00:00Z TO 2025-11-15T15:00:00Z]
```

Look for: error rate spikes above baseline, latency increases beyond hypothesis thresholds, automated recovery events (pod restarts, failover triggers), and any unexpected events not related to the fault injection.

Pull the three primary metrics from Prometheus:

```
# Error rate during experiment window:
rate(http_requests_total{status=~"5.."}[5m])

# P99 latency:
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Pod restart count:
increase(kube_pod_container_status_restarts_total[1h])
```

Compare actual results against the hypothesis:

| Metric | Hypothesis | Actual | Pass/Fail |
|--------|-----------|--------|-----------|
| Pod restart time | < 30s | 18s | Pass |
| User-facing errors | 0 | 0 | Pass |
| Recovery time | < 2min | 4min 12s | Fail |

Any metric outside the hypothesis threshold is a finding. Record it with the exact observed value and the timestamp.

## Stage 2: Root cause analysis for failures

For any finding where a metric fell outside hypothesis thresholds, conduct root cause analysis within one week.

The structured format:

What happened: describe the observed failure factually. "Automatic failover to the Germany region took 4 minutes 12 seconds instead of the expected 2 minutes."

Why it happened: trace back through the evidence. "DNS TTL on the health check endpoint was set to 300 seconds. Several edge nodes had cached the old record and continued routing to Finland for up to 5 minutes after the health check failed."

What was the impact: quantify it. "Approximately 8% of users experienced elevated latency for 3-5 minutes. No errors were served; requests queued at the load balancer."

What was done: describe the fix. "DNS TTL reduced from 300 seconds to 30 seconds on the health check endpoint. Monitored for 48 hours to confirm no negative caching effects."

How to verify the fix: describe the test. "Repeat the Finland simulation in staging with the new TTL. Measure time from health check failure to complete DNS propagation. Expected: < 45 seconds."

## Confidence-building over time

Results are tracked across experiments to show improving resilience. The payments service as an example:

| Date | Experiment | Recovery time | Finding |
|------|-----------|--------------|---------|
| 2025-06 | Pod deletion | 47s | Slow restart: resource limits too low |
| 2025-07 | Pod deletion | 31s | Still above target; HPA min replicas increased |
| 2025-08 | Pod deletion | 23s | Pass |
| 2025-09 | Network latency 500ms | 0s (no impact) | Pass |
| 2025-11 | Region failover | 4min 12s | DNS TTL too high |
| 2025-12 | Region failover | 1min 08s | Pass |

Recovery time for the pod deletion scenario reduced by 51% between June and August. That improvement is directly traceable to two specific findings and their remediations. This is what the Patrician's Office wants to see when they ask whether the banking infrastructure is resilient: not assertions, but a record of finding problems and fixing them.

## Stage 3: Trend analysis

Monthly, review all experiments run in the preceding 30 days. The goal is to identify patterns that individual experiment reports do not surface.

Pull the experiment history from ChaosCenter:

```
curl -s https://chaos.internal.golemtrust.am/api/query \
  -H "Authorization: Bearer ${LITMUS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { listWorkflowRuns(projectID: \"<project-id>\", pagination: {page: 0, limit: 50}) { workflowRuns { workflowRunID workflowName phase resiliencyScore createdAt } } }"
  }' | jq '.data.listWorkflowRuns.workflowRuns'
```

Track the resiliency score over time. Litmus calculates this as the percentage of probe conditions that passed. A declining score over several months indicates systemic degradation.

Useful trend questions:

- Which namespaces or services have the most failures? (Candidate for focused reliability work.)
- Are pod deletion experiments consistently showing slow restart times? (Check resource limits and node capacity.)
- Do network latency experiments expose more failures in the payments service than in auth? (Investigate timeout configuration differences.)
- Are production experiments producing more findings than staging experiments? (Staging environment may not accurately reflect production; investigate configuration drift.)

## Monthly review meeting

The monthly chaos engineering review runs for 45 minutes and follows this agenda:

1. Resiliency score trend (5 minutes): show the score chart, note direction of travel
2. Experiments completed this month (10 minutes): one slide per experiment, pass/fail, key metric
3. Findings and remediations (15 minutes): open findings, newly closed findings, any accepted risks
4. Experiments planned next month (10 minutes): rationale, scope, customer notification required?
5. Maturity assessment update (5 minutes): are we progressing, stalled, or regressing?

Attendees: Dr. Crucible (conducts), Ponder (engineering lead), Adora Belle (sign-off authority for production experiments), on-call rotation representative. Royal Bank liaison joins quarterly.

## Reporting to stakeholders

The monthly chaos engineering summary goes to engineering leadership and, in summarised form, to the Royal Bank liaison.

```
Chaos Engineering Monthly Summary - [Month Year]

Experiments run: [N] staging, [N] production
Overall resiliency score: [X]% (previous month: [Y]%)

Key findings this month:
1. [Finding] - [Status: Fixed / In Progress / Accepted Risk]
2. [Finding] - [Status]

Experiments scheduled next month:
- [Experiment name] - [Target environment] - [Rationale]

Infrastructure confidence: [improving / stable / declining]
```

"Improving" means the resiliency score increased and at least one significant finding was remediated. "Stable" means results are consistent with prior months. "Declining" means new findings are accumulating faster than old ones are being resolved.

## Chaos maturity model

Golem Trust tracks its chaos engineering practice against five maturity levels:

| Level | Description | Status |
|-------|-------------|--------|
| 1 | Ad hoc experiments, no hypothesis, no documentation | Complete |
| 2 | Hypothesis-driven, results documented, staging only | Complete |
| 3 | Production experiments, trend analysis, stakeholder reporting | Current |
| 4 | Automated experiment scheduling, GameDays, customer participation | Q3 2026 |
| 5 | Continuous chaos, full automated resilience verification in CI | Future |

The Level 4 roadmap for Q3 2026 includes: automated weekly pod deletion in production without manual pre-approval (gate on business hours and replication lag only), a quarterly GameDay with customer observers, and Litmus integration into the deployment pipeline so that new services must pass a baseline chaos experiment before reaching production.

## Updating runbooks and hypotheses

Every finding that reveals a gap in a runbook requires a runbook update. If the Finland simulation showed that the failover runbook did not account for DNS caching delays, the failover runbook gets a new section on DNS TTL verification and a step to pre-warm DNS resolution before the test.

Updated hypotheses are recorded in the experiment definition in ChaosCenter. The old hypothesis is not deleted; it is annotated with the date and outcome. "Original hypothesis: failover in < 2 minutes. Updated after 2025-11-15 experiment: failover in < 90 seconds with DNS TTL 30s. Verified in staging 2025-11-22."

## Closing the feedback loop

The most important part of result analysis is confirming that fixes actually work. A finding that produces a ticket that closes without verification is a finding that will recur.

The verification step for each finding is scheduled as the next experiment run at the same scope. If a staging experiment found a problem and the fix was applied, the next staging run of that experiment confirms the fix. Only then is the finding marked resolved.

Dr. Crucible's rule: "We don't close a finding until we've run the experiment again and passed."
Last updated: 20 March 2026
