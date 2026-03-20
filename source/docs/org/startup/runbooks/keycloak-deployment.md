# Keycloak deployment

Runbook for deploying Keycloak on the Hetzner cloud instance designated as `auth.golemtrust.am`. Written after the sticky note incident. Adora Belle requires this document be kept current. It is not optional.

## Prerequisites

- Hetzner cloud account with the Finland region available (Helsinki, `hel1`)
- A provisioned CX31 instance running Debian 12 (Bookworm)
- Root or sudo access via SSH key (no password login; Ponder disabled it after a conversation with Vimes)
- A DNS A record pointing `auth.golemtrust.am` at the instance's public IP
- Certbot installed and configured with the Cloudflare DNS plugin for wildcard certificates

## System preparation

Update the base system before touching anything else:

```
apt update && apt upgrade -y
apt install -y curl wget gnupg2 unzip nginx certbot python3-certbot-dns-cloudflare
```

Create a dedicated system user. Keycloak should not run as root. It has been explained to Mr. Pump that this applies to golems as well, though the conversation was one-sided:

```
useradd --system --home /opt/keycloak --shell /bin/false keycloak
```

## Java runtime

Keycloak 26.x requires Java 21. Install the Temurin distribution from Adoptium:

```
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add -
echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" \
  > /etc/apt/sources.list.d/adoptium.list
apt update && apt install -y temurin-21-jdk
java -version
```

## Keycloak installation

Download the latest release. Check the [Keycloak releases page](https://github.com/keycloak/keycloak/releases) for the current version and update the URL accordingly:

```
cd /opt
wget https://github.com/keycloak/keycloak/releases/download/26.1.4/keycloak-26.1.4.tar.gz
tar xzf keycloak-26.1.4.tar.gz
mv keycloak-26.1.4 keycloak
chown -R keycloak:keycloak /opt/keycloak
rm keycloak-26.1.4.tar.gz
```

## Database configuration

Keycloak connects to the PostgreSQL instance on `db.golemtrust.am`. The database and user should already exist (see the PostgreSQL backend runbook). Set the connection details in the Keycloak configuration file:

```
cat > /opt/keycloak/conf/keycloak.conf << 'EOF'
db=postgres
db-url=jdbc:postgresql://db.golemtrust.am:5432/keycloak
db-username=keycloak
db-password=<retrieve from Vaultwarden, collection: Infrastructure>
hostname=auth.golemtrust.am
http-enabled=false
https-certificate-file=/etc/letsencrypt/live/auth.golemtrust.am/fullchain.pem
https-certificate-key-file=/etc/letsencrypt/live/auth.golemtrust.am/privkey.pem
proxy=edge
EOF
```

The password is not to be written anywhere except Vaultwarden. This runbook exists precisely because of what happens when passwords are written somewhere else.

## TLS certificate

Obtain a certificate using the Cloudflare DNS challenge. Place the Cloudflare API token in `/etc/cloudflare.ini` with permissions `600`:

```
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/cloudflare.ini \
  -d auth.golemtrust.am \
  --email ponder@golemtrust.am \
  --agree-tos \
  --non-interactive
```

Add a cron job for renewal:

```
0 3 * * * certbot renew --quiet && systemctl reload keycloak
```

## Nginx reverse proxy

Keycloak handles TLS directly in production mode, but Nginx sits in front to handle rate limiting and to expose port 443. Create `/etc/nginx/sites-available/keycloak`:

```
server {
    listen 80;
    server_name auth.golemtrust.am;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name auth.golemtrust.am;

    ssl_certificate /etc/letsencrypt/live/auth.golemtrust.am/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.golemtrust.am/privkey.pem;

    location / {
        proxy_pass https://localhost:8443;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

```
ln -s /etc/nginx/sites-available/keycloak /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Build and start

Run the build step once to optimise the Keycloak configuration for production:

```
sudo -u keycloak /opt/keycloak/bin/kc.sh build
```

Create the systemd unit at `/etc/systemd/system/keycloak.service`:

```
[Unit]
Description=Keycloak identity provider
After=network.target postgresql.service

[Service]
User=keycloak
Group=keycloak
ExecStart=/opt/keycloak/bin/kc.sh start
Restart=on-failure
RestartSec=10
LimitNOFILE=65536
Environment=KEYCLOAK_ADMIN=admin
Environment=KEYCLOAK_ADMIN_PASSWORD=<retrieve from Vaultwarden, collection: Infrastructure>

[Install]
WantedBy=multi-user.target
```

```
systemctl daemon-reload
systemctl enable keycloak
systemctl start keycloak
```

## Initial realm configuration

Wait approximately two minutes for Keycloak to complete first startup, then log in at `https://auth.golemtrust.am` with the admin credentials.

Create two realms:

`golemtrust-internal` for employees and golems. Configure:
- Password policy: minimum 16 characters, at least one symbol, no dictionary words, expiry 90 days
- OTP required for all human accounts
- Session idle timeout: 8 hours
- Session max: 24 hours

`golemtrust-customer` for the customer portal. Configure:
- Password policy: minimum 12 characters, no expiry (customers find mandatory rotation confusing and simply increment a number)
- OTP available but not required by default; Adora Belle is considering making it mandatory after the Dolly Sisters incident
- Registration flow enabled, with email verification
- Session idle timeout: 2 hours

Hardware authentication devices from Überwald are enrolled by Ponder manually per employee. There is no self-service enrolment until the second device policy is in place.

## Verification

```
curl -s https://auth.golemtrust.am/realms/golemtrust-internal/.well-known/openid-configuration \
  | python3 -m json.tool | head -20
```

The response should include issuer, authorization endpoint, and token endpoint URIs. If it does not, check `journalctl -u keycloak -n 100` and proceed to the troubleshooting section.

## Troubleshooting

If Keycloak fails to start, the most common causes in order of frequency are:

1. The database is unreachable. Check `db.golemtrust.am` is up and the credentials are correct.
2. The TLS certificate path is wrong. `ls -la /etc/letsencrypt/live/auth.golemtrust.am/` and compare with `keycloak.conf`.
3. Java version mismatch. `java -version` should report 21.
4. Port 8443 is already in use. `ss -tlnp | grep 8443`.

Mr. Pump does not experience authentication failures. If the golem authentication provider is failing, see the golem authentication runbook.