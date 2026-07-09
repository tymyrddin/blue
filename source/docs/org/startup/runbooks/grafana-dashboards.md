# Grafana dashboards

Runbook for deploying Grafana and configuring the dashboards that Adora Belle wants. Grafana runs on the same `metrics.golemtrust.am` instance as Prometheus. It is accessible at `https://grafana.golemtrust.am`. Adora Belle checks it every morning before her first cigarette. The dashboards should be ready before she arrives; they always are.

## Installation

On `metrics.golemtrust.am`:

```
wget -q -O - https://packages.grafana.com/gpg.key | \
  gpg --dearmor | tee /usr/share/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/grafana.gpg] \
  https://packages.grafana.com/oss/deb stable main" \
  | tee /etc/apt/sources.list.d/grafana.list
apt update && apt install -y grafana
```

## Configuration

Edit `/etc/grafana/grafana.ini`. Key settings:

```
[server]
domain = grafana.golemtrust.am
root_url = https://grafana.golemtrust.am/
serve_from_sub_path = false

[security]
admin_user = admin
admin_password = <generate and store in Vaultwarden>
disable_gravatar = true
cookie_secure = true
cookie_samesite = strict

[users]
allow_sign_up = false
auto_assign_org = true
auto_assign_org_role = Viewer

[auth.anonymous]
enabled = false

[smtp]
enabled = true
host = smtp.fastmail.com:465
user = alerts@golemtrust.am
password = <retrieve from Vaultwarden, collection: Infrastructure>
from_address = alerts@golemtrust.am
```

`allow_sign_up = false` means only the admin can create accounts. New team members request access from Adora Belle or Carrot.

```
systemctl enable grafana-server
systemctl start grafana-server
```

## Nginx reverse proxy

Create `/etc/nginx/sites-available/grafana`:

```
server {
    listen 80;
    server_name grafana.golemtrust.am;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name grafana.golemtrust.am;

    ssl_certificate /etc/letsencrypt/live/grafana.golemtrust.am/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/grafana.golemtrust.am/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

```
certbot certonly --dns-cloudflare --dns-cloudflare-credentials /etc/cloudflare.ini \
  -d grafana.golemtrust.am --email crucible@golemtrust.am --agree-tos --non-interactive
ln -s /etc/nginx/sites-available/grafana /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Adding Prometheus as a data source

Log in at `https://grafana.golemtrust.am` with the admin credentials. Navigate to Connections, then Data sources, then Add data source.

- Type: Prometheus
- Name: `Prometheus`
- URL: `http://127.0.0.1:9090`
- Scrape interval: `15s`
- Save and test

The test should return a green confirmation. If it fails, check that Prometheus is running and listening on `127.0.0.1:9090`.

## Dashboards

Import dashboards from the Grafana dashboard library using the dashboard IDs below. Navigate to Dashboards, then Import, enter the ID, and load.

Node overview (ID 1860): system-level metrics for all servers. CPU, memory, disk, and network for each host. Adora Belle uses this to watch overall infrastructure health.

PostgreSQL (ID 9628): query throughput, connection counts, replication lag, index usage. Dr. Crucible added this after the first slow-query incident.

Graylog (use the dashboard exported from a running Graylog instance via System, then Content Packs): message throughput per stream, processing time, journal fill level. Useful for knowing whether Graylog is keeping up with log ingestion.

After importing, configure each dashboard's data source to use the `Prometheus` data source added above. Set the default time range to `Last 24 hours` and the refresh interval to `1m`.

## Custom dashboards

### Security overview

This dashboard was built by Angua and does not have a Grafana library ID; it was created directly. To recreate it:

Create a new dashboard and add the following panels.

Panel: Failed authentication rate
- Query: `rate(graylog_stream_messages_total{stream="authentication-events"}[5m])`
- Visualisation: Time series
- Title: `Authentication events per minute`

Panel: Active HTTP 5xx errors
- Query: `sum(rate(nginx_http_requests_total{status=~"5.."}[5m])) by (host)`
- Visualisation: Time series

Panel: Vault token issuance rate
- Query: `rate(vault_token_creation_total[5m])`
- Visualisation: Stat

Panel: Top source IPs (last hour)
- This panel uses a Graylog data source. Add Graylog as a data source using the Graylog Grafana plugin and configure it to query the `Web access` stream. Dr. Crucible installed the plugin; if it is absent, `grafana-cli plugins install graylog-datasource`.

Save the dashboard and pin it to the home screen. Adora Belle should see it immediately on login.

## Alerting from Grafana

Grafana alerting is used for threshold-based infrastructure alerts that complement Graylog's log-based security alerts. Navigate to Alerting, then Alert rules.

Create an alert for high CPU utilisation:

- Name: `High CPU utilisation`
- Query A: `100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
- Condition: is above `90`
- For: `5m` (must be above threshold for 5 minutes before alerting)
- Contact point: create a Slack contact point using the `#infrastructure-alerts` webhook from Vaultwarden

Create an alert for low disk space:

- Name: `Low disk space`
- Query A: `(node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100`
- Condition: is below `15`
- For: `10m`
- Contact point: Slack `#infrastructure-alerts` and email

These alert on infrastructure problems. Security alerts live in Graylog. Keep the two systems focused on their respective domains; mixing them creates noise and confusion about which system to check when something is wrong.
Last updated: 10 July 2026
