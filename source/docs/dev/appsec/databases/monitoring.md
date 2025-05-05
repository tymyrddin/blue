# Monitoring & auditing

## Log suspicious activity:

Failed logins, unusual query patterns (e.g., bulk `SELECT`s).

Example (PostgreSQL):

```sql
ALTER SYSTEM SET log_statement = 'all';  
ALTER SYSTEM SET log_connections = 'on';  
```

## Tools

* PostgreSQL Audit Extension (pgAudit)
* MySQL Enterprise Audit
