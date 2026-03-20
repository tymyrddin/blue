# Vaultwarden setup

Runbook for deploying Vaultwarden, the Bitwarden-compatible password vault that replaced the sticky note. Vaultwarden runs on the same `auth.golemtrust.am` instance as Keycloak, on a separate subdomain: `vault.golemtrust.am`. Adora Belle has a strong opinion that all credentials should be here. She is correct.

## Prerequisites

- The `auth.golemtrust.am` Hetzner instance is provisioned and running (see the Keycloak deployment runbook)
- A DNS A record for `vault.golemtrust.am` pointing to the same IP as `auth.golemtrust.am`
- PostgreSQL running on `db.golemtrust.am` with the `vaultwarden` database and user created (see the PostgreSQL backend runbook)
- Docker and Docker Compose installed (Vaultwarden runs in a container to keep its dependencies isolated from the Keycloak Java environment)
- An SMTP relay configured for sending Vault invitation and verification emails; Golem Trust uses the Fastmail SMTP relay with an app-specific password

## Docker installation

If Docker is not yet installed:

```
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

Add the `vaultwarden` system user to the docker group if you intend to run the container as a non-root user. Ponder runs the container under root with a restart policy; this can be revisited when there is time, which there never is.

## Directory structure

```
mkdir -p /opt/vaultwarden/data
chown -R 1000:1000 /opt/vaultwarden/data
```

The `data` directory holds attachments, the Vaultwarden configuration, and the RSA keys used to encrypt client data before it reaches the database. Back this up. See the backup procedures runbook.

## Compose file

Create `/opt/vaultwarden/docker-compose.yml`:

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: unless-stopped
    volumes:
      - /opt/vaultwarden/data:/data
    environment:
      DATABASE_URL: "postgresql://vaultwarden:<password>@10.0.0.3:5432/vaultwarden"
      ADMIN_TOKEN: "<retrieve from: generate with openssl rand -base64 48, then store in Infrastructure collection>"
      DOMAIN: "https://vault.golemtrust.am"
      SIGNUPS_ALLOWED: "false"
      INVITATIONS_ALLOWED: "true"
      SMTP_HOST: "smtp.fastmail.com"
      SMTP_FROM: "vault@golemtrust.am"
      SMTP_PORT: "465"
      SMTP_SECURITY: "force_tls"
      SMTP_USERNAME: "vault@golemtrust.am"
      SMTP_PASSWORD: "<retrieve from Vaultwarden, collection: Infrastructure, once bootstrapped>"
      LOG_LEVEL: "warn"
      EXTENDED_LOGGING: "true"
    ports:
      - "127.0.0.1:8888:80"
```

`SIGNUPS_ALLOWED` is false. New users are invited by Adora Belle. Nobody can register themselves. This policy is not open to discussion.

## Nginx configuration

Create `/etc/nginx/sites-available/vaultwarden`:

```
server {
    listen 80;
    server_name vault.golemtrust.am;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name vault.golemtrust.am;

    ssl_certificate /etc/letsencrypt/live/vault.golemtrust.am/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vault.golemtrust.am/privkey.pem;

    client_max_body_size 128M;

    location / {
        proxy_pass http://127.0.0.1:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /notifications/hub {
        proxy_pass http://127.0.0.1:8888;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Obtain the TLS certificate:

```
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/cloudflare.ini \
  -d vault.golemtrust.am \
  --email ponder@golemtrust.am \
  --agree-tos \
  --non-interactive
```

Enable the site and reload Nginx:

```
ln -s /etc/nginx/sites-available/vaultwarden /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Starting Vaultwarden

```
cd /opt/vaultwarden
docker compose up -d
docker compose logs -f
```

Watch the logs for a successful database connection. You should see Vaultwarden report it has applied migrations and is listening. The first start will create all database tables.

## Initial collection setup

Once Vaultwarden is running, log in at `https://vault.golemtrust.am/admin` using the `ADMIN_TOKEN` from the compose file.

Create the following collections under an organisation called `Golem Trust`:

`Infrastructure` covers server credentials, database passwords, API tokens for external services, and TLS-related secrets. Access: Ponder Stibbons and Adora Belle Dearheart.

`Customer Admin` covers the superuser credentials for customer portals and tenancy configurations. Access: Ponder Stibbons, Adora Belle Dearheart, and designated support staff when the team grows.

`Emergency Access` covers the break-glass credentials: the Keycloak admin account, the Vaultwarden admin token, and the PostgreSQL postgres superuser password. Access: Adora Belle Dearheart only, with an emergency access grant to Ponder.

A printed copy of the Emergency Access collection credentials is stored in a sealed envelope in the vault at the Bank of Ankh-Morpork. The envelope is re-sealed and the contents rotated every six months. The rotation date is the first Monday of March and September.

## Inviting the first user

In the admin panel, navigate to Users and invite `adora.belle@golemtrust.am` first. She should be the organisation owner. Then invite `ponder.stibbons@golemtrust.am`. Ponder may attempt to invite himself using the API before this runbook is finished. This is fine.

## Verification

```
curl -s https://vault.golemtrust.am/alive
```

Returns an empty 200 response if Vaultwarden is healthy. If it returns anything else, check `docker compose logs vaultwarden` on the auth server.

## Client configuration

Distribute the Bitwarden desktop, browser, and mobile clients to all team members. Set the server URL to `https://vault.golemtrust.am` in the client settings before logging in. The default `bitwarden.com` server will not work; there is no account there and the data is not there.

Hardware authentication devices from Überwald are configured in account settings under the Two-step Login tab. Each employee enrols their device within 48 hours of receiving it. Adora Belle monitors this. Employees who have not enrolled after 48 hours are sent a reminder. Employees who have not enrolled after 72 hours receive a visit.
