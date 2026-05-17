# Database security checklist

A reference for the controls worth verifying before a database reaches production or undergoes a security
review. Detail on each area is in the adjacent pages: [access control](access-control.md), [parameterised queries](parameterisation.md), [input handling](input.md), [configuration](config.md), and [monitoring](monitoring.md).

## Access control

Application accounts connect with the minimum permissions they need: `SELECT` for read-only services,
`SELECT, INSERT, UPDATE` for write-capable ones, nothing broader. `GRANT ALL` is a development shortcut
that tends to persist into production.

Host restriction narrows the connection surface. `app_user@'10.0.1.%'` is meaningfully different from
`app_user@'%'`: the first limits where the credential can be used even if it is compromised.

Each service connects with its own credentials. Shared accounts conflate audit trails and complicate
independent credential rotation.

Existing permission grants accumulate. Periodic review with `SHOW GRANTS` (MySQL) or `\du+` and
`information_schema.role_table_grants` (PostgreSQL) surfaces accounts carrying more access than their
current role requires.

## Authentication and connections

TLS for all connections, including internal service-to-database links on private networks. Default
database configurations often leave TLS optional rather than required.

Default credentials removed: MySQL `root` with no password, MongoDB with authentication disabled,
Redis with no password and bound to `0.0.0.0`. These defaults have been the initial access point in
numerous real incidents.

Strong authentication mechanisms preferred: SCRAM-SHA-256 (PostgreSQL 14+ default) rather than older
challenge-response methods; X.509 certificates for service-to-database connections where available.

## Configuration

Features not in use are worth disabling rather than leaving as a latent attack surface:

- MySQL `local_infile=0` disables `LOAD DATA LOCAL INFILE`, which can read arbitrary files from the
  client host
- MongoDB `enableLocalhostAuthBypass: false` prevents unauthenticated localhost access
- Redis bound to loopback or a private interface in `redis.conf`; not `0.0.0.0`
- PostgreSQL `pg_read_file()` accessible to superusers only; application accounts are not superusers

Development flags (`DEBUG`, interactive console access, verbose error output) are not active in
production.

## Input handling

Parameterised queries throughout: no string concatenation into SQL. ORM raw query escape hatches
(`.raw()`, `execute()`, `extra()`) use the params argument rather than string interpolation.

Allowlist validation for fields with constrained formats (identifiers, codes, enums) before the value
reaches the query layer. This catches structurally invalid input before parameterisation handles it.

NoSQL queries validate that user input is the expected type and structure before it appears as a query
operand. MongoDB `$where` evaluation (which runs JavaScript) is disabled by default since 4.4; older
deployments are worth checking.

## Encryption at rest

Database files or volumes encrypted at the filesystem level (dm-crypt/LUKS on Linux, BitLocker on
Windows, or cloud storage encryption). Relevant for physical media protection and misconfigured-backup
scenarios; does not protect a running database with its decryption key loaded.

## Audit logging

Failed authentication attempts logged and reviewed. Schema changes (`DROP TABLE`, `ALTER TABLE`,
`GRANT`) in production logged with alerting configured: these are rare in normal operation and
investigable when they appear.

Logs shipped to a system separate from the database server. Logs on the same system an attacker has
compromised can be cleared; a centralised log aggregator (Elasticsearch, Splunk, Grafana Loki) preserves
the record independently.

## Backups

Backups verified by restoration test. A backup that has never been restored is an untested assumption.

Backup files encrypted and stored separately from the live database, with access controls that do not
overlap with those on the database itself.
