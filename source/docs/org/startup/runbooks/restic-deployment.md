# Restic deployment

Runbook for deploying Restic as the primary backup solution across all Golem Trust production systems. Restic replaces the informal Hetzner volume snapshots that Ponder had been relying on without mentioning to anyone. Cheery Littlebottom classified the previous arrangement as a critical risk. This runbook is the response.

## Why Restic

Restic produces encrypted, deduplicated backups to a remote repository. Each backup operation (a snapshot) is incremental: only changed data is transmitted and stored. Snapshots are independent and can be restored individually. The repository format is designed so that a partial backup is never mistaken for a complete one; if a backup run is interrupted, the repository remains in a consistent state.

Encryption is built in. Restic cannot write an unencrypted repository. The encryption key is a password; that password is stored in Vault under the `kv/golemtrust/backup` path.

## Installation

Install Restic on every server that will be backed up. On Debian 12:

```
apt install -y restic
```

Confirm the installed version:

```
restic version
```

The Debian 12 package is Restic 0.14.x. If a newer version is required, download the binary directly from the [Restic releases page](https://github.com/restic/restic/releases) and install to `/usr/local/bin/restic`.

## Hetzner Storage Box configuration

Backups go to a Hetzner Storage Box in Finland (`backup-restic.golemtrust.am`). A second Storage Box in Nuremberg (`backup-restic-dr.golemtrust.am`) receives a weekly copy.

Enable SFTP access on both Storage Boxes via the Hetzner Robot panel. Add the production servers' SSH public keys to the Storage Box authorised keys. Each server uses its own SSH key for authentication; no shared credentials.

Generate an SSH key pair on each server (if not already present):

```
ssh-keygen -t ed25519 -f /root/.ssh/backup_key -N "" -C "backup@$(hostname)"
```

Add the public key (`/root/.ssh/backup_key.pub`) to the Storage Box authorised keys via the Hetzner Robot panel. Test the connection:

```
sftp -i /root/.ssh/backup_key -P 23 u123456@u123456.your-storagebox.de
```

The Storage Box username and hostname are in Vaultwarden under the Infrastructure collection.

## Repository initialisation

Each server has its own Restic repository on the Storage Box, organised by hostname. This keeps snapshots isolated; a failure or compromise on one server does not affect another server's backup history.

Retrieve the backup password from Vault:

```
export VAULT_ADDR="https://vault.golemtrust.am:8200"
export RESTIC_PASSWORD=$(vault kv get -field=restic_backup_password kv/golemtrust/backup)
```

The password in Vault was generated with `openssl rand -base64 48` and stored there by Ponder during initial setup. It is the same password used across all repositories; rotating it requires re-encrypting all repositories, which is a planned annual maintenance task. Set a calendar reminder.

Initialise the repository for this server:

```
export RESTIC_REPOSITORY="sftp://u123456@u123456.your-storagebox.de:23/$(hostname)"
restic init
```

Confirm the repository is accessible:

```
restic snapshots
```

An empty output (no snapshots yet) is correct. An error at this point indicates an SFTP connectivity or authentication problem.

## Backup script

Create `/opt/backup/restic-backup.sh` on each server:

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

HOSTNAME=$(hostname -s)
LOG_FILE="/var/log/restic-backup.log"

echo "$(date): Starting backup of $HOSTNAME" >> "$LOG_FILE"

restic backup \
  --tag "$HOSTNAME" \
  --tag "daily" \
  --exclude="/proc" \
  --exclude="/sys" \
  --exclude="/dev" \
  --exclude="/run" \
  --exclude="/tmp" \
  --exclude="/var/cache" \
  --exclude="/opt/vault/data" \
  /etc \
  /home \
  /opt \
  /var/lib \
  /var/log \
  >> "$LOG_FILE" 2>&1

BACKUP_EXIT=$?

restic forget \
  --keep-daily 90 \
  --keep-weekly 104 \
  --prune \
  >> "$LOG_FILE" 2>&1

if [ $BACKUP_EXIT -eq 0 ]; then
  echo "$(date): Backup completed successfully" >> "$LOG_FILE"
  vault kv put kv/golemtrust/backup-status/$(hostname -s) \
    last_success="$(date -Iseconds)" \
    status="ok"
else
  echo "$(date): Backup FAILED with exit code $BACKUP_EXIT" >> "$LOG_FILE"
  vault kv put kv/golemtrust/backup-status/$(hostname -s) \
    last_failure="$(date -Iseconds)" \
    status="failed"
fi
```

`/opt/vault/data` is excluded from the filesystem backup because Vault data is backed up via Raft snapshots (see the Raft configuration runbook). Including both would create redundancy without benefit and would back up Vault's encrypted data without its decryption context.

```
chmod 700 /opt/backup/restic-backup.sh
```

## Verification

Run the backup script manually the first time and watch the output:

```
/opt/backup/restic-backup.sh
tail -50 /var/log/restic-backup.log
```

After the run completes, list snapshots to confirm the backup was recorded:

```
restic snapshots
```

Check the repository integrity:

```
restic check
```

A passing check confirms the repository is consistent and all snapshot data is intact. Run `restic check` after the first backup and monthly thereafter (the monitoring setup runbook schedules this automatically).
Last updated: 20 March 2026
