# Raft configuration

Runbook for configuring Vault's integrated Raft storage, including the transit Vault instance used for auto-unseal, snapshot procedures, and post-initialisation bootstrap tasks. This runbook follows on directly from the Vault HA deployment runbook.

## Transit Vault instance

The Transit Vault is a single-node Vault instance on a fourth Hetzner instance, `vault-transit.golemtrust.am` (`10.0.1.4`). It exists solely to hold the transit encryption key used to auto-unseal the main cluster. It is manually unsealed and should be treated with corresponding seriousness.

Provision it as a single-node Vault installation following the same installation steps in the HA deployment runbook, but with a simpler configuration. Create `/opt/vault/config/vault.hcl` on the transit instance:

```
ui         = false
log_level  = "warn"

storage "file" {
  path = "/opt/vault/data"
}

listener "tcp" {
  address         = "0.0.0.0:8200"
  tls_cert_file   = "/etc/letsencrypt/live/vault-transit.golemtrust.am/fullchain.pem"
  tls_key_file    = "/etc/letsencrypt/live/vault-transit.golemtrust.am/privkey.pem"
  tls_min_version = "tls13"
}

api_addr = "https://vault-transit.golemtrust.am:8200"
```

The transit Vault uses file storage, not Raft. It does not need HA; if it goes down temporarily, the main cluster continues to operate sealed until it restarts. It should be sized small (CX11) and provisioned with an automated restart policy.

Initialise the transit Vault with a single key share:

```
export VAULT_ADDR="https://vault-transit.golemtrust.am:8200"
vault operator init -key-shares=1 -key-threshold=1
```

Store the single unseal key and root token in the Bank of Ankh-Morpork vault. These are used only when the transit instance restarts and needs manual unsealing.

Enable the Transit secrets engine and create the unseal key:

```
vault login <root token>
vault secrets enable transit
vault write -f transit/keys/golemtrust-unseal type=aes256-gcm96
```

Create a restricted policy for the main cluster to use:

```
vault policy write golemtrust-unseal - << 'EOF'
path "transit/encrypt/golemtrust-unseal" {
  capabilities = ["update"]
}
path "transit/decrypt/golemtrust-unseal" {
  capabilities = ["update"]
}
EOF
```

Create a token with this policy and a long TTL. This token goes into the `seal "transit"` block in the main cluster's `vault.hcl`:

```
vault token create \
  -policy=golemtrust-unseal \
  -ttl=8760h \
  -display-name="main-cluster-unseal"
```

Store the token in the Bank of Ankh-Morpork vault and in the `vault.hcl` configuration on each main cluster node. Rotate this token annually; calendar a reminder.

Revoke the root token from the transit instance:

```
vault token revoke <root token>
```

## Post-initialisation bootstrap on the main cluster

After the main cluster is initialised (see the HA deployment runbook), log in with the root token to complete bootstrap. Do this promptly; the root token should not be active any longer than necessary:

```
export VAULT_ADDR="https://vault.golemtrust.am:8200"
vault login <root token>
```

Enable the audit log:

```
vault audit enable file file_path=/opt/vault/logs/audit.log
```

The audit log records every request and response. It grows quickly. On each Vault node, configure logrotate at `/etc/logrotate.d/vault-audit`:

```
/opt/vault/logs/audit.log {
    daily
    rotate 90
    compress
    missingok
    notifempty
    create 0640 vault vault
}
```

Enable the secrets engines and auth methods required by other runbooks:

```
vault secrets enable -path=database database
vault secrets enable -path=kv kv-v2
vault auth enable approle
vault auth enable userpass
```

Create the admin policy. This is used by Carrot and Ponder for day-to-day Vault administration without requiring the root token:

```
vault policy write golemtrust-admin - << 'EOF'
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
EOF
```

Create userpass accounts for Carrot and Ponder:

```
vault write auth/userpass/users/carrot.ironfoundersson \
  password="<generate and store in Vaultwarden>" \
  policies="golemtrust-admin"

vault write auth/userpass/users/ponder.stibbons \
  password="<generate and store in Vaultwarden>" \
  policies="golemtrust-admin"
```

Revoke the root token:

```
vault token revoke <root token>
```

Confirm this worked:

```
vault login token=<root token>
```

This should fail with a permission denied error. If it succeeds, something has gone wrong and Carrot needs to be informed immediately.

## Raft snapshots

The Raft storage engine supports snapshots for disaster recovery. These are separate from the PostgreSQL backups in the backup procedures runbook, which do not cover Vault data.

Create a restricted snapshot policy and token:

```
vault policy write vault-snapshot - << 'EOF'
path "sys/storage/raft/snapshot" {
  capabilities = ["read"]
}
EOF

vault token create \
  -policy=vault-snapshot \
  -ttl=8760h \
  -display-name="snapshot-agent" \
  -no-default-policy
```

Store the token in Vaultwarden under the Infrastructure collection. Create `/opt/backup/vault-snapshot.sh` on `vault-1`:

```
#!/bin/bash
set -euo pipefail

export VAULT_ADDR="https://vault.golemtrust.am:8200"
export VAULT_TOKEN="<snapshot token from Vaultwarden>"

BACKUP_DIR="/opt/backup/vault"
DATE=$(date +%Y-%m-%d)
AGE_PUBKEY="age1..."
STORAGEBOX_USER="u123456"
STORAGEBOX_HOST="u123456.your-storagebox.de"

mkdir -p "$BACKUP_DIR"

SNAPFILE="$BACKUP_DIR/vault_${DATE}.snap"
vault operator raft snapshot save "$SNAPFILE"
age -r "$AGE_PUBKEY" -o "${SNAPFILE}.age" "$SNAPFILE"
rm "$SNAPFILE"

rsync -az -e "ssh -p 23" "$BACKUP_DIR/"*.age \
  "${STORAGEBOX_USER}@${STORAGEBOX_HOST}:/vault/"

find "$BACKUP_DIR" -name "*.age" -mtime +30 -delete

echo "Vault snapshot complete: $(date)"
```

Schedule the snapshot daily:

```
0 1 * * * /opt/backup/vault-snapshot.sh >> /var/log/backup.log 2>&1
```

## Raft peer management

To check the current cluster state:

```
vault operator raft list-peers
```

To remove a failed node that will not recover (replace with a fresh instance):

```
vault operator raft remove-peer vault-3
```

Then reprovision the instance, reinstall Vault with the same configuration, and start the service. The new node will rejoin the cluster via the `retry_join` addresses and replicate all data from the current leader.

Do not remove a peer unless the node is definitively gone. Removing a healthy peer disrupts the cluster quorum. The cluster requires two of three nodes to be available to elect a leader and process requests. If two nodes are lost simultaneously, the cluster will stop accepting writes until one is restored.