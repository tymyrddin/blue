# Database secrets engine setup

Runbook for configuring Vault's database secrets engine to issue dynamic, short-lived PostgreSQL credentials. This replaces static passwords entirely for application database access. The `production-db-passwords.txt` file that Carrot found on day three is not mentioned here because it no longer exists.

## How it works

Applications do not hold database passwords. Instead, they authenticate to Vault using AppRole (see the AppRole runbook), request a database credential, receive a username and password valid for one hour, and use those to connect. When the lease expires, the credential is automatically revoked in PostgreSQL. The application requests a fresh credential before expiry.

This means a leaked credential is useless within an hour. It also means there are no static passwords to rotate, audit, or accidentally commit to Git.

## Prerequisites

- Vault cluster running and unsealed (see the HA deployment and Raft configuration runbooks)
- PostgreSQL running on `db.golemtrust.am` with the `vault` management user created (see below)
- The database secrets engine enabled at the `database` path (done during bootstrap in the Raft configuration runbook)

## PostgreSQL management user

Vault needs a PostgreSQL user with the ability to create and drop roles. Connect to the database server as the postgres superuser:

```
sudo -u postgres psql
```

Create the management user:

```
CREATE USER vault WITH PASSWORD '<generate with: openssl rand -base64 32>';
GRANT CONNECT ON DATABASE keycloak TO vault;
GRANT CONNECT ON DATABASE vaultwarden TO vault;
ALTER USER vault CREATEROLE;
```

The `CREATEROLE` privilege allows Vault to create dynamic users. It does not give Vault the ability to create superusers or modify existing roles other than those it created. Store this password in Vaultwarden under the Infrastructure collection; it is used only in the Vault configuration below and never by application code.

## Configuring the database connection

On the Vault cluster, configure the connection to PostgreSQL. Authenticate to Vault first:

```
export VAULT_ADDR="https://vault.golemtrust.am:8200"
vault login -method=userpass username=carrot.ironfoundersson
```

Configure the keycloak database connection:

```
vault write database/config/keycloak \
  plugin_name=postgresql-database-plugin \
  allowed_roles="keycloak-app" \
  connection_url="postgresql://{{username}}:{{password}}@db.golemtrust.am:5432/keycloak?sslmode=require" \
  username="vault" \
  password="<vault management user password from Vaultwarden>"
```

Configure the vaultwarden database connection:

```
vault write database/config/vaultwarden \
  plugin_name=postgresql-database-plugin \
  allowed_roles="vaultwarden-app" \
  connection_url="postgresql://{{username}}:{{password}}@db.golemtrust.am:5432/vaultwarden?sslmode=require" \
  username="vault" \
  password="<vault management user password from Vaultwarden>"
```

Rotate the management user's password immediately so that only Vault knows it:

```
vault write -force database/rotate-root/keycloak
vault write -force database/rotate-root/vaultwarden
```

After rotation, the password in Vaultwarden is no longer valid. Vault manages it internally. Do not attempt to set this password manually again; doing so will break Vault's connection.

## Creating roles

Define the role for Keycloak application access. The creation statement creates a PostgreSQL role with a generated name, grants it the privileges of the `keycloak` role (which owns the database objects), and sets an expiry:

```
vault write database/roles/keycloak-app \
  db_name=keycloak \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT keycloak TO \"{{name}}\";" \
  revocation_statements="REVOKE keycloak FROM \"{{name}}\"; DROP ROLE IF EXISTS \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"
```

Define the role for Vaultwarden application access:

```
vault write database/roles/vaultwarden-app \
  db_name=vaultwarden \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT vaultwarden TO \"{{name}}\";" \
  revocation_statements="REVOKE vaultwarden FROM \"{{name}}\"; DROP ROLE IF EXISTS \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"
```

## Verification

Generate a test credential for the keycloak role:

```
vault read database/creds/keycloak-app
```

The output should include a `username` and `password`. Verify that these credentials can connect to the database:

```
psql -h db.golemtrust.am -U <generated username> -d keycloak -c "SELECT current_user;"
```

List current leases to confirm it appears:

```
vault list sys/leases/lookup/database/creds/keycloak-app/
```

Revoke it manually to confirm revocation works:

```
vault lease revoke database/creds/keycloak-app/<lease-id>
```

Attempt the database connection again with the same credentials. It should now be refused.

## Policies

Create a Vault policy for each application that permits reading credentials for its role only:

```
vault policy write keycloak-db - << 'EOF'
path "database/creds/keycloak-app" {
  capabilities = ["read"]
}
EOF

vault policy write vaultwarden-db - << 'EOF'
path "database/creds/vaultwarden-app" {
  capabilities = ["read"]
}
EOF
```

These policies are assigned to AppRole roles in the AppRole runbook. An application that can read `keycloak-app` credentials cannot read `vaultwarden-app` credentials. This is deliberate.

## Credential renewal

Application code should renew credentials before they expire rather than waiting for expiry and requesting new ones. The Vault client libraries handle this automatically if configured. The maximum TTL of 24 hours exists as an absolute upper bound; it should not be used routinely. The default one-hour TTL is the normal operating window.

If an application is reporting database authentication failures, check whether its Vault token has expired first, then whether the database credential lease has expired. Both must be valid for the application to connect.