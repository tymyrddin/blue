# Prometheus deployment

Runbook for deploying Prometheus for metrics collection. Prometheus runs on a dedicated CX21 instance, `metrics.golemtrust.am`, and scrapes node exporters and application exporters from all production servers. Dr. Crucible deployed it alongside Graylog; Adora Belle reviewed the default dashboards and asked for more. There are now more.

## Prerequisites

- A Hetzner CX21 instance running Debian 12 at `metrics.golemtrust.am` (`10.0.2.10`)
- DNS A record for `metrics.golemtrust.am` and `grafana.golemtrust.am` pointing to this instance (Grafana runs here too; see the Grafana dashboards runbook)
- Node exporter installed on all production servers (covered in this runbook)
- TLS certificate for `grafana.golemtrust.am` (Certbot with Cloudflare DNS)

Prometheus itself does not need a public-facing domain. It listens on `127.0.0.1` only; Grafana queries it locally. Prometheus's own web UI is accessible via SSH tunnel if needed.

## Prometheus installation

On `metrics.golemtrust.am`:

```
PROMETHEUS_VERSION="2.52.0"
wget "https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"
tar xzf "prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"
mv "prometheus-${PROMETHEUS_VERSION}.linux-amd64/prometheus" /usr/local/bin/
mv "prometheus-${PROMETHEUS_VERSION}.linux-amd64/promtool" /usr/local/bin/
rm -rf "prometheus-${PROMETHEUS_VERSION}.linux-amd64"*

useradd --system --no-create-home --shell /bin/false prometheus
mkdir -p /etc/prometheus /var/lib/prometheus
chown prometheus:prometheus /var/lib/prometheus
```

Create the configuration file at `/etc/prometheus/prometheus.yml`:

```
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    environment: production
    organisation: golemtrust

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']

  - job_name: node
    static_configs:
      - targets:
          - 'auth.golemtrust.am:9100'
          - 'db.golemtrust.am:9100'
          - 'graylog-1.golemtrust.am:9100'
          - 'graylog-2.golemtrust.am:9100'
          - 'graylog-3.golemtrust.am:9100'
          - 'vault-1.golemtrust.am:9100'
          - 'vault-2.golemtrust.am:9100'
          - 'vault-3.golemtrust.am:9100'
          - 'vault-transit.golemtrust.am:9100'
          - 'metrics.golemtrust.am:9100'

  - job_name: postgres
    static_configs:
      - targets:
          - 'db.golemtrust.am:9187'

  - job_name: keycloak
    metrics_path: /auth/realms/master/metrics
    static_configs:
      - targets: ['auth.golemtrust.am:8080']
```

Create the systemd unit at `/etc/systemd/system/prometheus.service`:

```
[Unit]
Description=Prometheus
After=network-online.target

[Service]
User=prometheus
Group=prometheus
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus \
  --storage.tsdb.retention.time=90d \
  --web.listen-address=127.0.0.1:9090
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```
systemctl daemon-reload
systemctl enable prometheus
systemctl start prometheus
```

## Node exporter installation

Install on every production server. Run the following on each host:

```
NODE_EXPORTER_VERSION="1.8.0"
wget "https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"
tar xzf "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"
mv "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter" /usr/local/bin/
rm -rf "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64"*

useradd --system --no-create-home --shell /bin/false node_exporter
```

Create `/etc/systemd/system/node_exporter.service`:

```
[Unit]
Description=Node Exporter
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
ExecStart=/usr/local/bin/node_exporter \
  --web.listen-address=10.0.0.X:9100
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Replace `10.0.0.X` with the node's private IP. Node exporter should listen only on the private network interface.

```
systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter
```

Repeat on every server listed in the Prometheus `node` scrape config.

## PostgreSQL exporter

Install on `db.golemtrust.am`:

```
PG_EXPORTER_VERSION="0.15.0"
wget "https://github.com/prometheus-community/postgres_exporter/releases/download/v${PG_EXPORTER_VERSION}/postgres_exporter-${PG_EXPORTER_VERSION}.linux-amd64.tar.gz"
tar xzf "postgres_exporter-${PG_EXPORTER_VERSION}.linux-amd64.tar.gz"
mv "postgres_exporter-${PG_EXPORTER_VERSION}.linux-amd64/postgres_exporter" /usr/local/bin/
```

Create a PostgreSQL user for the exporter:

```
sudo -u postgres psql -c "CREATE USER prometheus WITH PASSWORD '<generate and store in Vaultwarden>';"
sudo -u postgres psql -c "GRANT pg_monitor TO prometheus;"
```

Create `/etc/systemd/system/postgres_exporter.service`:

```
[Unit]
Description=PostgreSQL Exporter
After=network-online.target postgresql.service

[Service]
User=postgres
Environment=DATA_SOURCE_NAME=postgresql://prometheus:<password>@localhost:5432/postgres?sslmode=disable
ExecStart=/usr/local/bin/postgres_exporter --web.listen-address=10.0.0.3:9187
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Alertmanager

Alertmanager handles routing of Prometheus alerts to notification channels. Install on `metrics.golemtrust.am`:

```
AM_VERSION="0.27.0"
wget "https://github.com/prometheus/alertmanager/releases/download/v${AM_VERSION}/alertmanager-${AM_VERSION}.linux-amd64.tar.gz"
tar xzf "alertmanager-${AM_VERSION}.linux-amd64.tar.gz"
mv "alertmanager-${AM_VERSION}.linux-amd64/alertmanager" /usr/local/bin/
mv "alertmanager-${AM_VERSION}.linux-amd64/amtool" /usr/local/bin/
```

Create `/etc/alertmanager/alertmanager.yml`:

```
route:
  receiver: slack-default
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

receivers:
  - name: slack-default
    slack_configs:
      - api_url: '<Slack webhook URL from Vaultwarden>'
        channel: '#infrastructure-alerts'
        title: '[{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

Prometheus infrastructure alerts route to `#infrastructure-alerts`. Security alerts from Graylog route to `#security-alerts`. These are separate channels so that infrastructure noise does not drown out security signals.

## Verification

Check that Prometheus can reach all targets:

```
curl -s http://127.0.0.1:9090/api/v1/targets | python3 -m json.tool | grep '"health"'
```

All targets should show `"health": "up"`. Targets showing `"health": "down"` indicate a scrape failure; check that the exporter is running and that the firewall permits TCP 9100 from `metrics.golemtrust.am` to the target server's private IP.
Last updated: 10 July 2026
