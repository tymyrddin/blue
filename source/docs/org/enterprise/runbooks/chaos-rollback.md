# Rollback processes

Ponder's first question about every chaos experiment is: how do we stop it? Dr. Crucible's answer is always the same: most experiments stop themselves, and all of them have a manual abort path. What Ponder wants to know, and what this runbook addresses, is what happens after the experiment stops: is the system actually back to normal, and how do you know? The post-experiment verification is as important as the experiment itself. The DNS caching issue found during the Finland simulation was not discovered during the experiment; it was discovered during the post-experiment verification, and the verification step is what made it fixable.

## Automatic rollback

For the majority of Litmus experiment types, rollback is automatic and requires no manual intervention.

Pod-delete: when the ChaosEngine completes or is deleted, the target Deployment's ReplicaSet controller immediately schedules new pods to replace any that were deleted. No manual action required; Kubernetes handles rescheduling.

Network-loss and network-latency: when the ChaosEngine completes or is deleted, the chaos pod that applied the `tc-netem` rules terminates its experiment and removes the rules. Network traffic returns to normal within seconds of experiment completion.

CPU-hog and memory-hog: the stress processes run only for the experiment duration. When the ChaosEngine completes, the stress processes are terminated and CPU and memory return to their pre-experiment levels.

Container-kill: the pod's restart policy handles this. When the container is killed, Kubernetes restarts it according to the pod's `restartPolicy` (which should be `Always` for production workloads). No manual action required.

## Manual rollback required: node-drain

The `node-drain` experiment cordons and drains a node. After the experiment completes, the node remains cordoned. Manual uncordon is required:

```
# After node-drain experiment completes
# 1. Identify the drained node (from the ChaosEngine status)
kubectl get chaosresult -n litmus -o yaml | grep -A 5 "node:"

# 2. Uncordon the node
kubectl uncordon NODE_NAME

# 3. Verify the node is Ready and accepting pods
kubectl get node NODE_NAME
kubectl get pods -A | grep NODE_NAME
```

Wait until the cluster has rescheduled evicted pods back to the uncordoned node (if resource pressure on other nodes warrants it). Confirm all deployments have reached their desired replica count:

```
kubectl get deployments -A | awk 'NR==1 || $2!=$3'
# This prints any deployment where READY != DESIRED
```

## Manual rollback required: DNS changes during region failover simulation

During the Finland simulation, DNS records are updated to point to the Germany region. When Finland is "restored" (the firewall rules are removed), DNS must be reverted to the normal multi-region configuration:

```
# Revert DNS to normal A/AAAA records (both regions)
# Using the Hetzner DNS API

# 1. Restore primary A record to Finland IP
curl -X PUT https://dns.hetzner.com/api/v1/records/RECORD_ID \
  -H "Auth-API-Token: $HETZNER_DNS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": "ZONE_ID",
    "type": "A",
    "name": "api",
    "value": "FINLAND_IP",
    "ttl": 30
  }'

# 2. Confirm propagation (wait 60 seconds minimum given 30-second TTL)
sleep 60
dig +short api.golemtrust.am @8.8.8.8
dig +short api.golemtrust.am @1.1.1.1
```

## Manual rollback required: database changes

If an experiment involves any database state changes (these are rare and require explicit authorisation), rollback requires a database snapshot restore or transaction rollback. The specific procedure depends on the change; it is documented in the experiment-specific rollback runbook at `chaos/rollbacks/EXPERIMENT-ID.md`.

## Rollback verification checklist

After any experiment (automatic or manual rollback), run the following checks:

```
Rollback verification checklist:

1. Pod health
   kubectl get pods -A | grep -v "Running\|Completed"
   Expected: no pods in Error, CrashLoopBackOff, or Pending state
   (short-lived Pending is acceptable while rescheduling occurs)

2. Deployment replica counts
   kubectl get deployments -A | awk 'NR==1 || $2!=$3'
   Expected: no output (all deployments at desired replica count)

3. Health check endpoints
   curl -sf https://api.golemtrust.am/health
   curl -sf https://payments.golemtrust.am/health
   Expected: HTTP 200 from all health endpoints

4. Replication lag
   kubectl exec -n databases deploy/postgres-primary -- \
     psql -U postgres -c "SELECT client_addr, sent_lsn - replay_lsn AS lag
       FROM pg_stat_replication;"
   Expected: lag_bytes < 1048576

5. Prometheus alerts
   Open Prometheus at https://prometheus.golemtrust.am/alerts
   Expected: no Firing alerts unrelated to the experiment
   (experiment-specific alerts may still be clearing; wait 5 minutes)

6. Graylog error rate
   Check Graylog dashboard: "Application Errors - Last 30 Minutes"
   Expected: error rate returned to pre-experiment baseline
```

If any check fails after 15 minutes, escalate to Ponder for manual pod restart and node recovery.

## Escalation to Ponder

Ponder's recovery runbook for manual pod restart:

```
# Force-delete a stuck pod
kubectl delete pod POD_NAME -n NAMESPACE --grace-period=0 --force

# If a node is stuck in NotReady state
kubectl describe node NODE_NAME  # identify the issue
# Common cause: kubelet not running; SSH to the node and restart kubelet
systemctl restart kubelet
```

## The DNS caching issue from the Finland simulation

During post-experiment verification for the Finland simulation, UptimeRobot data showed that some probes took up to 8 minutes to see the DNS change, rather than the expected 2-3 minutes. Investigation showed that several large ISPs in the Royal Bank customer base were honouring a 5-minute minimum TTL regardless of the configured 60-second TTL.

The manual rollback step added to the region failover runbook as a result:

```
Post-failover DNS verification:
1. After DNS revert, check UptimeRobot probe results from all regions
2. If any probe location shows the old IP after 5 minutes, it is likely
   using an ISP that overrides short TTLs
3. Contact UptimeRobot probe owners (automatic via UptimeRobot API) and
   confirm all probes are returning new IP within 10 minutes
4. If a probe is still returning old IP after 10 minutes, check whether
   the ISP in question is in the Royal Bank customer regions; if so,
   notify Royal Bank liaison of extended propagation for that region
```

The production DNS TTL was reduced from 60 to 30 seconds as a preventive measure. The experiment documentation was updated to include the 10-minute DNS verification window as a post-rollback step, not a post-experiment step, because the verification revealed the true propagation time rather than the assumed propagation time.

## Rollback time target

The target for returning any experiment to a fully normal state is 5 minutes from the experiment end time. This includes manual steps for node-drain and DNS changes. The target reflects Golem Trust's commitment to short experiment windows and rapid recovery, which is part of the Royal Bank SLA commitment for planned maintenance activities.
