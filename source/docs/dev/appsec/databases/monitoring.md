# Monitoring and auditing

Database monitoring serves two purposes: detecting active attacks or misuse in progress, and providing the forensic
record needed to understand what happened after the fact. Many breaches go undetected for months in part because the
database logs were not being collected or reviewed.

## Events worth logging

Failed authentication attempts can indicate credential stuffing or brute-force access attempts. Repeated failures against
multiple accounts from the same source are more informative than individual failures.

Unusual query patterns are harder to define but include: bulk `SELECT *` from tables that contain sensitive data,
queries running outside normal hours, access to tables the application does not normally query, and very long query
strings (which sometimes indicate injection attempts that reached the query layer).

Schema changes (`DROP TABLE`, `ALTER TABLE`, `GRANT`) in production are worth logging and alerting on.

## PostgreSQL

`pg_audit` (the pgAudit extension) provides detailed logging of SQL statements by session or by object:

```sql
-- enable statement-level audit logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
SELECT pg_reload_conf();
```

For production systems, logging all statements can generate significant volume. `log_statement = 'ddl'` logs only
schema-level changes; `log_statement = 'mod'` adds data modification statements. The pgAudit extension provides more
granular control and structured output.

## MySQL

MySQL Enterprise Audit provides log output to a file or syslog. The community edition does not include native audit
logging; the MariaDB Audit Plugin is available as a community alternative.

General query logging (`general_log`) logs all queries but is typically too noisy for continuous production use. The
slow query log is more targeted and is worth enabling with an appropriate threshold:

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

## Log handling

Database logs are only useful if they reach a system that is separate from the database. Logs written to the same server
that an attacker compromised can be cleared. Shipping logs to a centralised SIEM or log aggregation system (
Elasticsearch, Splunk, Grafana Loki) preserves them independently.

Access to the log system itself is worth restricting; an attacker with access to the log system can cover tracks there
too.
Last updated: 17 May 2026
