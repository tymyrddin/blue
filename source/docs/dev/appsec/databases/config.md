# Database configuration hardening

Default database configurations optimise for ease of installation, not security. Several settings worth reviewing on initial deployment:

| Database   | Setting                            | Effect                                                                            |
|------------|------------------------------------|-----------------------------------------------------------------------------------|
| MySQL      | `SET GLOBAL local_infile=OFF;`     | Disables `LOAD DATA LOCAL INFILE`, which can read arbitrary files from the client |
| PostgreSQL | `ALTER SYSTEM SET ssl = 'on';`     | Enforces TLS for connections                                                      |
| MongoDB    | `enableLocalhostAuthBypass: false` | Prevents unauthenticated access even from localhost                               |
| Redis      | `bind 127.0.0.1` in `redis.conf`   | Restricts to loopback interface only                                              |

## TLS configuration

Encrypting connections in transit extends to private networks. Internal network traffic is readable to anyone with access to the network, and cloud environments route inter-service traffic through infrastructure that is not exclusively controlled by the application owner.

PostgreSQL TLS setup requires a certificate and key:

```bash
# generate a self-signed certificate for development
openssl req -new -x509 -days 365 -nodes \
  -out server.crt -keyout server.key \
  -subj "/CN=postgres"
```

```
# postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

For production, certificates from an internal CA or Let's Encrypt are preferable to self-signed ones, since clients can verify the server identity.

## Encryption at rest

Most open-source database editions do not include transparent data encryption. Options:

- Filesystem-level encryption (dm-crypt/LUKS on Linux, BitLocker on Windows) encrypts the database files on disk. The database itself is unaware of the encryption; it operates on plaintext after the OS decrypts it.
- SQLCipher is an open-source SQLite extension that encrypts the database file at the page level.
- Cloud-managed databases (RDS, Cloud SQL, Azure Database) typically offer encryption at rest by default using platform-managed or customer-managed keys.

Encryption at rest protects against physical media theft or misconfigured backups. It does not protect against a running database with its decryption key loaded.

## Disabling unused features

Features that are not needed are worth disabling rather than leaving as a latent attack surface:

- MySQL `LOAD DATA LOCAL INFILE`: reads files from the client host; disabled with `local_infile=0`
- MongoDB `$where` evaluation: executes JavaScript; disabled by default since 4.4
- PostgreSQL `pg_read_file()` and related functions: available only to superusers; application accounts benefit from not being superusers
