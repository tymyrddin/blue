# Database scanning

Database security testing covers the database configuration itself, not just the application layer. Parameterised queries in the application prevent SQL injection at the application layer; they do not address excessive database user permissions, unencrypted data at rest, or weak authentication on the database service itself.

## What to test

SQL injection at the application level: SQLMap automates the detection of SQL injection vulnerabilities by sending crafted payloads and analysing responses. It is most useful in a controlled penetration testing context where the tester has authorisation to test the application. Running SQLMap against a production application without authorisation is unauthorised access regardless of intent.

Database permissions: accounts with more privileges than they need are a persistent issue. The test is straightforward: log in as the application user and attempt operations it does not need (`DROP TABLE`, `INSERT` into tables it only reads from, reading system tables). Anything that succeeds is a privilege that can be removed.

Authentication strength: default credentials (`root` with no password in some MySQL distributions, `admin`/`admin` in some management interfaces) are a consistent finding. Database management interfaces (phpMyAdmin, pgAdmin) exposed to the internet with default credentials have been the entry point in multiple incidents.

Encryption in transit: connections to the database from application servers in plaintext are readable to anyone on the network path. Checking whether TLS is enforced, and whether the certificate is verified, is part of network path testing.

Sensitive data exposure: unencrypted columns for data classified as sensitive (passwords, payment card data, personal identifiers) warrant a finding regardless of whether the data is accessible from outside.

## Tools

- SQLMap: SQL injection detection and exploitation
- MySQL Enterprise Audit, pgAudit: database-native audit logging for monitoring rather than active scanning
- DbProtect (Trustwave): commercial database vulnerability scanner
- `sqlmap`, `nmap --script mysql-*` / `--script pgsql-*`: open-source alternatives for specific checks
