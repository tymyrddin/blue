# DefectDojo deployment

Before DefectDojo, Cheery's vulnerability management process involved a spreadsheet, a great deal of manual deduplication, and a recurring feeling that something important was being missed. "We have 347 open vulnerabilities," she had announced, with the air of someone reporting a municipal problem that had been allowed to fester. DefectDojo provides the single source of truth she needed: a central platform that ingests scanner output from every tool in Golem Trust's stack, deduplicates findings, tracks remediation, enforces SLA timelines, and generates the reports that Otto Chriek and Mr. Bent require quarterly. This runbook covers the Docker Compose deployment, database configuration, Nginx and TLS setup, Keycloak SSO integration, initial product and engagement creation, and backup procedures.

## Infrastructure

DefectDojo runs on a Hetzner CX32 instance at `defectdojo.golemtrust.am`, accessible only via the Headscale private network. Its PostgreSQL backend is hosted on the shared database server at `db.golemtrust.am`. The instance runs Ubuntu 22.04 LTS.

Resource allocation for the CX32 (4 vCPU, 8 GB RAM):

- DefectDojo Django application: 2 Celery workers, 1 Celery beat scheduler, 1 uWSGI application server
- Nginx reverse proxy: handles TLS termination
- Redis: runs locally as a container (low memory requirement for task queue)

## Prerequisites

- Docker and Docker Compose installed on the CX32 instance
- PostgreSQL database `defectdojo` and user `defectdojo_user` created on `db.golemtrust.am`
- TLS certificate issued by Vault PKI for `defectdojo.golemtrust.am` (see the Vault PKI runbook)
- Keycloak client `defectdojo` configured in the `golemtrust` realm (see the Keycloak runbook)

## Clone and configure

```
git clone https://github.com/DefectDojo/django-DefectDojo.git /opt/defectdojo
cd /opt/defectdojo
```

Copy the sample environment file:

```
cp docker/environments/postgres-redis.env.sample .env
```

Edit `.env` with the following values:

```
DD_DATABASE_URL=postgresql://defectdojo_user:${DB_PASSWORD}@db.golemtrust.am:5432/defectdojo
DD_SECRET_KEY=${SECRET_KEY}
DD_ALLOWED_HOSTS=defectdojo.golemtrust.am,localhost
DD_DJANGO_ADMIN_ENABLED=True
DD_SOCIAL_AUTH_KEYCLOAK_ENABLED=True
DD_SOCIAL_AUTH_KEYCLOAK_KEY=defectdojo
DD_SOCIAL_AUTH_KEYCLOAK_SECRET=${KEYCLOAK_CLIENT_SECRET}
DD_SOCIAL_AUTH_KEYCLOAK_PUBLIC_KEY=${KEYCLOAK_PUBLIC_KEY}
DD_SOCIAL_AUTH_KEYCLOAK_AUTHORIZATION_URL=https://keycloak.golemtrust.am/realms/golemtrust/protocol/openid-connect/auth
DD_SOCIAL_AUTH_KEYCLOAK_ACCESS_TOKEN_URL=https://keycloak.golemtrust.am/realms/golemtrust/protocol/openid-connect/token
DD_CELERY_BROKER_URL=redis://redis:6379/0
DD_CELERY_RESULT_BACKEND=redis://redis:6379/0
```

The `${DB_PASSWORD}`, `${SECRET_KEY}`, and `${KEYCLOAK_CLIENT_SECRET}` values are stored in Vault at `secret/defectdojo/` and injected at deployment time by the GitLab CI pipeline.

## Docker Compose configuration

Use the official `docker-compose.yml` with a local override file to pin the image version and configure the external database:

```
version: "3.8"

services:
  defectdojo:
    image: defectdojo/defectdojo-django:2.35.0
    env_file: .env
    depends_on:
      - redis
    volumes:
      - defectdojo-media:/app/media
    restart: unless-stopped

  nginx:
    image: defectdojo/defectdojo-nginx:2.35.0
    ports:
      - "443:8443"
      - "80:8080"
    environment:
      - USE_TLS=true
      - TLS_CERT_PATH=/etc/nginx/ssl/tls.crt
      - TLS_KEY_PATH=/etc/nginx/ssl/tls.key
    volumes:
      - /etc/defectdojo/tls:/etc/nginx/ssl:ro
      - defectdojo-media:/usr/share/nginx/html/media
    restart: unless-stopped

  celeryworker:
    image: defectdojo/defectdojo-django:2.35.0
    env_file: .env
    command: ["bash", "-c", "/start-celery-worker.sh"]
    restart: unless-stopped

  celerybeat:
    image: defectdojo/defectdojo-django:2.35.0
    env_file: .env
    command: ["bash", "-c", "/start-celery-beat.sh"]
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  defectdojo-media:
```

TLS certificates from Vault PKI are placed in `/etc/defectdojo/tls/` on the host. The certificate renewal cron job (using `vault pki issue`) refreshes them 30 days before expiry and sends `docker compose restart nginx`.

## Initial startup and database migration

```
docker compose up -d
docker compose exec defectdojo bash -c "python manage.py migrate"
docker compose exec defectdojo bash -c "python manage.py createsuperuser"
```

Set the superuser password to a strong random value stored in Vaultwarden. After Keycloak SSO is confirmed working, local password login can be restricted for non-admin accounts.

## Keycloak OIDC integration

In the Keycloak `golemtrust` realm, the `defectdojo` client is configured with:

- Client protocol: openid-connect
- Access type: confidential
- Valid redirect URIs: `https://defectdojo.golemtrust.am/complete/keycloak/*`
- Client scopes: `openid`, `profile`, `email`

Keycloak group membership maps to DefectDojo roles via the `DD_SOCIAL_AUTH_KEYCLOAK_ENABLED` settings. Users in the `security-team` Keycloak group are automatically granted the DefectDojo `Security Analyst` role on first login. Cheery holds the `Administrator` role, assigned manually after initial login.

## Create Products and Engagements

DefectDojo organises findings into Products (the system being tested) and Engagements (a specific scanning activity or time period). Create the four initial products via the UI or API:

```
curl -X POST https://defectdojo.golemtrust.am/api/v2/products/ \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Infrastructure", "description": "Hetzner servers and network infrastructure", "prod_type": 1}'

curl -X POST https://defectdojo.golemtrust.am/api/v2/products/ \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Containers", "description": "Kubernetes workloads and container images", "prod_type": 1}'

curl -X POST https://defectdojo.golemtrust.am/api/v2/products/ \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Applications", "description": "Golem Trust application services", "prod_type": 1}'

curl -X POST https://defectdojo.golemtrust.am/api/v2/products/ \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Royal-Bank-Integration", "description": "Integration services for the Royal Bank of Ankh-Morpork", "prod_type": 1}'
```

Create one Engagement per scanner per product, using "CI/CD" engagement type for automated scanners and "Interactive Testing" for penetration tests.

## API token generation for scanner integrations

Each scanner integration uses a dedicated API token. Generate tokens in the DefectDojo UI under "API v2" in the user profile for a dedicated service account user (not a personal account):

- `trivy-integration-token`
- `openvas-integration-token`
- `gitlab-sast-token`
- `wazuh-integration-token`
- `pentest-import-token`

Store all tokens in Vault at `secret/defectdojo/scanner-tokens/`. The scanner integration runbook describes how each scanner retrieves and uses its token.

## Backup

A cron job runs daily at 02:00 on the DefectDojo host, dumping the PostgreSQL database and uploading to Hetzner Object Storage:

```
#!/bin/bash
set -euo pipefail
DATE=$(date +%Y%m%d)
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h db.golemtrust.am \
  -U defectdojo_user \
  defectdojo \
  | gzip > /tmp/defectdojo-backup-${DATE}.sql.gz

s3cmd put /tmp/defectdojo-backup-${DATE}.sql.gz \
  s3://golemtrust-backups/defectdojo/defectdojo-backup-${DATE}.sql.gz

rm /tmp/defectdojo-backup-${DATE}.sql.gz
```

Retention is 30 days of daily backups. The media volume (`defectdojo-media`) is backed up weekly using `s3cmd sync`. Backup success is verified by the Graylog alert that fires if the cron job does not produce a log entry by 03:00 each morning.
Last updated: 20 March 2026
