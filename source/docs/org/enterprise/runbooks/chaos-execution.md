# Execution procedures

The Finland datacenter simulation required three weeks of preparation, two customer notification calls, one very detailed briefing with the Royal Bank liaison, and four dry runs in staging. When the actual test ran, it completed cleanly in four minutes. Ponder said afterwards that the preparation time was well spent. Dr. Crucible said that was the point. A chaos experiment that is poorly prepared is not chaos engineering; it is just chaos. The procedures described here are what makes the difference between the two.

## Pre-execution checklist for production experiments

Before any production chaos experiment begins, four conditions must be verified. These are not suggestions; they are blocking requirements.

Condition 1: Royal Bank notification (for experiments affecting Royal Bank namespaces). The Royal Bank liaison must be notified at least 24 hours in advance. Notification is sent by Carrot, using the agreed notification template:

```
Subject: Planned resilience test notification - [DATE] [TIME] UTC

Dear [Royal Bank liaison name],

We are conducting a planned resilience test on [DATE] at [TIME] UTC.
The test will [brief description of what will happen, e.g. "simulate the
deletion of multiple service pods in the payments integration service"].

Expected customer impact: [description, e.g. "no customer-facing impact
expected; payments processing will continue normally"].
Duration: [X minutes].
Emergency contact: Ponder Stibbons, ponder@golemtrust.am, +44 XXXX XXXXXX.

Please confirm receipt of this notification.

Regards,
Captain Carrot Ironfoundersson
Head of Security Operations
Golem Trust
```

Condition 2: replication lag must be below 1 second. Chaos experiments on Kubernetes nodes should not affect database replication, but confirming lag is low before starting ensures any replication issues that exist independently of the experiment are identified before the test.

```
# Check PostgreSQL replication lag
kubectl exec -n databases deploy/postgres-primary -- \
  psql -U postgres -c "
    SELECT
      client_addr,
      state,
      sent_lsn,
      write_lsn,
      flush_lsn,
      replay_lsn,
      (sent_lsn - replay_lsn) AS replication_lag_bytes
    FROM pg_stat_replication;
  "

# Acceptable: replication_lag_bytes < 1048576 (1 MB, roughly 1 second of lag)
```

Condition 3: the on-call engineer must be available and aware. The production on-call engineer is paged before the experiment starts, acknowledges, and confirms they are available for the experiment window. If the on-call engineer cannot be reached, the experiment is postponed.

Condition 4: the rollback procedure must be documented for this specific experiment. Check `chaos/rollbacks/EXPERIMENT-ID.md` exists and was updated within the past 30 days.

## Executing an experiment via ChaosCenter

Step 1: log in to ChaosCenter at `https://litmus.golemtrust.am`. Select the appropriate chaos delegate (the Kubernetes cluster where the experiment will run).

Step 2: navigate to "Chaos Experiments" and create a new experiment. Select the experiment from the ChaosHub (public or Golem Trust private hub). Configure the ChaosEngine parameters to match the approved experiment design.

Step 3: before starting, open the monitoring dashboard in a second window. Prometheus dashboards for the target service should be visible, refreshing every 15 seconds.

Step 4: start the experiment. Record the exact start time in the experiment results template.

Step 5: monitor throughout the experiment. Watch for:
- Application error rate in Prometheus
- Pod status in Kubernetes (`kubectl get pods -n TARGET_NAMESPACE -w`)
- Application health check responses
- Graylog error stream for the target service

Step 6: at experiment end (Litmus marks ChaosEngine as "completed"), record the end time and begin the verification checklist.

## Application behaviour verification

During execution, verify application behaviour via Prometheus:

```
# Monitor error rate during experiment
watch -n 5 'kubectl exec -n monitoring deploy/prometheus -- \
  curl -s "http://localhost:9090/api/v1/query" \
  --data-urlencode "query=rate(http_requests_total{namespace=\"payments\",code=~\"5..\"}[1m])" | \
  jq ".data.result[].value[1]"'
```

And via a simple HTTP health check loop:

```
#!/bin/bash
# Run during experiment to verify service availability
while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    https://api.golemtrust.am/health)
  echo "$(date -u +%H:%M:%S) HTTP $STATUS"
  sleep 5
done
```

## Abort procedure

If the experiment must be stopped before completion (application behaving unexpectedly, Prometheus showing error rate above threshold, on-call engineer requests abort), delete the ChaosEngine resource:

```
kubectl delete chaosengine payments-service-pod-delete -n payments
```

Litmus's ChaosRevert process activates immediately when the ChaosEngine is deleted. For pod-delete experiments, Kubernetes reschedules the pods automatically; ChaosRevert confirms the target deployment returns to its desired replica count.

For network experiments (network-loss, network-latency), ChaosRevert removes the tc-netem network emulation rules that were applied. Verify by checking network latency returns to baseline:

```
kubectl exec -n payments deploy/payments-service -- \
  ping -c 5 payments-db.payments.svc.cluster.local
```

## The Finland datacenter simulation

The region failover simulation ran on 15 February 2026, a Saturday. Preparation:

- Week 1: four dry runs in staging, validating the DNS failover mechanism and documenting timing
- Week 2: dry run with the Royal Bank integration service participating (in staging)
- Week 3: customer notifications sent, Royal Bank liaison briefed, on-call roster confirmed

Execution at 02:00 UTC:

1. Dr. Crucible applied the Hetzner firewall rules that blocked all traffic to and from the Finnish region nodes. The nodes became unreachable at 02:00:14.
2. Prometheus health checks for the Finnish nodes began failing at 02:00:29.
3. The automated DNS failover triggered (the failover script monitored the health check endpoint): DNS records updated at 02:01:55.
4. DNS TTL propagated globally: verified by UptimeRobot at 02:04:08.
5. All services confirmed running in Germany by 02:05:30.

Results:

- Total failover time: 4 minutes 8 seconds
- Customer-facing impact: 4 minutes of elevated latency, zero HTTP errors
- Data loss: zero (replication lag at failover was 0.3 seconds, well within the 1-second threshold)

Issues found: DNS caching caused longer delays for approximately 12% of customers whose ISPs honour DNS TTLs above our configured 60-second TTL. This was identified from UptimeRobot probe data showing different propagation times from different probe locations. The TTL was reduced from 60 to 30 seconds as a result. The issue is documented in the rollback runbook as a known post-experiment remediation step.

## Post-execution checklist

After the experiment ends and Litmus reports the experiment as complete:

```
Post-execution checklist:
[ ] All pods in target namespace Running (kubectl get pods -n TARGET_NS)
[ ] All health check endpoints returning 200
[ ] Replication lag below 1 second
[ ] Prometheus shows no lingering elevated error rate
[ ] Graylog shows no ongoing ERROR log spike
[ ] On-call engineer confirms no open incidents related to experiment
[ ] Royal Bank liaison notified of completion (if Royal Bank namespace was involved)
[ ] Experiment results written to chaos/results/YYYY-MM-DD-EXPERIMENT-NAME.md
```
