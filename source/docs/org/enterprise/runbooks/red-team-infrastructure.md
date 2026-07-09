# Red team infrastructure setup

Mr. Teatime requires a workspace that is entirely his own. Not because he is secretive by nature, though he is, but because any connection between the red team's attack tooling and Golem Trust's production environment would be a catastrophic mistake. The infrastructure described here is physically and logically separate from everything else the Trust operates. When Mr. Teatime's tools attempt to scan a subnet, they are scanning the right subnet.

## Hetzner project structure

The red team operates under a dedicated Hetzner Cloud project named `golemtrust-redteam`. This project has no VPC peering, no shared SSH keys, and no shared service accounts with the primary `golemtrust` project. Invoicing is tracked separately so red team infrastructure costs appear in their own cost centre.

The project is provisioned and maintained exclusively by Mr. Teatime and the two designated team members from Überwald. No other Golem Trust engineer has access. Adora Belle holds the emergency recovery credentials in Vaultwarden under the `red-team-emergency` entry, sealed with her personal YubiKey.

## Virtual machines

Four VMs run permanently in the `golemtrust-redteam` project:

| Hostname | Type | Purpose |
|---|---|---|
| `kali-1.redteam` | CX31 | Primary Kali Linux attack box |
| `kali-2.redteam` | CX31 | Secondary Kali Linux attack box |
| `caldera.redteam` | CX41 | Caldera adversary emulation server |
| `mythic.redteam` | CX41 | Mythic C2 framework |
| `phishing.redteam` | CX21 | GoPhish phishing server |

All VMs run Debian 12 as base, except the Kali boxes which use the official Kali Linux cloud image. All disks are encrypted at rest using Hetzner's managed encryption.

## Network layout

The red team network is isolated. No Headscale node is enrolled in this project. No routes to `10.0.0.0/8` (the main Golem Trust internal range) exist. The red team VMs communicate only with each other and with the public internet.

```
golemtrust-redteam VPC: 192.168.100.0/24

kali-1:       192.168.100.10
kali-2:       192.168.100.11
caldera:      192.168.100.20
mythic:       192.168.100.21
phishing:     192.168.100.30

No peering routes.
No Headscale peers.
Outbound internet: NAT gateway 192.168.100.1
Inbound: Teleport node only (TCP 3022)
```

During an engagement, targets in the production environment are reached via the public internet, using the same paths a real attacker would use. The red team does not use internal shortcuts.

## Caldera installation

Caldera runs on `caldera.redteam` using Docker Compose. The installation uses the official MITRE Caldera image.

```
# /opt/caldera/docker-compose.yml

services:
  caldera:
    image: ghcr.io/mitre/caldera:latest
    container_name: caldera
    restart: unless-stopped
    ports:
      - "8888:8888"
      - "7010:7010"
      - "7011:7011/udp"
      - "7012:7012"
    volumes:
      - ./conf:/usr/src/app/conf
      - ./data:/usr/src/app/data
      - ./plugins:/usr/src/app/plugins
    environment:
      - CALDERA_CONFIG=/usr/src/app/conf/local.yml
```

After first boot, the default admin credentials (`admin:admin`) must be changed immediately. Mr. Teatime uses a generated passphrase stored in Vaultwarden.

```
# First-run credential change via Caldera API
curl -s -X PATCH http://localhost:8888/api/v2/users/admin \
  -H "KEY: ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password": "NEW_PASSPHRASE_FROM_VAULT"}'
```

Plugins enabled in `conf/local.yml`:

```
plugins:
  - stockpile
  - sandcat
  - compass
  - debrief
  - manx
  - response
```

The `stockpile` plugin provides the library of adversary profiles and abilities. The `sandcat` plugin provides the default agent (a Go binary that beacons back to the Caldera server). The `debrief` plugin generates post-engagement reports.

## Mythic C2 framework

Mythic runs on `mythic.redteam` for engagements that require a more capable C2 than Caldera's built-in agent. Installation follows the official Mythic documentation.

```
cd /opt/mythic
git clone https://github.com/its-a-feature/Mythic .
./mythic-cli install github https://github.com/MythicAgents/Apollo
./mythic-cli install github https://github.com/MythicC2Profiles/http
./mythic-cli start
```

Mythic is only started when an engagement is active. The service is stopped between engagements to reduce the attack surface of the red team infrastructure itself.

## GoPhish phishing server

The phishing server runs GoPhish on `phishing.redteam`. A separate domain is registered for each engagement (e.g., `golemtrust-portal.com` for the first engagement, now expired). TLS certificates are obtained via Let's Encrypt.

```
# /etc/gophish/config.json
{
  "admin_server": {
    "listen_url": "127.0.0.1:3333",
    "use_tls": true,
    "cert_path": "/etc/gophish/admin.crt",
    "key_path": "/etc/gophish/admin.key"
  },
  "phish_server": {
    "listen_url": "0.0.0.0:443",
    "use_tls": true,
    "cert_path": "/etc/letsencrypt/live/CAMPAIGN_DOMAIN/fullchain.pem",
    "key_path": "/etc/letsencrypt/live/CAMPAIGN_DOMAIN/privkey.pem"
  },
  "db_name": "sqlite3",
  "db_path": "gophish.db",
  "migrations_prefix": "db/db_",
  "contact_address": "",
  "logging": {
    "filename": "/var/log/gophish/gophish.log",
    "level": ""
  }
}
```

## Access control

Access to all red team infrastructure is via Teleport, using the `red-team-operator` role. This role is only assignable by Carrot and is reviewed quarterly.

```
# Teleport role definition: red-team-operator
kind: role
version: v6
metadata:
  name: red-team-operator
spec:
  allow:
    logins: ["redteam", "root"]
    node_labels:
      project: "redteam"
    rules:
      - resources: ["session"]
        verbs: ["list", "read"]
  deny:
    node_labels:
      project: ["production", "staging", "golemtrust"]
```

The `deny` block is belt-and-braces. The network isolation is the primary control; Teleport RBAC is the secondary.

## Activity logging

All red team activity is logged to a dedicated Graylog instance running on `caldera.redteam` (a separate Graylog container in the same Docker Compose stack). This instance is not connected to the main Golem Trust Graylog cluster.

Logs captured:

- All Teleport session recordings from the red team nodes
- Caldera operation logs (exported as JSON after each engagement)
- Mythic operation logs
- GoPhish campaign results
- Shell history from all VMs (via `PROMPT_COMMAND` hook writing to syslog)

Post-engagement, the Graylog instance is snapshotted and the snapshot is transferred to the main Golem Trust Hetzner Object Storage under the `red-team-archives` bucket. The snapshot is encrypted with Mr. Teatime's GPG key and Carrot's GPG key (both required for decryption).

## Maintenance

Red team VMs are rebuilt from scratch before each major engagement using an Ansible playbook at `ansible/red-team/provision.yml`. This prevents tool and configuration drift between engagements, and ensures no artefacts from a previous engagement inadvertently affect the next.

Security patches are applied weekly via an automated unattended-upgrades configuration, even between engagements.
