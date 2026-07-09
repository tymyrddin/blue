# PostgreSQL backend configuration

Runbook for provisioning and configuring the PostgreSQL instance that backs Keycloak and other Golem Trust services. The database server runs on `db.golemtrust.am`, a separate Hetzner CX21 instance in the same Helsinki region as the auth server. Ponder chose PostgreSQL because "it is reliable, well-documented, and does not require a golem to maintain."

## Prerequisites

- Hetzner cloud CX21 instance running Debian 12 (Bookworm) in `hel1`
- Private network configured within Hetzner between `db.golemtrust.am` and `auth.golemtrust.am` (10.0.0.0/24 range; the auth server is 10.0.0.2, the database server is 10.0.0.3)
- No public-facing port 5432; the firewall blocks it. This is deliberate. See the note at the end of this document.
- SSH key access only

## Installation

```
apt update && apt upgrade -y
apt install -y postgresql postgresql-contrib
```

This installs the distribution's PostgreSQL package. For Debian 12, this is PostgreSQL 15. If a newer version is required, add the official PostgreSQL apt repository first:

```
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor \
  -o /usr/share/keyrings/postgresql-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] \
  https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list
apt update && apt install -y postgresql-16
```

## Initial cluster configuration

PostgreSQL starts automatically after installation. The main configuration files live in `/etc/postgresql/16/main/` on Debian.

Edit `postgresql.conf` to bind only to the private network interface:

```
listen_addresses = '10.0.0.3, 127.0.0.1'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
wal_buffers = 16MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p] %u@%d '
```

The `log_min_duration_statement` setting at 1000ms will log any query taking over a second. Ponder considers this acceptable for a database of this size. Revisit if the query log becomes unwieldy.

## Client authentication

Edit `pg_hba.conf` to restrict access to known hosts on the private network. Remove or comment out any existing permissive rules and replace with:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    keycloak        keycloak        10.0.0.2/32             scram-sha-256
host    vaultwarden     vaultwarden     10.0.0.2/32             scram-sha-256
host    all             all             10.0.0.0/24             reject
```

The reject rule at the end ensures that no other host on the private subnet can connect even if credentials are obtained. Only the two application users are permitted, from only the auth server's IP.

Restart PostgreSQL after editing either configuration file:

```
systemctl restart postgresql
```

## Database and user creation

Connect as the postgres superuser:

```
sudo -u postgres psql
```

Create the Keycloak database and user:

```
CREATE USER keycloak WITH PASSWORD '<generate with: openssl rand -base64 32>';
CREATE DATABASE keycloak OWNER keycloak ENCODING 'UTF8' LC_COLLATE 'en_GB.UTF-8' LC_CTYPE 'en_GB.UTF-8';
REVOKE ALL ON DATABASE keycloak FROM PUBLIC;
GRANT CONNECT ON DATABASE keycloak TO keycloak;
```

Create the Vaultwarden database and user:

```
CREATE USER vaultwarden WITH PASSWORD '<generate with: openssl rand -base64 32>';
CREATE DATABASE vaultwarden OWNER vaultwarden ENCODING 'UTF8' LC_COLLATE 'en_GB.UTF-8' LC_CTYPE 'en_GB.UTF-8';
REVOKE ALL ON DATABASE vaultwarden FROM PUBLIC;
GRANT CONNECT ON DATABASE vaultwarden TO vaultwarden;
\q
```

Both passwords should be stored immediately in Vaultwarden under the Infrastructure collection. If Vaultwarden is not yet provisioned, store them temporarily in the encrypted vault at the Bank of Ankh-Morpork (see the emergency access procedure in the Vaultwarden runbook).

## Verification

From the auth server (`10.0.0.2`), test the connection:

```
psql -h 10.0.0.3 -U keycloak -d keycloak -c "SELECT version();"
```

You should receive a version string. If the connection is refused, check:
1. `listen_addresses` in `postgresql.conf` includes `10.0.0.3`
2. The `pg_hba.conf` entry for `10.0.0.2/32` is present and correct
3. The Hetzner private network firewall allows TCP 5432 between the two instances
4. `systemctl status postgresql` shows the service is active

## Performance notes

For the current scale of Golem Trust operations, these settings are adequate. The Seamstresses' Guild dataset is approximately 4GB. Mrs. Cake's financial records add a further 800MB. The database server has 4GB RAM; the settings above allocate roughly 25% to shared buffers, which is within standard recommendations.

If table bloat becomes visible in Keycloak's tables after six months of operation, run:

```sql
VACUUM ANALYZE;
```

Autovacuum is enabled by default and should handle routine maintenance. Manual intervention should not be necessary unless the database has been under unusual load, such as during a session audit.

## A note on public access

Port 5432 is not and should not be exposed to the public internet. When Vimes saw the sticky note, his first question after the password question was "what else is sitting there with the door open?" The answer at the time was embarrassing. It is no longer embarrassing. Keep it that way.
Last updated: 20 March 2026
