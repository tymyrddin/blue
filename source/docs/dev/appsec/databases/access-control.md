# Database access control

Broad database permissions granted for development convenience tend to persist. An application account with
`GRANT ALL ON *.* TO 'app_user'@'%'` can read from, write to, and drop any table in any database from any host. A
vulnerability in the application that reaches the database layer then has the same scope.
The [broken access control](https://red.tymyrddin.dev/docs/in/app/techniques/acl.html)
and [IDOR](https://red.tymyrddin.dev/docs/in/app/techniques/idor.html) attack pages cover how overly broad permissions
get exploited at the application layer.

## Least privilege

Each application or service component connects with the minimum permissions it needs. A read-heavy reporting service
does not need `INSERT` or `DELETE`. A background job that processes orders does not need access to the users table.

```sql
-- avoid: full admin access from any host
GRANT ALL ON *.* TO 'app_user'@'%';

-- prefer: specific operations on a specific database, from a specific host range
GRANT SELECT, INSERT ON app_db.* TO 'app_user'@'10.0.1.%';
```

Host restriction (`10.0.1.%` rather than `%`) limits where the account can connect from, which reduces the exposure if
credentials are compromised.

## Role-based access control

Defining roles (read_only, read_write, admin) and assigning users to roles is more maintainable than assigning
permissions directly to individual accounts. When a service's access requirements change, updating the role propagates
to all accounts with that role.

PostgreSQL role example:

```sql
CREATE ROLE app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
GRANT app_readonly TO reporting_user;
```

## Dedicated accounts per service

Sharing a single database account across multiple services conflates their audit trails and makes it harder to rotate
credentials independently. Each service connecting to the database benefits from its own credentials. In Kubernetes
environments, secrets management tools (Vault, External Secrets Operator) can inject credentials per-pod without
hardcoding them in environment variables.

## Reviewing current permissions

Permissions accumulate over time. Periodic review identifies accounts with more access than they need:

```text
-- MySQL: show grants for a specific account
SHOW GRANTS FOR 'app_user'@'%';

-- PostgreSQL: list all roles and their attributes
\du+

-- PostgreSQL: list table privileges in a schema
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public';
```
