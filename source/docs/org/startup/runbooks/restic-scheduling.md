# Backup scheduling

Runbook for configuring the backup schedule across all production servers. The schedule follows Cheery's requirements: daily incrementals at 23:00, weekly fulls every Sunday at 02:00, 90 days of daily retention, two years of weekly retention. "Unacceptable" was her word for what came before. This runbook is what acceptable looks like.

## Schedule overview

| Type | Time | Day | Retention |
|---|---|---|---|
| Daily incremental | 23:00 UTC | Every day | 90 days |
| Weekly full | 02:00 UTC | Sunday | 104 weeks (2 years) |
| Repository check | 04:00 UTC | First of month | n/a |
| DR sync to Nuremberg | 03:00 UTC | Monday | mirrors primary |

"23:00 Ankh-Morpork time" is UTC in practice; Ankh-Morpork does not observe summer time, a decision that Cheery noted was "at least consistent."

## Cron configuration

Add the following to root's crontab on each production server. Use `crontab -e` or write to `/etc/cron.d/restic-backup`:

```
# Daily incremental backup at 23:00 UTC
0 23 * * * /opt/backup/restic-backup.sh >> /var/log/restic-backup.log 2>&1

# Weekly full backup on Sunday at 02:00 UTC
# Restic does not distinguish "full" from "incremental" in its internal model,
# but the Sunday run uses a different tag and longer retention policy.
0 2 * * 0 /opt/backup/restic-backup-weekly.sh >> /var/log/restic-backup.log 2>&1

# Monthly repository integrity check
0 4 1 * * /opt/backup/restic-check.sh >> /var/log/restic-backup.log 2>&1
```

## Weekly backup script

The weekly backup differs from the daily in its tags and retention settings. Create `/opt/backup/restic-backup-weekly.sh`:

```
#!/bin/bash
set -euo pipefail

export VAULT_ADDR="https://vault.golemtrust.am:8200"
export VAULT_TOKEN=$(vault write -field=token auth/approle/login \
  role_id="$(cat /etc/vault/role-id)" \
  secret_id="$(cat /etc/vault/secret-id)")

export RESTIC_REPOSITORY="sftp://u123456@u123456.your-storagebox.de:23/$(hostname -s)"
export RESTIC_PASSWORD=$(vault kv get -field=restic_backup_password kv/golemtrust/backup)
export RESTIC_SFTP_COMMAND="ssh -i /root/.ssh/backup_key -p 23 -o StrictHostKeyChecking=accept-new"

echo "$(date): Starting weekly backup of $(hostname -s)" >> /var/log/restic-backup.log

restic backup \
  --tag "$(hostname -s)" \
  --tag "weekly" \
  --exclude="/proc" \
  --exclude="/sys" \
  --exclude="/dev" \
  --exclude="/run" \
  --exclude="/tmp" \
  --exclude="/var/cache" \
  --exclude="/opt/vault/data" \
  / \
  >> /var/log/restic-backup.log 2>&1

restic forget \
  --tag weekly \
  --keep-weekly 104 \
  --prune \
  >> /var/log/restic-backup.log 2>&1

echo "$(date): Weekly backup complete" >> /var/log/restic-backup.log
```

Note that the weekly backup includes `/` as the root path rather than individual directories. This captures everything, including paths that the daily backup may exclude for space reasons. The `/opt/vault/data` exclusion remains in both scripts.

## Repository check script

Create `/opt/backup/restic-check.sh`:

```
#!/bin/bash
set -euo pipefail

export VAULT_ADDR="https://vault.golemtrust.am:8200"
export VAULT_TOKEN=$(vault write -field=token auth/approle/login \
  role_id="$(cat /etc/vault/role-id)" \
  secret_id="$(cat /etc/vault/secret-id)")

export RESTIC_REPOSITORY="sftp://u123456@u123456.your-storagebox.de:23/$(hostname -s)"
export RESTIC_PASSWORD=$(vault kv get -field=restic_backup_password kv/golemtrust/backup)
export RESTIC_SFTP_COMMAND="ssh -i /root/.ssh/backup_key -p 23 -o StrictHostKeyChecking=accept-new"

echo "$(date): Starting repository check for $(hostname -s)" >> /var/log/restic-backup.log

restic check --read-data-subset=10% >> /var/log/restic-backup.log 2>&1

CHECK_EXIT=$?

if [ $CHECK_EXIT -eq 0 ]; then
  vault kv put kv/golemtrust/backup-status/$(hostname -s) \
    last_check="$(date -Iseconds)" \
    check_status="ok"
  echo "$(date): Repository check passed" >> /var/log/restic-backup.log
else
  vault kv put kv/golemtrust/backup-status/$(hostname -s) \
    last_check="$(date -Iseconds)" \
    check_status="failed"
  echo "$(date): Repository check FAILED" >> /var/log/restic-backup.log
fi
```

`--read-data-subset=10%` reads and verifies a random 10% of repository data each month. Over 10 months, the full repository is verified. A full verification (`restic check --read-data`) is run annually during the restore testing exercise.

## DR sync to Nuremberg

The Nuremberg Storage Box receives a weekly copy of all primary Storage Box contents. This sync runs from the `metrics.golemtrust.am` instance, which has SSH keys authorised on both Storage Boxes.

Create `/opt/backup/dr-sync.sh` on `metrics.golemtrust.am`:

```
#!/bin/bash
set -euo pipefail

PRIMARY_USER="u123456"
PRIMARY_HOST="u123456.your-storagebox.de"
DR_USER="u789012"
DR_HOST="u789012.your-storagebox.de"

echo "$(date): Starting DR sync to Nuremberg" >> /var/log/backup.log

rsync -az \
  -e "ssh -i /root/.ssh/backup_key -p 23" \
  "${PRIMARY_USER}@${PRIMARY_HOST}:/" \
  --rsh="ssh -i /root/.ssh/dr_sync_key -p 23" \
  "${DR_USER}@${DR_HOST}:/" \
  >> /var/log/backup.log 2>&1

echo "$(date): DR sync complete" >> /var/log/backup.log
```

```
0 3 * * 1 /opt/backup/dr-sync.sh >> /var/log/backup.log 2>&1
```

## Staggering backups across servers

All servers run their backup at 23:00, but the actual start times are staggered by adding a short sleep based on the server's position in the infrastructure list. This prevents all servers from saturating the Storage Box SFTP connection simultaneously. Add to the beginning of the backup script on each server:

- `auth.golemtrust.am`: no delay (runs first)
- `db.golemtrust.am`: 5 minutes (`sleep 300`)
- `graylog-1` through `graylog-3`: 10, 15, 20 minutes
- `vault-1` through `vault-3`: 25, 30, 35 minutes
- Other servers: 40 minutes onwards, 5 minutes apart

At current backup sizes, each server's daily incremental takes between two and ten minutes. The stagger is conservative; adjust it downwards once the actual backup durations are known from the first month of operation.
