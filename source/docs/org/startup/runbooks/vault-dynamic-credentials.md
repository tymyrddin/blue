# Dynamic credentials workflows

Runbook for working with dynamic credentials day-to-day: how applications consume them, how to inspect and revoke leases, how to handle credential failures, and how to manage lease TTLs. This runbook assumes the database secrets engine is configured (see the database secrets engine runbook) and AppRole authentication is in place (see the AppRole runbook).

## Normal operation

In normal operation, nothing in this runbook needs to be done. Applications authenticate with AppRole, request database credentials from the `database/creds/<role>` path, receive a username and password, and connect to PostgreSQL. Vault tracks the lease. When the lease approaches expiry, the application renews it. When the application shuts down cleanly, it revokes the lease. Vault revokes any unreturned leases automatically on expiry.

This is the intended state. The rest of this runbook covers what to do when it is not the intended state.

## Inspecting active leases

To see all active leases for a database role:

```
vault list sys/leases/lookup/database/creds/keycloak-app/
```

To inspect a specific lease:

```
vault read sys/leases/lookup/database/creds/keycloak-app/<lease-id>
```

The output shows the lease expiry time, whether it is renewable, and how many times it has been renewed. A lease that has been renewed many times approaching its maximum TTL will not renew further; the application needs to re-authenticate and request a fresh credential.

To see how many active database roles currently exist in PostgreSQL (useful for confirming leases are being cleaned up correctly):

```
sudo -u postgres psql -c "SELECT usename, valuntil FROM pg_user WHERE usename LIKE 'v-keycloak%' ORDER BY valuntil;"
```

Vault-created users follow the naming pattern `v-<role>-<random>`. If this list is long and growing, leases are not being revoked properly and the application code should be investigated.

## Revoking a single lease

If a credential is suspected to be compromised, revoke its lease immediately:

```
vault lease revoke database/creds/keycloak-app/<lease-id>
```

Vault will call the revocation statement defined in the role configuration, which drops the PostgreSQL role immediately. The application will experience a database authentication failure on its next query and should request a fresh credential. If the application does not handle this gracefully, it may need to be restarted.

## Revoking all leases for a role

If a broader compromise is suspected, revoke all active leases for a role at once:

```
vault lease revoke -prefix database/creds/keycloak-app/
```

This drops all dynamic users for that role in PostgreSQL immediately. All applications using credentials from that role will lose their database connections simultaneously. Use this in response to a confirmed security incident, not as a precaution.

After a mass revocation, applications will need to re-authenticate with Vault and request fresh credentials. If the AppRole Secret ID is also suspected to be compromised, rotate it first (see the AppRole runbook) so that only authorised applications can obtain new credentials.

## Adjusting TTLs

The default TTL of one hour and maximum TTL of 24 hours were chosen by Carrot and Ludmilla after some debate. Ludmilla wanted 15 minutes; Carrot suggested one hour as a balance between security and the operational complexity of frequent renewals. If requirements change, update the role:

```
vault write database/roles/keycloak-app \
  db_name=keycloak \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT keycloak TO \"{{name}}\";" \
  revocation_statements="REVOKE keycloak FROM \"{{name}}\"; DROP ROLE IF EXISTS \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"
```

Changes to the role definition apply to new credentials only. Existing leases continue under the TTL they were issued with.

## Handling application credential failures

If an application reports database authentication failures, work through the following in order:

1. Check whether the application's Vault token is still valid. An expired Vault token means the application cannot request database credentials at all. Check the application logs for Vault 403 responses.

2. Check whether the credential lease has expired. If the application is not renewing its lease, credentials will be revoked at the default TTL. This is an application configuration issue.

3. Check whether the PostgreSQL role still exists. `SELECT usename FROM pg_user WHERE usename LIKE 'v-keycloak%';` If the role is absent but the lease is still active in Vault, the PostgreSQL role may have been manually deleted. Revoke the orphaned lease and let the application request a fresh one.

4. Check whether the Vault database connection to PostgreSQL is healthy. `vault read database/config/keycloak` should show the connection as valid. If Vault cannot reach PostgreSQL, no credentials can be issued to any application.

## KV secrets for non-database credentials

Not all secrets are database credentials. API keys, webhook secrets, and external service tokens are stored in the KV v2 engine at the `kv` path. These are static secrets; they do not rotate automatically.

Write a secret:

```
vault kv put kv/golemtrust/fastmail-api-key value=<key>
```

Read a secret:

```
vault kv get kv/golemtrust/fastmail-api-key
```

Get the value only, suitable for use in scripts:

```
vault kv get -field=value kv/golemtrust/fastmail-api-key
```

List all secrets at a path:

```
vault kv list kv/golemtrust/
```

KV v2 keeps a version history. To retrieve an older version:

```
vault kv get -version=2 kv/golemtrust/fastmail-api-key
```

Static secrets in KV should be rotated manually on a regular schedule and whenever a team member with access to them leaves. There is no automatic rotation for KV secrets.