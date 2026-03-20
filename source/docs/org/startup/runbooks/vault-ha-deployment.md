# Vault HA deployment

Runbook for deploying HashiCorp Vault in a three-node Raft cluster across two availability zones. Carrot Ironfoundersson designed this architecture on day three of his employment. His notes were precise, numbered, and included a hand-drawn network diagram. This runbook is the formal version of those notes.

## Architecture

Three Hetzner cloud instances in the Helsinki region:

| Node      | Hostname              | Private IP | AZ       |
|-----------|-----------------------|------------|----------|
| Primary   | vault-1.golemtrust.am | 10.0.1.1   | hel1-dc3 |
| Secondary | vault-2.golemtrust.am | 10.0.1.2   | hel1-dc4 |
| Tertiary  | vault-3.golemtrust.am | 10.0.1.3   | hel1-dc3 |

The primary and tertiary nodes share a datacentre; the secondary is in a separate one. This means the cluster survives the loss of any single node or any single datacentre, but not both simultaneously. Carrot found this acceptable. He called it "sound engineering within budget constraints," which from Carrot means he was satisfied.

All three nodes run CX21 instances with Debian 12. Vault data is stored on separate Hetzner volumes mounted at `/opt/vault/data` to allow resizing without reprovisioning the instance.

## Prerequisites

- Three Hetzner CX21 instances provisioned and accessible via SSH key
- A Hetzner private network (`10.0.1.0/24`) with all three instances attached
- DNS A records for `vault-1`, `vault-2`, `vault-3`, and `vault.golemtrust.am` (the load-balanced cluster address)
- Hetzner load balancer configured to route HTTPS to port 8200 on all three instances, with health checks on `/v1/sys/health`
- TLS certificates for `vault.golemtrust.am` and each node hostname (Certbot with Cloudflare DNS)
- The Vault binary downloaded from [HashiCorp releases](https://releases.hashicorp.com/vault/)

## Installation on each node

Run the following on all three nodes. SSH to each in turn:

```
apt update && apt upgrade -y
apt install -y unzip curl

VAULT_VERSION="1.19.0"
wget "https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip"
unzip "vault_${VAULT_VERSION}_linux_amd64.zip"
mv vault /usr/local/bin/
chmod 755 /usr/local/bin/vault

useradd --system --home /opt/vault --shell /bin/false vault
mkdir -p /opt/vault/data /opt/vault/config /opt/vault/logs
chown -R vault:vault /opt/vault
```

Enable the `mlock` capability so Vault can prevent sensitive data from being swapped to disk:

```
setcap cap_ipc_lock=+ep /usr/local/bin/vault
```

## Configuration

Create `/opt/vault/config/vault.hcl` on each node. The `node_id` and `retry_join` addresses differ per node; the template below is for `vault-1`:

```
ui            = true
cluster_name  = "golemtrust-vault"
log_level     = "warn"

storage "raft" {
  path    = "/opt/vault/data"
  node_id = "vault-1"

  retry_join {
    leader_api_addr = "https://vault-2.golemtrust.am:8200"
  }
  retry_join {
    leader_api_addr = "https://vault-3.golemtrust.am:8200"
  }
}

listener "tcp" {
  address            = "0.0.0.0:8200"
  cluster_address    = "0.0.0.0:8201"
  tls_cert_file      = "/etc/letsencrypt/live/vault-1.golemtrust.am/fullchain.pem"
  tls_key_file       = "/etc/letsencrypt/live/vault-1.golemtrust.am/privkey.pem"
  tls_min_version    = "tls13"
}

api_addr     = "https://vault-1.golemtrust.am:8200"
cluster_addr = "https://vault-1.golemtrust.am:8201"

seal "transit" {
  address    = "https://vault-transit.golemtrust.am:8200"
  token      = "<transit vault root token: retrieve from Bank of Ankh-Morpork vault>"
  mount_path = "transit/"
  key_name   = "golemtrust-unseal"
}
```

On `vault-2`, change `node_id` to `vault-2`, `api_addr` and `cluster_addr` to use `vault-2.golemtrust.am`, and update the TLS paths accordingly. Same pattern for `vault-3`. The `retry_join` blocks on each node list the other two nodes.

The Transit seal requires a separate single-node Vault instance (`vault-transit.golemtrust.am`) that is manually unsealed and stores only the transit key used for auto-unseal. See the Raft configuration runbook for how the transit instance is provisioned.

## Systemd unit

Create `/etc/systemd/system/vault.service` on each node:

```
[Unit]
Description=HashiCorp Vault
Documentation=https://developer.hashicorp.com/vault
Requires=network-online.target
After=network-online.target
ConditionFileNotEmpty=/opt/vault/config/vault.hcl

[Service]
User=vault
Group=vault
ProtectSystem=full
ProtectHome=read-only
PrivateTmp=yes
PrivateDevices=yes
SecureBits=keep-caps
Capabilities=CAP_IPC_LOCK+ep
CapabilityBoundingSet=CAP_SYSLOG CAP_IPC_LOCK
NoNewPrivileges=yes
ExecStart=/usr/local/bin/vault server -config=/opt/vault/config/vault.hcl
ExecReload=/bin/kill --signal HUP $MAINPID
KillMode=process
KillSignal=SIGINT
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
LimitNOFILE=65536
LimitMEMLOCK=infinity
Delegate=yes

[Install]
WantedBy=multi-user.target
```

```
systemctl daemon-reload
systemctl enable vault
systemctl start vault
```

## Initialisation

Initialise the cluster from `vault-1` only. This is done once and never repeated:

```
export VAULT_ADDR="https://vault-1.golemtrust.am:8200"
vault operator init -key-shares=5 -key-threshold=3
```

This outputs five unseal keys and one root token. Copy all of them now. They will not be shown again.

Distribute the five unseal keys as follows: Adora Belle holds keys 1 and 2, Carrot holds keys 3 and 4, Ponder holds key 5. The root token goes into the Bank of Ankh-Morpork vault immediately. Under no circumstances should the root token be left active after initialisation is complete; see the Raft configuration runbook for how to revoke it after bootstrap.

With auto-unseal via Transit configured correctly, the cluster will unseal itself on subsequent starts. The manual unseal keys are for disaster recovery only.

## Verification

```
export VAULT_ADDR="https://vault.golemtrust.am:8200"
vault status
```

The output should show `Sealed: false`, `HA Mode: active`, and the cluster name. Check peer status:

```
vault operator raft list-peers
```

All three nodes should appear with their node IDs and addresses. If a node is missing, check `journalctl -u vault -n 50` on that node and verify its `retry_join` addresses are correct and reachable on port 8201.

## Firewall rules

The Hetzner firewall for each Vault instance should permit:

- TCP 8200 from the load balancer's IP only (API access)
- TCP 8200 and 8201 between the three Vault node private IPs (cluster communication)
- TCP 8200 from the private network `10.0.0.0/24` (application servers)
- No public access to port 8200 or 8201

The load balancer handles public TLS termination and routes to the active leader. Clients that reach a standby node receive a redirect to the leader automatically.