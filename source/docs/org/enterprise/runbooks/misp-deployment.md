# MISP deployment

Angua had noticed the pattern three separate times before realising she had no way to verify whether anyone else had seen it. The Circle Sea Information Sharing and Analysis Centre existed precisely to answer that question, but Golem Trust needed its own threat intelligence platform before it could participate meaningfully. Dr. Crucible selected MISP as the platform: mature, widely used across the sector, and capable of consuming feeds from multiple sources while sharing intelligence outward. This runbook covers the Docker-based MISP deployment on a Hetzner CX32 instance, external service configuration, TLS via Vault PKI, Keycloak SAML authentication, initial organisation setup, API key generation, and backup procedures.

## Infrastructure

MISP runs at `misp.golemtrust.am` on a Hetzner CX32 instance (4 vCPU, 8 GB RAM, Ubuntu 22.04 LTS). It is accessible only via the Headscale private network; there is no public IP. External threat intelligence services connect via the outbound NAT gateway. The MISP database runs on the shared database server at `db.golemtrust.am` and Redis runs as a local container.

Resource requirements for the CX32:

- MISP web application and API: moderate CPU, approximately 2 GB RAM under load
- MISP workers (background jobs for feed pulls and event processing): 4 worker processes, each up to 512 MB RAM
- Redis (local): minimal resource usage

## Prerequisites

- Docker and Docker Compose installed on the CX32 instance
- PostgreSQL database `misp` and user `misp_user` created on `db.golemtrust.am`
- TLS certificate for `misp.golemtrust.am` issued by Vault PKI
- Keycloak SAML client `misp` configured in the `golemtrust` realm
- GPG key pair for MISP event signing (generated during initial setup, stored in Vaultwarden)

## Docker installation

Clone the official MISP Docker repository and create a local environment file:

```
git clone https://github.com/MISP/misp-docker.git /opt/misp
cd /opt/misp
cp template.env .env
```

Edit `.env` with site-specific values:

```
MISP_BASEURL=https://misp.golemtrust.am
MISP_ADMIN_EMAIL=angua@golemtrust.am
MISP_ADMIN_PASSPHRASE=${MISP_ADMIN_PASSWORD}
MISP_ORG=Golem Trust
MYSQL_HOST=db.golemtrust.am
MYSQL_PORT=3306
MYSQL_DATABASE=misp
MYSQL_USER=misp_user
MYSQL_PASSWORD=${MYSQL_PASSWORD}
REDIS_FQDN=redis
WORKERS=4
```

Note that MISP's Docker image uses MySQL protocol even with PostgreSQL backends in some configurations; confirm the database compatibility with the version in use. The current deployment uses the MySQL-protocol-compatible MariaDB driver on `db.golemtrust.am`.

## Docker Compose configuration

The override file adds TLS volume mounts and adjusts the nginx configuration:

```
version: "3.8"

services:
  misp:
    image: ghcr.io/misp/misp-docker/misp-core:v2.4.185
    env_file: .env
    volumes:
      - misp-data:/var/www/MISP/app/files
      - misp-logs:/var/www/MISP/app/tmp/logs
    restart: unless-stopped

  misp-modules:
    image: ghcr.io/misp/misp-docker/misp-modules:latest
    restart: unless-stopped

  misp-nginx:
    image: nginx:1.25-alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - /etc/misp/tls:/etc/nginx/ssl:ro
      - ./nginx.conf:/etc/nginx/conf.d/misp.conf:ro
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  misp-workers:
    image: ghcr.io/misp/misp-docker/misp-core:v2.4.185
    env_file: .env
    command: ["/start-workers.sh"]
    restart: unless-stopped

volumes:
  misp-data:
  misp-logs:
```

TLS certificates from Vault PKI are placed in `/etc/misp/tls/` and renewed by a cron job 30 days before expiry.

## Initial startup

```
docker compose up -d
```

Wait approximately two minutes for MISP to complete its initial database setup, then access the admin interface at `https://misp.golemtrust.am`. Log in with the admin credentials from `.env`.

## Initial MISP configuration

Set the organisation name and contact details in `Administration`, `Server Settings & Maintenance`, `MISP`:

```
MISP.org: Golem Trust
MISP.contact: angua@golemtrust.am
MISP.baseurl: https://misp.golemtrust.am
MISP.email: misp@golemtrust.am
MISP.uuid: (auto-generated; record this in the key register)
```

Generate and configure the GPG key for event signing. In the administration panel, navigate to `Server Settings`, `GPG` and follow the key generation wizard. Export the public key and publish it to the Circle Sea ISAC key server so that partners can verify signed events.

## Keycloak SAML authentication

In Keycloak, create a SAML client for MISP:

```
Client ID: misp.golemtrust.am
Protocol: saml
Root URL: https://misp.golemtrust.am
Valid Redirect URIs: https://misp.golemtrust.am/users/login
Name ID Format: email
Signing keys: use Keycloak's realm signing key
```

In MISP, configure SAML in `Administration`, `Server Settings`, `Plugin`:

```
Plugin.Auth_saml_enable: true
Plugin.Auth_saml_sp_acs: https://misp.golemtrust.am/users/login
Plugin.Auth_saml_idp_issuer: https://keycloak.golemtrust.am/realms/golemtrust
Plugin.Auth_saml_idp_sso_url: https://keycloak.golemtrust.am/realms/golemtrust/protocol/saml
Plugin.Auth_saml_attribute_username: email
Plugin.Auth_saml_attribute_org: golemtrust_org
```

After SAML is configured, Angua, Dr. Crucible, Cheery, and Carrot can log in using their Keycloak credentials. The `misp-admin` local account remains active for emergency access.

## API key generation per integration

Each downstream integration receives its own MISP API key. Generate keys in `Administration`, `List Users`:

```
Integration: Suricata IDS
User: misp-suricata@golemtrust.am
Role: Sync User (read-only, no publishing rights)
API key: stored in Vault at secret/misp/api-keys/suricata

Integration: Graylog lookup table
User: misp-graylog@golemtrust.am
Role: Sync User
API key: stored in Vault at secret/misp/api-keys/graylog

Integration: nftables firewall blocklist
User: misp-firewall@golemtrust.am
Role: Sync User
API key: stored in Vault at secret/misp/api-keys/firewall

Integration: DefectDojo CVE matching
User: misp-defectdojo@golemtrust.am
Role: Sync User
API key: stored in Vault at secret/misp/api-keys/defectdojo
```

## Backup

A cron job runs daily at 03:00, exporting all MISP events and attributes and uploading to Hetzner Object Storage:

```
#!/bin/bash
set -euo pipefail
DATE=$(date +%Y%m%d)

# Export all events as MISP JSON format
docker exec misp-misp-1 /var/www/MISP/app/Console/cake Admin exportEventsToFile \
  /tmp/misp-backup-${DATE}.json

# Upload to object storage
s3cmd put /tmp/misp-backup-${DATE}.json \
  s3://golemtrust-backups/misp/misp-events-${DATE}.json

rm /tmp/misp-backup-${DATE}.json
```

Additionally, the MariaDB database is dumped nightly via `mysqldump` from `db.golemtrust.am` and stored in the same bucket. Both the event export and the database dump are required for a full restore; the event export provides a human-readable record even if the database restore fails.
Last updated: 20 March 2026
