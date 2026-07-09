# Restore procedures

Runbook for restoring data from Restic backups. Restore procedures exist to be used; they also exist to be tested. An untested restore procedure is a hypothesis. This runbook is based on the tested hypothesis. Cheery's first test restored the Merchants' Guild database to a separate system in 47 minutes.

## Before restoring

Identify the following before starting:

1. Which server's data needs restoring (source)
2. What data specifically: the entire filesystem, specific directories, or a specific database
3. To where: the original server, a fresh replacement, or a staging environment
4. From which point in time: the most recent snapshot, or a specific date

Restoring to the original server while it is running risks overwriting files that are in active use. For a live server, restore to a staging location first, then migrate the recovered data to production after verifying it.

If the original server is completely lost (fire, errant dragon, thaumic accident), provision a fresh replacement server first, install the base system and Restic, and restore to the new server.

## Listing available snapshots

From the server being restored, or from any server with the same Vault credentials:

```
export VAULT_ADDR="https://vault.golemtrust.am:8200"
export VAULT_TOKEN=$(vault write -field=token auth/approle/login \
  role_id="$(cat /etc/vault/role-id)" \
  secret_id="$(cat /etc/vault/secret-id)")

export RESTIC_REPOSITORY="sftp://u123456@u123456.your-storagebox.de:23/<hostname>"
export RESTIC_PASSWORD=$(vault kv get -field=restic_backup_password kv/golemtrust/backup)
export RESTIC_SFTP_COMMAND="ssh -i /root/.ssh/backup_key -p 23 -o StrictHostKeyChecking=accept-new"

restic snapshots
```

The output lists each snapshot with its ID (a short hash), the date and time it was taken, the hostname, and the paths backed up. The most recent snapshot is at the top.

To see what a specific snapshot contains:

```
restic ls <snapshot-id>
```

To find the most recent snapshot before a specific point in time:

```
restic snapshots --before "2026-03-01 00:00:00"
```

## Restoring specific files or directories

To restore specific files from the most recent snapshot to a target directory:

```
restic restore latest \
  --target /tmp/restore \
  --include /etc/nginx
```

This restores `/etc/nginx` from the most recent snapshot to `/tmp/restore/etc/nginx`. Inspect the restored files, then copy them to their intended destination:

```
cp -a /tmp/restore/etc/nginx /etc/nginx.restored
diff -r /etc/nginx /etc/nginx.restored
```

Review the diff before replacing the live configuration.

To restore from a specific snapshot:

```
restic restore <snapshot-id> \
  --target /tmp/restore \
  --include /etc/nginx
```

## Restoring a PostgreSQL database

PostgreSQL databases are backed up in two ways: as part of the full filesystem backup (the data directory at `/var/lib/postgresql`) and via separate `pg_dump` exports (see the backup procedures runbook for the pg_dump approach).

Restoring from a `pg_dump` export is faster and cleaner for database-level recovery. Restoring from the filesystem backup is appropriate when a physical file-level recovery is needed or when the pg_dump export is not available.

To restore a database from a pg_dump export archived in Restic:

```
restic restore latest \
  --target /tmp/restore \
  --include /opt/backup/postgres

ls /tmp/restore/opt/backup/postgres/
```

The dump files are age-encrypted. Decrypt using the age private key (retrieved from the Bank of Ankh-Morpork vault for a production restore):

```
age -d -i /tmp/bank-vault-age-key.txt \
  /tmp/restore/opt/backup/postgres/keycloak_2026-03-01.sql.gz.age \
  | gunzip > /tmp/keycloak_2026-03-01.sql
```

Restore to the database:

```
sudo -u postgres psql -c "DROP DATABASE IF EXISTS keycloak_restore;"
sudo -u postgres psql -c "CREATE DATABASE keycloak_restore OWNER keycloak;"
sudo -u postgres psql keycloak_restore < /tmp/keycloak_2026-03-01.sql
```

Verify the restored database before replacing the live one.

## Full server restore

Restoring an entire server to a fresh instance:

1. Provision a new Hetzner instance with the same OS (Debian 12) and the same hostname
2. Install Restic: `apt install -y restic`
3. Configure SSH access to the Storage Box (copy the backup key from Vaultwarden)
4. Set the `RESTIC_REPOSITORY` and `RESTIC_PASSWORD` environment variables
5. Restore the entire filesystem (except active system directories):

```
restic restore latest \
  --target / \
  --exclude /proc \
  --exclude /sys \
  --exclude /dev \
  --exclude /run \
  --exclude /tmp
```

After the restore:

1. Reboot the server
2. Verify that services start correctly
3. Run `systemctl status` on each key service
4. Test connectivity from other servers on the private network
5. Update DNS if the new server has a different IP

## Restoring from the DR site

If the primary Storage Box in Helsinki is unavailable, switch to the Nuremberg DR Storage Box. Change the `RESTIC_REPOSITORY` to use the DR Storage Box credentials:

```
export RESTIC_REPOSITORY="sftp://u789012@u789012.your-storagebox.de:23/<hostname>"
```

All other restore commands remain the same. The DR Storage Box contains a copy of the Helsinki Storage Box as of the most recent Monday sync. Snapshots created after the last Monday sync are not present on the DR site; identify the data loss window before starting a DR restore.

## Tracking the restore

Log all restore activity in the internal security log:

- Date and time of restore start and completion
- Which snapshot was used (snapshot ID)
- What was restored (paths or databases)
- Target location
- Who performed the restore and why
- Whether a post-restore verification was performed and the result

Cheery reviews this log quarterly as part of the DR programme.
