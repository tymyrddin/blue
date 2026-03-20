# Monitoring setup

Runbook for monitoring backup health. A backup that runs silently and fails silently is not a backup; it is a comfortable illusion. Cheery Littlebottom was specific: alert if backup has not run in 24 hours, alert if backup fails, alert if restore test fails. This runbook implements all three.

## Backup status in Vault KV

Each backup script writes its status to Vault's KV engine after completing (see the restic deployment and scheduling runbooks). The key path is `kv/golemtrust/backup-status/<hostname>` with fields `last_success`, `last_failure`, and `status`.

A Prometheus exporter script reads these values and exposes them as metrics. Create `/opt/backup/backup-metrics.sh`:

```
#!/bin/bash
set -euo pipefail

export VAULT_ADDR="https://vault.golemtrust.am:8200"
export VAULT_TOKEN=$(vault write -field=token auth/approle/login \
  role_id="$(cat /etc/vault/role-id)" \
  secret_id="$(cat /etc/vault/secret-id)")

METRICS_FILE="/var/lib/node_exporter/textfile_collector/backup.prom"
TIMESTAMP=$(date +%s)

for HOST in auth db graylog-1 graylog-2 graylog-3 \
            vault-1 vault-2 vault-3 metrics; do
  STATUS=$(vault kv get -field=status "kv/golemtrust/backup-status/${HOST}" 2>/dev/null || echo "unknown")
  LAST_SUCCESS=$(vault kv get -field=last_success "kv/golemtrust/backup-status/${HOST}" 2>/dev/null || echo "1970-01-01T00:00:00+00:00")
  LAST_SUCCESS_TS=$(date -d "$LAST_SUCCESS" +%s 2>/dev/null || echo "0")
  AGE_SECONDS=$((TIMESTAMP - LAST_SUCCESS_TS))

  echo "backup_last_success_age_seconds{host=\"${HOST}\"} ${AGE_SECONDS}"
  echo "backup_status{host=\"${HOST}\",status=\"${STATUS}\"} 1"
done > "$METRICS_FILE"
```

This script is run every 15 minutes via cron on `metrics.golemtrust.am`:

```
*/15 * * * * /opt/backup/backup-metrics.sh >> /var/log/backup-metrics.log 2>&1
```

The metrics are written to the node_exporter textfile collector directory, which node_exporter picks up and exposes to Prometheus automatically. Ensure node_exporter is configured with `--collector.textfile.directory=/var/lib/node_exporter/textfile_collector` on `metrics.golemtrust.am`.

## Prometheus alert rules

Create `/etc/prometheus/rules/backup.yml`:

```
groups:
  - name: backup
    interval: 15m
    rules:

      - alert: BackupNotRunIn24Hours
        expr: backup_last_success_age_seconds > 86400
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Backup overdue for {{ $labels.host }}"
          description: >
            No successful backup for {{ $labels.host }} in the last 24 hours.
            Last success was {{ $value | humanizeDuration }} ago.
            Check /var/log/restic-backup.log on the affected host.

      - alert: BackupFailed
        expr: backup_status{status="failed"} == 1
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Backup failed for {{ $labels.host }}"
          description: >
            The most recent backup attempt for {{ $labels.host }} failed.
            Check /var/log/restic-backup.log on the affected host.

      - alert: BackupStatusUnknown
        expr: backup_status{status="unknown"} == 1
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Backup status unknown for {{ $labels.host }}"
          description: >
            No backup status has been recorded for {{ $labels.host }}.
            The backup script may never have run, or Vault KV may be unreachable.
```

Reload Prometheus after creating the rule file:

```
systemctl reload prometheus
```

These alerts route to Alertmanager and then to Slack `#infrastructure-alerts` and to Cheery's email address. Cheery requested a direct email, independent of Slack. Add her address to the Alertmanager receiver for backup alerts.

## Grafana dashboard

Add a backup status panel to the existing Grafana infrastructure dashboard. The panel shows, for each server, the age of the last successful backup and a colour indicator (green for under 25 hours, amber for 25-48 hours, red for over 48 hours).

Query for the panel:

```
backup_last_success_age_seconds
```

Use the Stat visualisation with thresholds:
- Green: 0 to 90000 (25 hours)
- Amber: 90000 to 172800 (48 hours)
- Red: 172800 and above

Adora Belle reviews this panel on Monday mornings alongside the rest of the infrastructure status. Cheery reviews it daily.

## Log rotation for backup logs

Backup logs accumulate on each server. Configure logrotate at `/etc/logrotate.d/restic-backup`:

```
/var/log/restic-backup.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    create 0640 root root
}
```

Thirty days of compressed backup logs are sufficient for debugging purposes. Failures are also recorded in the Vault KV status, which is more durable.

## Alerting on restore test failures

Restore tests are run quarterly by Cheery (see the restore procedures and testing protocols runbooks). The test result is recorded in Vault:

```
vault kv put kv/golemtrust/backup-status/restore-test \
  last_test="$(date -Iseconds)" \
  result="passed" \
  host_tested="db.golemtrust.am" \
  time_to_restore_minutes="47" \
  notes="Merchants Guild database restored successfully to staging"
```

Add a Prometheus metric for the restore test age. Add to `/opt/backup/backup-metrics.sh`:

```
RESTORE_TEST=$(vault kv get -field=last_test kv/golemtrust/backup-status/restore-test 2>/dev/null || echo "1970-01-01T00:00:00+00:00")
RESTORE_TEST_TS=$(date -d "$RESTORE_TEST" +%s 2>/dev/null || echo "0")
RESTORE_AGE=$((TIMESTAMP - RESTORE_TEST_TS))
echo "backup_restore_test_age_seconds ${RESTORE_AGE}"
```

Add a Prometheus alert rule:

```
- alert: RestoreTestOverdue
  expr: backup_restore_test_age_seconds > 7776000
  for: 0m
  labels:
    severity: warning
  annotations:
    summary: "Quarterly restore test is overdue"
    description: >
      The last restore test was {{ $value | humanizeDuration }} ago.
      Restore tests should be conducted quarterly. Cheery Littlebottom manages this.
```

7,776,000 seconds is 90 days. The alert fires when the most recent restore test is more than 90 days old.
