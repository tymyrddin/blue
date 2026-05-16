# Database security comparison

Different databases have different default security postures, and the gap between default and hardened can be
significant.

## PostgreSQL

Row-Level Security (RLS) restricts which rows a user or role can see, which is relevant for multi-tenant applications
where different users query the same table. Authentication defaults to SCRAM-SHA-256 (since PostgreSQL 14), which is
resistant to replay attacks. Audit logging is available via the pgAudit extension.

PostgreSQL has no built-in transparent data encryption; encryption at rest requires filesystem-level encryption (
dm-crypt/LUKS on Linux) or cloud storage encryption.

Well-suited to applications with compliance requirements (HIPAA, GDPR) that need per-row access control.

## MySQL / MariaDB

GRANT/REVOKE syntax is simpler than PostgreSQL's, which makes RBAC setup more approachable. LDAP and PAM authentication
are supported via pluggable auth. Transparent data encryption is available in MySQL Enterprise and MariaDB.

Default installs in some distributions have historically set an empty root password; `mysql_secure_installation` walks
through the initial hardening steps. Row-level security is not native and requires views or stored procedures to
approximate it.

## MongoDB

Document-level access control and field-level encryption are available. Authentication supports X.509 certificates and
LDAP. TDE (encryption at rest) is available in MongoDB Enterprise.

The NoSQL injection surface is different from relational databases: queries expressed as JSON objects can be manipulated
if user input is merged into query documents without sanitisation. `$where` clause evaluation (which runs JavaScript) is
the highest-risk feature and is disabled in recent versions by default.

Older MongoDB defaults (pre-3.0) bound to `0.0.0.0` with no authentication; versions still running those defaults on
internet-accessible interfaces have been a consistent source of data exposure incidents.

## SQLite

File-based storage means no network attack surface and no authentication mechanism. Access control is entirely
filesystem permissions. Encryption at rest requires SQLCipher or a filesystem-level solution; the default database file
is plaintext.

Appropriate for embedded applications, desktop tools, and local data stores. Not appropriate for multi-user server
environments without an intermediary application enforcing access control.

## Redis

TLS support and ACL-based per-command permissions were introduced in Redis 6.0. Data is not encrypted at rest in the
open-source version. Earlier versions had no authentication mechanism; instances bound to public interfaces and running
pre-6.0 versions have been directly exploitable via the protocol.

Redis ACLs (Redis 6+) allow restricting a user to specific commands and key patterns:

```
ACL SETUSER app_user on >password ~app:* +get +set
```

## Feature comparison

| Feature               | PostgreSQL    | MySQL      | MongoDB    | SQLite | Redis       |
|-----------------------|---------------|------------|------------|--------|-------------|
| TLS encryption        | Yes           | Yes        | Yes        | No     | Yes (v6+)   |
| Encryption at rest    | Extensions    | Enterprise | Enterprise | No     | No          |
| Row/document security | Yes (RLS)     | No         | Yes        | No     | No          |
| Audit logging         | pgAudit       | Enterprise | Enterprise | No     | No          |
| Default auth          | SCRAM-SHA-256 | Variable   | X.509/LDAP | No     | No (pre-v6) |

## Common exposure patterns

PostgreSQL: misconfigured RLS that exposes rows across tenant boundaries.

MySQL: default root account without a password, or with `root@%` (accessible from any host).

MongoDB: `$where` clause injection; unauthenticated instances on public interfaces.

SQLite: world-readable database file in a web-accessible directory.

Redis: unauthenticated instance reachable from the internet, which allows reading all keys and, in some versions,
writing arbitrary files via `CONFIG SET dir` and `CONFIG SET dbfilename`.
