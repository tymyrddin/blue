# AppRole authentication

Runbook for configuring Vault's AppRole authentication method for application and service access. AppRole gives each application a distinct identity with precisely scoped policies. This replaced the previous arrangement, which Carrot described in his report as "one shared token with full access passed around in environment variables." He underlined this sentence twice.

## How AppRole works

Each application is given a Role ID (a stable identifier, not secret) and a Secret ID (a short-lived credential, treated as a secret). The application presents both to Vault's AppRole endpoint and receives a Vault token scoped to the policies defined for that role. The token has a TTL; the application is responsible for renewing it before expiry or re-authenticating.

Role IDs can be embedded in configuration or environment variables; they are not sensitive on their own. Secret IDs must be delivered securely and rotated regularly. Ludmilla implemented a Secret ID delivery mechanism using a one-time-use wrapped token; the application unwraps it on startup to retrieve the Secret ID. The Secret ID is then valid for a configured period before requiring rotation.

## Prerequisites

- Vault cluster running and AppRole auth enabled at the `approle` path (done during bootstrap in the Raft configuration runbook)
- Policies defined for each application (see the database secrets runbook for the database credential policies)

## Creating an AppRole

The following example creates an AppRole for the Keycloak application. Repeat the pattern for each service that needs Vault access.

Define additional policies as needed. For Keycloak, the policy covers database credentials only:

```
vault policy write keycloak-app - << 'EOF'
path "database/creds/keycloak-app" {
  capabilities = ["read"]
}
path "auth/token/renew-self" {
  capabilities = ["update"]
}
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
EOF
```

Create the AppRole:

```
vault write auth/approle/role/keycloak \
  token_policies="keycloak-app" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=24h \
  secret_id_num_uses=0
```

`secret_id_num_uses=0` means the Secret ID can be used any number of times within its TTL. Set this to `1` for one-time use Secret IDs in high-security contexts. For application authentication at startup, unlimited use within the TTL is generally acceptable.

Fetch the Role ID. This is stable and can be stored in application configuration:

```
vault read auth/approle/role/keycloak/role-id
```

## Delivering the Secret ID

Do not embed the Secret ID in configuration files or environment variables directly. Use response wrapping to deliver it securely. Generate a wrapped Secret ID with a short TTL:

```
vault write -wrap-ttl=5m -f auth/approle/role/keycloak/secret-id
```

This returns a wrapping token, not the Secret ID itself. The wrapping token can be used exactly once, within five minutes, to retrieve the actual Secret ID:

```
VAULT_TOKEN=<wrapping token> vault unwrap
```

The application calls the unwrap endpoint on startup, retrieves the Secret ID, authenticates with it, and discards it. If the wrapping token is intercepted in transit, it can only be used once; if the attacker uses it first, the application fails to start and the failure is visible.

In practice, Ludmilla delivers the wrapping token to applications via a deployment environment variable set at container start time. The token is injected by the deployment system, used once, and gone.

## Authenticating from an application

An application authenticating with AppRole makes the following API call:

```
curl -s -X POST https://vault.golemtrust.am:8200/v1/auth/approle/login \
  -H "Content-Type: application/json" \
  -d "{\"role_id\": \"<role id>\", \"secret_id\": \"<secret id>\"}"
```

The response includes a `client_token` and `lease_duration`. The application stores the token in memory and uses it for subsequent Vault requests. It should schedule a renewal before the TTL expires using the `auth/token/renew-self` endpoint.

## Listing and inspecting roles

```
vault list auth/approle/role/
vault read auth/approle/role/keycloak
```

To see the current Secret ID accessors for a role (not the Secret IDs themselves; those are write-only):

```
vault list auth/approle/role/keycloak/secret-id
```

## Rotating Secret IDs

Generate a new Secret ID for a role:

```
vault write -wrap-ttl=5m -f auth/approle/role/keycloak/secret-id
```

Deliver the wrapping token to the application and trigger a restart. The old Secret ID continues to work until the application has authenticated with the new one; then rotate by destroying the old accessor:

```
vault write auth/approle/role/keycloak/secret-id-accessor/destroy \
  secret_id_accessor=<old accessor>
```

Secret IDs should be rotated whenever a team member who had access to them leaves, whenever a deployment environment is reprovisioned, and on a regular schedule (Carrot suggested quarterly; this is on the calendar).

## Current roles

| Role | Policies | Token TTL | Notes |
|---|---|---|---|
| keycloak | keycloak-app, keycloak-db | 1h | Keycloak application server |
| vaultwarden | vaultwarden-db | 1h | Vaultwarden container |
| backup-agent | vault-snapshot | 8760h | Raft snapshot service |

Add new roles to this table as they are created.
Last updated: 20 March 2026
