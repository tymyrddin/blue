# StrongDM deployment

Runbook for deploying StrongDM as the database access proxy for Royal Bank systems. StrongDM sits between applications and databases, logging every query, enforcing time-limited access, and ensuring credentials are never shared or stored on client machines. Mr. Bent's audit requirements made this necessary; his grade went from A-minus to A after it was implemented.

## Why StrongDM alongside Vault

Vault's database secrets engine issues short-lived credentials (see the startup runbooks). StrongDM provides a different layer: it proxies the database connection itself, recording the query stream, and integrating with an approval workflow before access is granted. They address different concerns:

Vault ensures credentials are short-lived and never static. StrongDM ensures that every query is logged and that access requires explicit approval. For the Royal Bank's requirements, both are needed: Vault for credential lifecycle, StrongDM for session auditing and the seven-year retention requirement.

## Architecture

StrongDM runs as a gateway process on a dedicated Hetzner CX21 instance at `strongdm.golemtrust.am` (`100.64.0.14` on the Tailscale network, `10.0.5.10` on the Hetzner private network). Applications connect to the StrongDM gateway, which proxies their queries to the actual database while recording the session.

The gateway is not publicly reachable. It is only accessible via the Tailscale network; the Hetzner firewall blocks all inbound traffic except from `100.64.0.0/10` (the Tailscale range).

## Prerequisites

- A StrongDM organisation account (strongdm.com). StrongDM is a commercial product; the licence is managed by Adora Belle.
- API credentials for the StrongDM organisation (retrieved from the StrongDM admin console, stored in Vaultwarden under the Infrastructure collection)
- The StrongDM gateway binary downloaded from the StrongDM admin console
- A Hetzner CX21 instance at `strongdm.golemtrust.am` running Debian 12

## Gateway installation

Download the StrongDM gateway binary from the admin console. Installation requires an organisation token:

```
curl -J -O -L "https://app.strongdm.com/releases/cli/linux" -o sdm
chmod +x sdm
mv sdm /usr/local/bin/sdm

sdm install --relay \
  --token="<gateway token from StrongDM admin console>" \
  --host=strongdm.golemtrust.am
```

This installs and starts the StrongDM relay as a systemd service. Confirm it appears as online in the StrongDM admin console.

## Registering databases

Register each database that Royal Bank access should flow through. In the StrongDM admin console (or via the `sdm` CLI):

```
sdm admin datasources create postgres \
  --name "Royal Bank Production DB" \
  --hostname bank-db-01.ts.golemtrust.am \
  --port 5432 \
  --database royalbank \
  --username vault-proxy \
  --password "<dynamic password from Vault: rotate on each access cycle>"
```

The `vault-proxy` user is a PostgreSQL account created specifically for StrongDM. It has the same privileges as the application user for the Royal Bank database, but its credentials are rotated by Vault after each StrongDM session closes. This ensures that even if a StrongDM session log is compromised, the credentials in it are already invalid.

Configure Vault to rotate the `vault-proxy` credentials. Add to the Vault database secrets engine (see the startup runbooks for the pattern):

```
vault write database/roles/strongdm-proxy \
  db_name=royalbank \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT royalbank_app TO \"{{name}}\";" \
  revocation_statements="REVOKE royalbank_app FROM \"{{name}}\"; DROP ROLE IF EXISTS \"{{name}}\";" \
  default_ttl="4h" \
  max_ttl="4h"
```

StrongDM fetches fresh credentials from Vault before each approved session. The integration between StrongDM and Vault uses a service token with the `strongdm-proxy` policy, stored in Vaultwarden under the Infrastructure collection.

## User accounts

Bank employees authenticate to StrongDM using their Royal Bank identity, federated via SAML (see the SAML federation runbook). Golem Trust staff authenticate using their Golem Trust Keycloak identity.

Create accounts for Golem Trust staff in the StrongDM admin console. Assign the `banking-dba` role, which permits access to Royal Bank databases subject to approval.

Bank employees who need direct database access (rare; most access is application-mediated) have accounts created by Carrot following a formal request from the Royal Bank's IT department.

## Session recording destination

StrongDM records all database sessions and ships them to an S3-compatible endpoint. Configure the destination in the StrongDM admin console under Settings, then Audit Logs.

Use a Hetzner Object Storage bucket at `s3://strongdm-audit.golemtrust.am` for session logs. Hetzner Object Storage is S3-compatible and EU-resident. The bucket is created with:

- Private access only (no public read)
- Object lock enabled with a 7-year retention period (WORM: write once, read many)
- Bucket versioning enabled

Mr. Bent's requirement is seven years of session retention. The object lock enforces this at the storage level; even Ponder cannot delete sessions before the retention period expires. Cheery was pleased when this was explained to her.

Configure bucket credentials in Vaultwarden under the Infrastructure collection. The StrongDM gateway uses these credentials only to write; it cannot delete or overwrite.

## Verification

After installation, confirm the gateway appears in the StrongDM admin console as connected. Attempt a test database connection through StrongDM:

```
sdm connect "Royal Bank Production DB"
psql -h 127.0.0.1 -p <local proxy port> -U vault-proxy -d royalbank -c "SELECT version();"
```

StrongDM assigns a local port for the proxied connection. The connection looks like a local PostgreSQL connection to the client; StrongDM handles the routing and recording transparently.

After the test, confirm the session appears in the StrongDM audit log in the admin console, and that the session recording is visible in the Hetzner Object Storage bucket.

## Monitoring

Add a StrongDM health check to the Prometheus monitoring (see the startup observability runbooks). The StrongDM gateway exposes a health endpoint at `http://localhost:9191/status`.

Create a Graylog alert for StrongDM gateway disconnection: if the gateway goes offline, all database access via StrongDM stops. The alert fires when `source_system: strongdm AND event_type: gateway_offline` appears in any stream.

Send this alert to `#security-alerts` and to Carrot's and Ponder's mobile numbers. A StrongDM outage during Royal Bank business hours is a priority-1 incident.
Last updated: 20 March 2026
