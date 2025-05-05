# Database security comparison

1. PostgreSQL

Security strengths:

* Row-Level Security (RLS): Restrict access per user/role.
* Native SSL/TLS: Encrypts connections by default.
* Strong Auth: SCRAM-SHA-256 password hashing.
* Audit Logging: Via pgAudit extension.

Weaknesses:

* Complex setup for fine-grained permissions.
* No built-in transparent data encryption (TDE).

Best for: Enterprises needing ACLs, compliance (HIPAA/GDPR).

2. MySQL/MariaDB

Security strengths:

* Easy RBAC: Simple GRANT/REVOKE syntax.
* TDE Support: Enterprise editions only.
* Pluggable Auth: Supports LDAP, PAM.

Weaknesses:

* Weak defaults: Empty root password in some installs.
* No RLS: Must implement via views/procedures.

Best for: Web apps, legacy systems.

3. MongoDB

Security strengths:

* Document-Level Access Control: Field encryption possible.
* Enterprise TDE: Automatic encryption-at-rest.
* Audit Logging: Native in paid versions.

Weaknesses:

* NoSQL Injection: Risky if queries concatenate user input.
* Default Bind IP: 0.0.0.0 in older versions.

Best for: JSON-heavy apps, rapid prototyping.

4. SQLite

Security strengths:

* No Network Exposure: File-based = no TCP attack surface.
* Process Isolation: Runs in app memory space.

Weaknesses:

* No Authentication: File permissions = only defence.
* No Encryption: Requires third-party tools (SQLCipher).

Best for: Embedded systems, local apps.

5. Redis

Security strengths:

* TLS Support: v6.0+ encrypts connections.
* ACLs: Per-command permissions (v6.0+).

Weaknesses:

* No Encryption-at-Rest: Data stored plaintext.
* Weak Defaults: No auth in older versions.

Best for: Caching, real-time systems.

## Critical security features comparison

| Feature	                | PostgreSQL	        | MySQL	          | MongoDB	        | SQLite	 | Redis      | 
|-------------------------|--------------------|-----------------|-----------------|---------|------------|
| TLS Encryption	         | ✅	                 | ✅	              | ✅	              | ❌	      | ✅ (v6+)    | 
| Encryption-at-Rest	     | ❌ (Extensions)	    | ✅ (Enterprise)	 | ✅ (Enterprise)	 | ❌	      | ❌          | 
| Row/Doc-Level Security	 | ✅ (RLS)	           | ❌	              | ✅	              | ❌	      | ❌          | 
| Audit Logging	          | ✅ (pgAudit)	       | ✅ (Enterprise)	 | ✅ (Enterprise)	 | ❌	      | ❌          | 
| Default Auth Strength	  | ✅ (SCRAM-SHA-256)	 | ❌ (Empty root)	 | ✅ (X.509/LDAP)	 | ❌	      | ❌ (Pre-v6) | 

## Top threats per database

* PostgreSQL: Misconfigured RLS exposing sensitive rows.
* MySQL: Default root@localhost with no password.
* MongoDB: NoSQL injection via $where clauses.
* SQLite: File corruption via app vulnerabilities.
* Redis: Unauthenticated access leading to RCE.

## Hardening checklist

For All Databases:

* Enable TLS (even for local connections).
* Rotate credentials regularly.
* Restrict network access (firewalls, VPCs).

Specifically:

* PostgreSQL: Enable pgAudit, use RLS.
* MySQL: Run mysql_secure_installation, disable LOCAL INFILE.
* MongoDB: Enable auth, disable $where/eval.
* SQLite: Use SQLCipher for encryption.
* Redis: Upgrade to v6+, enable ACLs.

When to Use Which

* GDPR/HIPAA: PostgreSQL (RLS + extensions).
* Web Apps: MySQL (with strict RBAC).
* Unstructured Data: MongoDB (enable field-level encryption).
* Embedded Devices: SQLite (with filesystem encryption).
* Caching: Redis (v6+ with TLS and ACLs).

## More

* [OWASP Database Security](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)
* [CIS Benchmarks (For PostgreSQL/MySQL hardening)](https://www.cisecurity.org/cis-benchmarks)