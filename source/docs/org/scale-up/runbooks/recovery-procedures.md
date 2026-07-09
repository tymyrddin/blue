# Recovery procedures

Runbook for restoring normal operations after a failover. When Helsinki recovers from an outage, Nuremberg is the active region. The recovery procedure re-establishes Helsinki as primary, resynchronises the database, and fails traffic back. This is never automated; a human must initiate and supervise each step. The risk of automated failback causing a second outage or data divergence outweighs the convenience.

## Before starting recovery

Do not begin recovery until Helsinki is confirmed stable. A region that recovers and immediately fails again will leave the infrastructure in a worse state than staying on Nuremberg. Confirm:

- Helsinki health checks are passing consistently for at least 15 minutes
- The root cause of the outage is identified and resolved (or accepted as transient)
- No ongoing incident affects Helsinki
- Carrot, Ponder, and Ludmilla are available (recovery is a three-person operation)
- Nuremberg replication lag is noted (it will be the data loss baseline for the re-sync)

Announce the start of recovery in `#incidents`.

## Step 1: assess data divergence

While Nuremberg was active, writes went to the Nuremberg PostgreSQL instance. Helsinki, when it recovers, will have an older copy of the data. The divergence period is from the moment Helsinki lost connectivity to the moment recovery begins.

On the Nuremberg PostgreSQL instance, record the current WAL position:

```
psql -U postgres -c "SELECT pg_current_wal_lsn();"
```

On Helsinki, check its last known WAL position:

```
psql -U postgres -c "SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();"
```

The difference represents the transactions that occurred in Nuremberg while Helsinki was down. These must be replayed on Helsinki before it can become primary again.

## Step 2: re-establish replication with Nuremberg as temporary primary

While Nuremberg holds the authoritative data, reconfigure Helsinki as a replica of Nuremberg. This allows Helsinki to catch up by replaying the transactions that occurred during the outage.

On Helsinki's PostgreSQL instance, reconfigure it as a replica of Nuremberg:

```
systemctl stop postgresql

# Remove any existing recovery configuration
rm -f /var/lib/postgresql/16/main/standby.signal

# Take a fresh base backup from Nuremberg
pg_basebackup \
  -h db-01.nbg1.golemtrust.am \
  -U replicator \
  -D /var/lib/postgresql/16/main \
  -Fp -Xs -P -R

chown -R postgres:postgres /var/lib/postgresql/16/main
systemctl start postgresql
```

Monitor replication lag from Nuremberg to Helsinki:

```
psql -U postgres -h db-01.nbg1.golemtrust.am \
  -c "SELECT client_addr, state, pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes FROM pg_stat_replication;"
```

Wait until lag reaches zero.

## Step 3: promote Helsinki to primary

Once Helsinki has fully caught up with Nuremberg, promote it:

```
# On Helsinki:
pg_ctl promote -D /var/lib/postgresql/16/main
```

Immediately reconfigure Nuremberg as a replica of Helsinki:

```
# On Nuremberg:
systemctl stop postgresql
pg_basebackup \
  -h db-01.hel1.golemtrust.am \
  -U replicator \
  -D /var/lib/postgresql/16/main \
  -Fp -Xs -P -R
chown -R postgres:postgres /var/lib/postgresql/16/main
systemctl start postgresql
```

Verify Nuremberg is replicating from Helsinki:

```
psql -U postgres -h db-01.hel1.golemtrust.am \
  -c "SELECT client_addr, state FROM pg_stat_replication;"
```

## Step 4: update DNS to return traffic to Helsinki

Update the Cloudflare load balancer to route traffic back to Helsinki:

```
curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/load_balancers/${LB_ID}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"default_pools": ["hel1-primary-pool-id", "nbg1-fallback-pool-id"]}'
```

The pool order puts Helsinki first again as the active pool.

Confirm DNS is resolving to Helsinki from external resolvers:

```
for resolver in 1.1.1.1 8.8.8.8 9.9.9.9; do
  echo -n "$resolver: "
  dig +short api.golemtrust.am @$resolver
done
```

Wait for resolution to consistently return the Helsinki IP before proceeding.

## Step 5: scale down Nuremberg workloads

Once traffic is confirmed back on Helsinki, scale Nuremberg Kubernetes workloads back to zero:

```
kubectl --context nbg1 scale deployment --all --replicas=0 -n production
```

Leave the deployments present at zero replicas. They are ready to scale up again if another failover is needed.

## Step 6: reset the failover monitor

Re-enable automated failover by resetting the monitor's circuit breaker on the Frankfurt instance:

```
systemctl stop failover-monitor
rm /etc/failover/failover-triggered
systemctl start failover-monitor
```

Verify the monitor is checking Helsinki health and that health checks are passing:

```
journalctl -fu failover-monitor | head -20
```

## Step 7: post-recovery review

Within 24 hours, complete a post-recovery review:

- Total outage duration (T_failover to T_recovery)
- Data loss, if any (transactions in Nuremberg that required replay)
- Root cause confirmed and remediated
- Any steps in the recovery procedure that were unclear or slow
- Update this runbook if the procedure required improvisation

Post a summary in `#incidents` and close the incident. Notify the Royal Bank of Ankh-Morpork liaison of the recovery and provide the outage summary and root cause.
Last updated: 20 March 2026
