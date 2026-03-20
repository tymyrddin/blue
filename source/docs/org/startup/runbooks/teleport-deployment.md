# Teleport deployment

Runbook for deploying Teleport as the single access point for all Golem Trust infrastructure. No server accepts direct SSH connections from outside the private network after this deployment. Everything goes through Teleport. Vimes asked for a recording he could review in court. This is how that recording is made.

## Architecture

Teleport runs as a cluster with one Auth/Proxy node and one or more Agent nodes. At current scale, the Auth and Proxy services run on a single dedicated instance; agents run on every production server.

| Role           | Hostname               | Private IP |
|----------------|------------------------|------------|
| Auth and Proxy | teleport.golemtrust.am | 10.0.4.1   |

Agents run on all other production instances as a `teleport` service in agent mode, connecting back to `teleport.golemtrust.am:3025` to register themselves with the cluster.

The Teleport web UI and proxy are exposed at `https://teleport.golemtrust.am` on port 443. SSH access via Teleport uses port 3022. The Auth server listens on port 3025 (internal only). Reverse tunnels for agents use port 3024.

## Prerequisites

- A Hetzner CX21 instance running Debian 12 at `teleport.golemtrust.am` (`10.0.4.1`)
- DNS A record for `teleport.golemtrust.am` pointing to the instance's public IP
- TLS certificate for `teleport.golemtrust.am` (Certbot with Cloudflare DNS)
- PostgreSQL database `teleport` and user `teleport` on `db.golemtrust.am` (see the PostgreSQL backend runbook for the pattern)
- The Teleport binary downloaded from the [Teleport releases page](https://goteleport.com/docs/upcoming-releases/)

## Installation on the Auth/Proxy node

```
TELEPORT_VERSION="16.4.0"
curl https://cdn.teleport.dev/install-v${TELEPORT_VERSION}.sh | bash
```

Alternatively, install from the Teleport APT repository:

```
curl https://deb.releases.teleport.dev/teleport-pubkey.asc \
  | gpg --dearmor -o /usr/share/keyrings/teleport-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/teleport-keyring.gpg] \
  https://deb.releases.teleport.dev/ stable main" \
  | tee /etc/apt/sources.list.d/teleport.list
apt update && apt install -y teleport
```

## Configuration

Create `/etc/teleport.yaml` on the Auth/Proxy node:

```
teleport:
  nodename: teleport.golemtrust.am
  data_dir: /var/lib/teleport
  log:
    output: stderr
    severity: WARNING
  ca_pin: ""

auth_service:
  enabled: yes
  listen_addr: 0.0.0.0:3025
  cluster_name: golemtrust
  authentication:
    type: local
    second_factor: on
    webauthn:
      rp_id: teleport.golemtrust.am
  session_recording: node
  storage:
    type: postgresql
    conn_string: "postgres://teleport:<password>@db.golemtrust.am:5432/teleport?sslmode=require"

proxy_service:
  enabled: yes
  web_listen_addr: 0.0.0.0:443
  public_addr: teleport.golemtrust.am:443
  https_keypairs:
    - key_file: /etc/letsencrypt/live/teleport.golemtrust.am/privkey.pem
      cert_file: /etc/letsencrypt/live/teleport.golemtrust.am/fullchain.pem
  ssh_public_addr: teleport.golemtrust.am:3022
  tunnel_listen_addr: 0.0.0.0:3024

ssh_service:
  enabled: no
```

The SSH service is disabled on the Auth/Proxy node itself; it does not need to be an SSH target.

```
systemctl enable teleport
systemctl start teleport
```

## Initial setup

After Teleport starts, create the first admin user. This user will be Carrot; Adora Belle will be added next:

```
tctl users add carrot.ironfoundersson \
  --roles=editor,auditor \
  --logins=carrot,root
```

This outputs a one-time invitation URL. Send it to Carrot. He will set a password and register his hardware authentication device from Überwald. MFA is mandatory; the invitation link does not complete without it.

Create Adora Belle's account:

```
tctl users add adora.belle.dearheart \
  --roles=editor,auditor \
  --logins=adora,root
```

## Agent installation on production servers

On each server that should be accessible via Teleport, install the Teleport agent. The agent registers itself with the Auth server and receives an identity from the cluster CA.

Install Teleport using the same method as above, then create `/etc/teleport.yaml`:

```
teleport:
  nodename: auth.golemtrust.am
  data_dir: /var/lib/teleport
  auth_token: /etc/teleport-token
  auth_servers:
    - teleport.golemtrust.am:3025
  log:
    output: stderr
    severity: WARNING

auth_service:
  enabled: no

proxy_service:
  enabled: no

ssh_service:
  enabled: yes
  listen_addr: 0.0.0.0:3022
  labels:
    env: production
    role: auth-server
```

Adjust `nodename` and the `role` label per server. Labels are used in RBAC policies to grant access to groups of servers (see the RBAC runbook).

Generate a node join token from the Auth server:

```
tctl tokens add --type=node --ttl=1h
```

Write the token to `/etc/teleport-token` on the target server:

```
echo "<token>" > /etc/teleport-token
chmod 600 /etc/teleport-token
```

Start the agent:

```
systemctl enable teleport
systemctl start teleport
```

After starting, confirm the node appears in the cluster:

```
tctl nodes ls
```

Repeat for every production server.

## Firewall changes

After all agents are registered and verified, update the Hetzner firewall rules for each production server to remove direct SSH access from outside the private network:

- Remove: TCP 22 from `0.0.0.0/0`
- Keep: TCP 22 from `10.0.4.1/32` (Teleport proxy only, for agent connections)
- Keep: TCP 3022 from `10.0.4.1/32` (Teleport SSH)

Production servers should not accept inbound SSH from any IP other than the Teleport proxy. This change is the point of the whole deployment. Make it after confirming that Teleport access works correctly from at least two different user accounts.

## Verification

Log in to the Teleport web UI at `https://teleport.golemtrust.am`. Verify that all registered nodes appear in the Servers view. Attempt to connect to a server via the web terminal. The session should start without prompting for a password.

From a workstation with the `tsh` client installed:

```
tsh login --proxy=teleport.golemtrust.am --user=carrot.ironfoundersson
tsh ssh carrot@auth.golemtrust.am
```

The login step authenticates and creates a local certificate. The SSH step uses that certificate; no password is requested.
