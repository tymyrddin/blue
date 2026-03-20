# Failover automation

Runbook for the automated failover system that detects Helsinki unavailability and promotes the Nuremberg region to active. Three consecutive health check failures trigger failover. DNS TTL is set to 60 seconds, allowing traffic to shift to Nuremberg within a few minutes of the failover decision. The dragon attack exercise achieved customer-facing downtime of 11 minutes from the simulated outage; this is the target to match or improve in future exercises.

## Health check monitor

A small Hetzner CX11 instance in Frankfurt (`monitor.fra1.golemtrust.am`) runs the health check daemon. It sits outside both regions so it can observe Helsinki availability from a neutral location, avoiding split-brain where Helsinki's own monitoring cannot detect that Helsinki is down.

The monitor checks the following Helsinki endpoints every 20 seconds:

- HTTPS response from `https://api.golemtrust.am/health` (application layer)
- TCP connection to `db-01.hel1.golemtrust.am:5432` (database layer)
- HTTPS response from `https://auth.golemtrust.am/health/live` (Keycloak)

Three consecutive failures of the application endpoint, with corroborating failure of at least one other endpoint, trigger the failover sequence. This two-of-three corroboration requirement prevents a single failing health check from triggering a failover during a transient network issue.

The monitor is implemented as a systemd service running a Python script:

```
[Unit]
Description=Golem Trust failover monitor
After=network-online.target

[Service]
Type=simple
User=monitor
ExecStart=/usr/local/bin/failover-monitor
Restart=always
RestartSec=5
EnvironmentFile=/etc/failover/monitor.env

[Install]
WantedBy=multi-user.target
```

`/etc/failover/monitor.env` contains:

```
CF_API_TOKEN=<Cloudflare API token, retrieve from Vault>
CF_ZONE_ID=<Cloudflare zone ID for golemtrust.am>
VAULT_ADDR=https://vault.nbg1.golemtrust.am
VAULT_ROLE_ID=<AppRole role ID>
VAULT_SECRET_ID=<AppRole secret ID, retrieve from Vault>
PAGERDUTY_KEY=<PagerDuty integration key>
SLACK_WEBHOOK=<webhook URL>
```

## Failover sequence

When the monitor determines that Helsinki is unavailable, it executes the following steps in order:

Step 1: notify. Send an alert to PagerDuty (wakes Carrot) and post to the `#incidents` channel. The notification precedes any infrastructure changes so the on-call engineer is aware before automated changes occur.

Step 2: promote the PostgreSQL replica. Connect to `db-01.nbg1.golemtrust.am` and run:

```
pg_ctl promote -D /var/lib/postgresql/16/main
```

This terminates the replication stream and makes the Nuremberg database writable. The monitor waits for `pg_is_in_recovery()` to return `false` before proceeding.

Step 3: update Cloudflare DNS. The monitor uses the Cloudflare API to update the A records for `api.golemtrust.am`, `auth.golemtrust.am`, and `app.golemtrust.am` to point to the Nuremberg load balancer IP. DNS TTL is 60 seconds; propagation completes within 2 minutes for most resolvers:

```
curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"A\",\"name\":\"api.golemtrust.am\",\"content\":\"${NBG1_LB_IP}\",\"ttl\":60}"
```

Step 4: unseal Nuremberg Vault if needed. In normal operation, Nuremberg Vault is kept unsealed. If it has sealed itself (after a restart or error), the monitor alerts Carrot to unseal it manually. Automated unseal of a secondary Vault cluster is not configured; the risk of automated unseal outweighs the time saved.

Step 5: activate Nuremberg Kubernetes workloads. The Nuremberg Kubernetes cluster has all workloads deployed but scaled to zero replicas during standby. The monitor scales them up:

```
kubectl --context nbg1 scale deployment --all --replicas=1 -n production
```

Step 6: post a status update with the failover timeline and the actions taken.

## Preventing automatic failback

Failback (returning to Helsinki once it recovers) is never automatic. Automatic failback after a failover risks a second outage if Helsinki returns in a degraded state, and risks data divergence if both regions have accepted writes.

When Helsinki recovers, the on-call engineer initiates the failback procedure manually (see the recovery procedures runbook). The monitor continues to check Helsinki health after failover but takes no automated action on recovery.

## Circuit breaker

The monitor includes a circuit breaker that prevents repeated failover attempts. Once a failover has been triggered:

- All further automated failover actions are disabled until a human explicitly resets the monitor
- The monitor continues to log health check results
- Alerts continue to fire if Nuremberg becomes unavailable

Reset the circuit breaker after a failback is complete:

```
systemctl stop failover-monitor
rm /etc/failover/failover-triggered
systemctl start failover-monitor
```

## Testing the monitor

Test the health check logic without triggering a real failover using the dry-run flag:

```
/usr/local/bin/failover-monitor --dry-run --simulate-failure
```

This runs the full detection logic and prints the actions that would be taken, but does not execute any DNS changes, database promotions, or Kubernetes scaling. Run this test after any change to the monitor configuration.

The full failover sequence is tested during the quarterly DR exercise (see DR testing procedures).
