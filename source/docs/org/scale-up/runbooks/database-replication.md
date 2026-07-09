# Database replication setup

Runbook for configuring PostgreSQL streaming replication between the Helsinki primary and the Nuremberg replica. Streaming replication ensures that data written to the Helsinki primary is continuously replicated to Nuremberg. In a failover, Nuremberg promotes its replica to primary with minimal data loss. Replication lag is monitored; an alert fires if it exceeds one second.

## Architecture

Helsinki hosts the primary PostgreSQL instance at `db-01.hel1.golemtrust.am`. Nuremberg hosts the replica at `db-01.nbg1.golemtrust.am`. Replication is asynchronous: the primary does not wait for the replica to confirm receipt before acknowledging a write. This means a small amount of recently committed data could be lost in a hard failover if the replication stream has not fully caught up. The acceptable RPO is 5 minutes; with a monitored lag threshold of 1 second, actual data loss at failover is typically under 2 seconds of writes.

## Primary configuration

On the Helsinki primary, edit `/etc/postgresql/16/main/postgresql.conf`:

```
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
max_replication_slots = 3
synchronous_commit = off
hot_standby = on
```

`wal_level = replica` enables the write-ahead log entries needed for streaming replication. `max_wal_senders` sets the maximum number of concurrent replication connections; 3 allows one active replica and two spare slots for re-syncing after a replica restart. `wal_keep_size = 1GB` retains WAL segments on the primary for long enough that the replica can catch up after a brief disconnect without needing a full base backup.

Create a dedicated replication user. Do not use the `postgres` superuser for replication:

```
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '<retrieve from Vaultwarden>';
```

Store the password in Vault at `kv/golemtrust/postgres-replication`.

Edit `/etc/postgresql/16/main/pg_hba.conf` to allow the replication user to connect from the Nuremberg replica's Headscale IP:

```
host    replication     replicator      100.64.0.20/32       scram-sha-256
```

Replace `100.64.0.20` with the Headscale IP of `db-01.nbg1.golemtrust.am`. Reload PostgreSQL:

```
systemctl reload postgresql
```

## Replica initialisation

On the Nuremberg replica, take a base backup from the primary using `pg_basebackup`. This is a one-time operation that seeds the replica with a consistent copy of the primary's data:

```
systemctl stop postgresql

rm -rf /var/lib/postgresql/16/main

pg_basebackup \
  -h db-01.hel1.golemtrust.am \
  -U replicator \
  -D /var/lib/postgresql/16/main \
  -Fp -Xs -P -R

chown -R postgres:postgres /var/lib/postgresql/16/main
```

The `-R` flag creates a `standby.signal` file and writes a `primary_conninfo` entry to `postgresql.auto.conf`. These tell PostgreSQL to start in standby mode and connect to the primary for streaming.

Verify the `primary_conninfo` in `/var/lib/postgresql/16/main/postgresql.auto.conf`:

```
primary_conninfo = 'host=db-01.hel1.golemtrust.am port=5432 user=replicator password=<password> sslmode=require'
```

Add `sslmode=require` if it is not present. Cross-region replication traffic traverses the Headscale WireGuard tunnel and is already encrypted at the network layer, but requiring SSL at the PostgreSQL layer provides defence in depth.

Start the replica:

```
systemctl start postgresql
```

## Replication slot

Create a replication slot on the primary to prevent the primary from discarding WAL segments that the replica has not yet consumed. Without a slot, if the replica falls significantly behind or disconnects for an extended period, the primary may discard WAL that the replica needs for catch-up, requiring a full re-sync.

On the primary:

```
SELECT pg_create_physical_replication_slot('nbg1_replica');
```

Update `postgresql.auto.conf` on the replica to use the slot:

```
primary_slot_name = 'nbg1_replica'
```

Monitor the slot's `pg_wal_lsn_diff` to confirm WAL is not accumulating. An unused slot that causes unbounded WAL accumulation will fill the disk. If the replica is offline for more than 30 minutes, consider dropping and recreating the slot after the replica reconnects to avoid disk pressure.

## Monitoring replication lag

On the primary, query replication lag in seconds:

```
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds
FROM pg_stat_replication;
```

The Prometheus `postgres_exporter` exposes `pg_replication_slots_pg_wal_lsn_diff` and `pg_stat_replication_pg_wal_lsn_diff` metrics. Alert rule for lag exceeding one second:

```
- alert: PostgresReplicationLagHigh
  expr: pg_stat_replication_pg_wal_lsn_diff > 16384
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "PostgreSQL replication lag is high"
    description: >
      Replication lag to {{ $labels.client_addr }} exceeds threshold.
      Check network connectivity between hel1 and nbg1.
```

The threshold `16384` (16KB) of WAL difference corresponds approximately to one second of light write activity. Adjust based on observed baseline traffic.

A second alert fires if no replica is connected at all:

```
- alert: PostgresNoReplicaConnected
  expr: pg_stat_replication_count == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "No PostgreSQL replica connected"
    description: >
      No streaming replica is connected to the Helsinki primary.
      Failover capability is degraded. Check db-01.nbg1.golemtrust.am.
```

## Verifying replication

From the replica, confirm it is in recovery (standby) mode:

```
psql -U postgres -c "SELECT pg_is_in_recovery();"
```

This should return `true`. If it returns `false`, the replica has been promoted and is no longer replicating.

From the primary, confirm the replica is listed:

```
psql -U postgres -c "SELECT * FROM pg_stat_replication;"
```

Write a test row on the primary and confirm it appears on the replica within a few seconds:

```
# On primary:
psql -U postgres -d postgres -c "CREATE TABLE repl_test (ts timestamptz); INSERT INTO repl_test VALUES (now());"

# On replica:
psql -U postgres -d postgres -c "SELECT * FROM repl_test;"
```

Clean up after the test:

```
# On primary:
psql -U postgres -d postgres -c "DROP TABLE repl_test;"
```
Last updated: 20 March 2026
