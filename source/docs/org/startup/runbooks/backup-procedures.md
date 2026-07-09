# Backup procedures

Runbook for backup and recovery of all Golem Trust production systems. A backup that has never been tested is not a backup; it is an optimistic gesture. These procedures include verification steps. The verification steps are not optional.

## What is backed up

| System         | Data                  | Method          | Frequency            | Retention    |
|----------------|-----------------------|-----------------|----------------------|--------------|
| PostgreSQL     | All databases         | pg_dump         | Daily at 02:00       | 30 days      |
| Keycloak       | Realm exports         | kc.sh export    | Weekly, Sunday 03:00 | 12 weeks     |
| Vaultwarden    | /opt/vaultwarden/data | rsync + tar     | Daily at 02:30       | 30 days      |
| Server configs | /etc on both servers  | etckeeper + git | On change            | Full history |

Backups are encrypted with age (the tool) and stored on a Hetzner Storage Box (`backup.golemtrust.am`) in the same Helsinki region, with a weekly copy sent to a second Storage Box in Nuremberg (`backup-dr.golemtrust.am`). Ponder considered Überwald for offsite storage but conceded that the latency was a concern.

## Setting up age encryption

Install age on both production servers:

```
apt install -y age
```

Generate the backup encryption key pair on the auth server. Store the private key in Vaultwarden under the Infrastructure collection immediately:

```
age-keygen -o /root/.age/backup-key.txt
cat /root/.age/backup-key.txt
```

The output contains both the public key (a comment line starting with `# public key:`) and the private key. Copy only the public key into a variable for use in backup scripts. Store the full file content in Vaultwarden now, before proceeding.

## Hetzner Storage Box configuration

Each Storage Box has SFTP and rsync-over-SSH enabled. Add the production servers' SSH public keys to the Storage Box authorised keys via the Hetzner Robot panel.

Mount or access the Storage Boxes via rsync:

```
rsync -az -e "ssh -p 23" /path/to/backup user@u123456.your-storagebox.de:/
```

The actual usernames and hostnames are in Vaultwarden under the Infrastructure collection.

## PostgreSQL backup script

Create `/opt/backup/pg-backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backup/postgres"
DATE=$(date +%Y-%m-%d)
AGE_PUBKEY="age1..."  # paste public key here
STORAGEBOX_USER="u123456"
STORAGEBOX_HOST="u123456.your-storagebox.de"

mkdir -p "$BACKUP_DIR"

for DB in keycloak vaultwarden; do
  DUMPFILE="$BACKUP_DIR/${DB}_${DATE}.sql.gz"
  sudo -u postgres pg_dump "$DB" | gzip | age -r "$AGE_PUBKEY" -o "${DUMPFILE}.age"
  echo "Backed up $DB to ${DUMPFILE}.age"
done

rsync -az -e "ssh -p 23" "$BACKUP_DIR/"*.age \
  "${STORAGEBOX_USER}@${STORAGEBOX_HOST}:/postgres/"

find "$BACKUP_DIR" -name "*.age" -mtime +30 -delete

echo "PostgreSQL backup complete: $(date)"
```

```
chmod 700 /opt/backup/pg-backup.sh
```

## Keycloak realm export script

Create `/opt/backup/keycloak-backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backup/keycloak"
DATE=$(date +%Y-%m-%d)
AGE_PUBKEY="age1..."
STORAGEBOX_USER="u123456"
STORAGEBOX_HOST="u123456.your-storagebox.de"

mkdir -p "$BACKUP_DIR"

for REALM in golemtrust-internal golemtrust-customer; do
  EXPORTDIR="$BACKUP_DIR/${REALM}_${DATE}"
  mkdir -p "$EXPORTDIR"

  sudo -u keycloak /opt/keycloak/bin/kc.sh export \
    --realm "$REALM" \
    --dir "$EXPORTDIR" \
    --users realm_file

  tar czf "${EXPORTDIR}.tar.gz" -C "$BACKUP_DIR" "${REALM}_${DATE}"
  age -r "$AGE_PUBKEY" -o "${EXPORTDIR}.tar.gz.age" "${EXPORTDIR}.tar.gz"
  rm -rf "$EXPORTDIR" "${EXPORTDIR}.tar.gz"
done

rsync -az -e "ssh -p 23" "$BACKUP_DIR/"*.age \
  "${STORAGEBOX_USER}@${STORAGEBOX_HOST}:/keycloak/"

find "$BACKUP_DIR" -name "*.age" -mtime +90 -delete

echo "Keycloak backup complete: $(date)"
```

Note that Keycloak exports can take several minutes if there are many users. The export stops Keycloak's ability to process new logins during the export; for the current user count this is negligible. Revisit if the Seamstresses' Guild expands their use significantly.

## Vaultwarden backup script

Create `/opt/backup/vaultwarden-backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backup/vaultwarden"
DATE=$(date +%Y-%m-%d)
AGE_PUBKEY="age1..."
STORAGEBOX_USER="u123456"
STORAGEBOX_HOST="u123456.your-storagebox.de"

mkdir -p "$BACKUP_DIR"

TARFILE="$BACKUP_DIR/vaultwarden_${DATE}.tar.gz"
tar czf "$TARFILE" -C /opt/vaultwarden data/
age -r "$AGE_PUBKEY" -o "${TARFILE}.age" "$TARFILE"
rm "$TARFILE"

rsync -az -e "ssh -p 23" "$BACKUP_DIR/"*.age \
  "${STORAGEBOX_USER}@${STORAGEBOX_HOST}:/vaultwarden/"

find "$BACKUP_DIR" -name "*.age" -mtime +30 -delete

echo "Vaultwarden backup complete: $(date)"
```

The Vaultwarden data directory contains RSA keys used to encrypt vault items client-side. These keys are required to decrypt vault contents. Losing this directory while retaining the database backup renders the database backup useless. Both must be present for recovery.

## Scheduling

Add the following cron jobs for root on `db.golemtrust.am`:

```
0 2 * * * /opt/backup/pg-backup.sh >> /var/log/backup.log 2>&1
```

And on `auth.golemtrust.am`:

```
30 2 * * * /opt/backup/vaultwarden-backup.sh >> /var/log/backup.log 2>&1
0 3 * * 0 /opt/backup/keycloak-backup.sh >> /var/log/backup.log 2>&1
```

## Weekly offsite transfer

Create `/opt/backup/offsite-sync.sh` on the auth server:

```bash
#!/bin/bash
set -euo pipefail

STORAGEBOX_NB_USER="u789012"
STORAGEBOX_NB_HOST="u789012.your-storagebox.de"
STORAGEBOX_HEL_USER="u123456"
STORAGEBOX_HEL_HOST="u123456.your-storagebox.de"

rsync -az -e "ssh -p 23" \
  "${STORAGEBOX_HEL_USER}@${STORAGEBOX_HEL_HOST}:/" \
  "${STORAGEBOX_NB_USER}@${STORAGEBOX_NB_HOST}:/"

echo "Offsite sync complete: $(date)"
```

```
0 4 * * 1 /opt/backup/offsite-sync.sh >> /var/log/backup.log 2>&1
```

## Recovery procedure

To restore the PostgreSQL databases from backup:

1. Retrieve the age private key from Vaultwarden (or from the Bank of Ankh-Morpork vault if Vaultwarden is unavailable).
2. Download the relevant backup file from the Storage Box.
3. Decrypt: `age -d -i /root/.age/backup-key.txt keycloak_2026-03-01.sql.gz.age | gunzip > keycloak_2026-03-01.sql`
4. Restore: `sudo -u postgres psql keycloak < keycloak_2026-03-01.sql`

To restore Vaultwarden:

1. Stop the container: `docker compose -f /opt/vaultwarden/docker-compose.yml down`
2. Decrypt and extract the backup: `age -d -i /root/.age/backup-key.txt vaultwarden_2026-03-01.tar.gz.age | tar xzf - -C /opt/vaultwarden/`
3. Restore the Vaultwarden PostgreSQL database using the same procedure as above.
4. Start the container: `docker compose -f /opt/vaultwarden/docker-compose.yml up -d`

## Recovery testing

On the first Monday of each month, Ponder (or whoever is available) performs a test restore into the staging environment. The test must include:

1. Decrypting at least one PostgreSQL backup successfully
2. Decrypting the most recent Vaultwarden backup and verifying that the data directory is intact
3. Logging into Vaultwarden in the staging environment and verifying that at least three items are readable

The test result is noted in the Golem Trust internal wiki. "Worked" is a sufficient entry. "Did not work" requires an incident entry and must be resolved before the next business day.

Nobody in Ankh-Morpork believes disaster will strike until it does. Vimes believed it would. He was usually right.