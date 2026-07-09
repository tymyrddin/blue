# Headscale deployment

Runbook for deploying Headscale as the self-hosted control plane for the Golem Trust zero-trust network. Headscale replaces Tailscale's cloud coordination service; every node runs the standard Tailscale client but registers with the Golem Trust Headscale instance instead of with Tailscale's servers. This satisfies Mr. Bent's requirement that all coordination traffic remain within Golem Trust's infrastructure and jurisdiction.

## Architecture

Headscale runs on a dedicated Hetzner CX21 instance in Helsinki at `headscale.golemtrust.am` (`10.0.5.1`). It is not itself on the Tailscale network it manages; it sits outside it and coordinates it. All production nodes register with Headscale at `https://headscale.golemtrust.am:443` and receive WireGuard configuration that enables direct peer-to-peer connections.

When direct connections are not possible (NAT, firewall traversal, or nodes in different datacentres that have not yet established a direct path), traffic is relayed through the DERP servers (see the DERP server setup runbook). DERP traffic is encrypted end-to-end with WireGuard; the DERP server cannot read it.

## Prerequisites

- A Hetzner CX21 instance running Debian 12 at `headscale.golemtrust.am`
- DNS A record for `headscale.golemtrust.am` pointing to the instance's public IP
- TLS certificate for `headscale.golemtrust.am` (Certbot with Cloudflare DNS)
- PostgreSQL database `headscale` and user `headscale` on `db.golemtrust.am`

## Installation

```
HEADSCALE_VERSION="0.23.0"
wget "https://github.com/juanfont/headscale/releases/download/v${HEADSCALE_VERSION}/headscale_${HEADSCALE_VERSION}_linux_amd64.deb"
dpkg -i "headscale_${HEADSCALE_VERSION}_linux_amd64.deb"
```

Headscale installs as a systemd service. It does not start automatically; configure it first.

## Configuration

Create the configuration directory and copy the default configuration:

```
mkdir -p /etc/headscale
cp /usr/share/doc/headscale/config-example.yaml /etc/headscale/config.yaml
```

Edit `/etc/headscale/config.yaml`. Key settings:

```
server_url: https://headscale.golemtrust.am

listen_addr: 0.0.0.0:8080
metrics_listen_addr: 127.0.0.1:9090

private_key_path: /var/lib/headscale/private.key
noise:
  private_key_path: /var/lib/headscale/noise_private.key

ip_prefixes:
  - 100.64.0.0/10

db_type: postgres
db_host: db.golemtrust.am
db_port: 5432
db_name: headscale
db_user: headscale
db_pass: "<retrieve from Vaultwarden, collection: Infrastructure>"

tls_cert_path: /etc/letsencrypt/live/headscale.golemtrust.am/fullchain.pem
tls_key_path: /etc/letsencrypt/live/headscale.golemtrust.am/privkey.pem

dns_config:
  magic_dns: true
  base_domain: ts.golemtrust.am
  nameservers:
    - 1.1.1.1

derp:
  server:
    enabled: false
  urls:
    - https://headscale.golemtrust.am/derpmap.json
  auto_update_enabled: false
  update_frequency: 24h

acls_policy_path: /etc/headscale/acls.hujson

log:
  level: warn
```

The `ip_prefixes` range `100.64.0.0/10` is the Carrier-Grade NAT range used by Tailscale. All nodes on the Tailscale network receive addresses in this range. The range does not overlap with the Hetzner private network (`10.0.0.0/8`), which remains for direct server-to-server communication where Headscale is not involved.

The DERP map is served by Headscale itself. The `derpmap.json` configuration is documented in the DERP server setup runbook.

## Starting Headscale

```
systemctl enable headscale
systemctl start headscale
headscale version
```

## Creating namespaces

Headscale organises nodes into namespaces (called "users" in newer versions). Create namespaces for each logical group:

```
headscale users create infrastructure
headscale users create banking-ops
headscale users create soc-team
headscale users create vendor-access
```

Nodes are registered into a specific namespace. ACL rules reference namespace names to control which namespaces can reach which services.

## Registering nodes

On each server that should join the zero-trust network, install the Tailscale client:

```
curl -fsSL https://tailscale.com/install.sh | sh
```

Register the node with Headscale. Generate a pre-authentication key for the relevant namespace:

```
headscale preauthkeys create --user infrastructure --expiration 1h --reusable
```

On the server being registered:

```
tailscale up --login-server https://headscale.golemtrust.am \
  --authkey <preauthkey> \
  --hostname auth-server \
  --accept-routes
```

Confirm the node appears in Headscale:

```
headscale nodes list
```

Repeat for every production server. Assign each server to the `infrastructure` namespace. Banking operations workstations go in `banking-ops`. SOC team workstations go in `soc-team`.

## Nginx reverse proxy

Headscale's gRPC and HTTP interfaces need to be reachable on standard HTTPS. Create `/etc/nginx/sites-available/headscale`:

```
server {
    listen 80;
    server_name headscale.golemtrust.am;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name headscale.golemtrust.am;

    ssl_certificate /etc/letsencrypt/live/headscale.golemtrust.am/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/headscale.golemtrust.am/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

```
ln -s /etc/nginx/sites-available/headscale /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Verification

List all registered nodes and confirm they show as online:

```
headscale nodes list
```

From any registered node, confirm connectivity to another:

```
tailscale ping auth-server
tailscale status
```

The `tailscale ping` result should show a direct connection or a DERP relay path. Once the DERP servers are operational (see the DERP server setup runbook), all nodes should be able to reach each other regardless of their network position.
Last updated: 10 July 2026
