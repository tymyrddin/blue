# OPA deployment

Open Policy Agent runs in two distinct modes at Golem Trust. The first is OPA Gatekeeper, which operates as a Kubernetes admission webhook and enforces policies on every resource created or updated in any cluster. The second is a standalone OPA server, which handles policy queries from Terraform validation pipelines, the StrongDM database access integration, and the API gateway. Dr. Crucible and Ludmilla designed the two-mode architecture because Gatekeeper is tightly coupled to Kubernetes and cannot serve the non-Kubernetes use cases, while the standalone server can serve both. This runbook covers the standalone OPA server deployment; Gatekeeper installation is covered in its own runbook.

## Standalone OPA: binary installation

The standalone OPA server runs as a systemd service on a dedicated VM in each Hetzner region. The binary is downloaded from the Golem Trust internal mirror rather than directly from GitHub:

```
curl -fsSL https://artifacts.golems.internal/opa/v0.68.0/opa_linux_amd64 \
  -o /usr/local/bin/opa
chmod 755 /usr/local/bin/opa
opa version
```

Create the runtime directories and a dedicated system user:

```
useradd --system --no-create-home --shell /usr/sbin/nologin opa
mkdir -p /etc/opa /var/lib/opa/bundles /var/log/opa
chown -R opa:opa /var/lib/opa /var/log/opa
```

## OPA configuration file

Create `/etc/opa/config.yaml`. This configures the bundle server pointing to the GitLab repository, Vault AppRole authentication for fetching policies, decision logging, and the Prometheus metrics endpoint:

```
services:
  gitlab-bundles:
    url: https://gitlab.golems.internal/golem-trust/opa-policies/-/raw/main
    credentials:
      bearer:
        token_path: /var/run/opa/gitlab-token

bundles:
  golem-trust:
    service: gitlab-bundles
    resource: "/bundles/golem-trust-bundle.tar.gz"
    polling:
      min_delay_seconds: 60
      max_delay_seconds: 120
    signing:
      keyid: golem-trust-bundle-key

keys:
  golem-trust-bundle-key:
    key: /etc/opa/bundle-signing-key.pem
    algorithm: RS256
    scope: read

decision_logs:
  console: false
  service: graylog-decisions
  reporting:
    min_delay_seconds: 5
    max_delay_seconds: 30

services:
  graylog-decisions:
    url: https://graylog.golems.internal:12900/api/inputs/opa-decisions

plugins:
  envoy_ext_authz_grpc:
    addr: :9191
    enable_reflection: false

server:
  encoding:
    gzip:
      min_length: 1024
```

## systemd unit

Create `/etc/systemd/system/opa.service`:

```
[Unit]
Description=Open Policy Agent
Documentation=https://www.openpolicyagent.org/
After=network-online.target vault-agent.service
Wants=network-online.target

[Service]
Type=simple
User=opa
Group=opa
ExecStart=/usr/local/bin/opa run \
  --server \
  --addr=0.0.0.0:8181 \
  --diagnostic-addr=0.0.0.0:8282 \
  --config-file=/etc/opa/config.yaml \
  --log-level=info \
  --log-format=json
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s
LimitNOFILE=65536

StandardOutput=journal
StandardError=journal
SyslogIdentifier=opa

[Install]
WantedBy=multi-user.target
```

Enable and start:

```
systemctl daemon-reload
systemctl enable opa
systemctl start opa
```

## Health and metrics endpoints

OPA exposes a health endpoint on the main port and a diagnostics endpoint on 8282. Check health:

```
curl -s http://localhost:8181/health | python3 -m json.tool
```

A healthy response looks like:

```
{
  "bundles": {
    "golem-trust": {
      "last_successful_activation": "2025-11-14T09:00:12.441Z",
      "last_successful_download": "2025-11-14T09:00:11.883Z"
    }
  }
}
```

The Prometheus metrics endpoint is on port 8282:

```
curl -s http://localhost:8282/metrics | grep opa_
```

Key metrics to monitor: `opa_request_duration_seconds`, `opa_bundle_last_success_time_seconds`, and `opa_decision_log_error_count`.

## Vault AppRole authentication

OPA fetches its GitLab token from Vault using AppRole. A Vault agent sidecar runs on the same VM and writes the token to `/var/run/opa/gitlab-token`. The agent configuration is in `/etc/vault-agent/opa-agent.hcl`:

```
auto_auth {
  method "approle" {
    config = {
      role_id_file_path   = "/etc/vault-agent/role-id"
      secret_id_file_path = "/var/run/vault-agent/secret-id"
    }
  }

  sink "file" {
    config = {
      path = "/var/run/opa/gitlab-token"
      mode = 0600
    }
  }
}

template {
  destination = "/var/run/opa/gitlab-token"
  contents    = "{{ with secret \"secret/data/opa/gitlab-token\" }}{{ .Data.data.token }}{{ end }}"
}
```

The Vault role is configured by Cheery with a 1-hour token TTL; the agent renews it automatically. If OPA logs bundle fetch failures, check the token file is present and non-empty:

```
ls -lh /var/run/opa/gitlab-token
```

## Data document loading

Static data documents (such as approved registry lists and country code allow-lists) are included in the signed bundle from GitLab. They are not loaded separately. To inspect what data OPA currently holds:

```
curl -s http://localhost:8181/v1/data | python3 -m json.tool | head -60
```
