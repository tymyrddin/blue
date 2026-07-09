# Encryption configuration

Runbook for managing Restic's encryption keys and the additional age encryption layer applied to sensitive backup archives. Dr. Crucible described the encryption approach as "quantum-resistant by design." Cheery Littlebottom described it as "the minimum acceptable standard." Both are correct.

## Restic's built-in encryption

Restic encrypts all data before writing it to the repository using AES-256-CTR with a Poly1305-AES MAC. The encryption key is derived from the repository password using scrypt. This means:

- The Storage Box provider (Hetzner) cannot read backup contents
- Anyone who obtains the backup files without the password cannot read them
- The password is the single point of access; losing it means losing access to the backups permanently

The repository password is stored in Vault at `kv/golemtrust/backup/restic_backup_password`. It is generated once and rotated annually. The rotation procedure is in the final section of this runbook.

## Storing the backup password in Vault

If the backup password does not yet exist in Vault, generate and store it:

```
export VAULT_ADDR="https://vault.golemtrust.am:8200"
vault login -method=userpass username=ponder.stibbons

BACKUP_PASSWORD=$(openssl rand -base64 48)
vault kv put kv/golemtrust/backup \
  restic_backup_password="$BACKUP_PASSWORD"

echo "Password stored. Do not print it to the terminal again."
unset BACKUP_PASSWORD
```

The password is never printed to a terminal or stored in a file. Scripts retrieve it from Vault at runtime via AppRole authentication. The only other copy is in the Bank of Ankh-Morpork vault, in the same sealed envelope as the other emergency credentials, renewed every six months.

## Vault policy for backup scripts

Backup scripts on each server authenticate to Vault using AppRole and retrieve the password from the KV engine. The policy permits reading the backup password and writing backup status:

```
vault policy write restic-backup - << 'EOF'
path "kv/data/golemtrust/backup" {
  capabilities = ["read"]
}
path "kv/data/golemtrust/backup-status/*" {
  capabilities = ["create", "update"]
}
path "auth/token/renew-self" {
  capabilities = ["update"]
}
EOF
```

Create an AppRole for backup scripts:

```
vault write auth/approle/role/restic-backup \
  token_policies="restic-backup" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=8760h
```

Retrieve the Role ID and a Secret ID and place them on each server:

```
vault read -field=role_id auth/approle/role/restic-backup/role-id \
  > /etc/vault/role-id
vault write -field=secret_id -f auth/approle/role/restic-backup/secret-id \
  > /etc/vault/secret-id
chmod 600 /etc/vault/role-id /etc/vault/secret-id
```

## Additional age encryption for database exports

PostgreSQL dump files and other exports that are shipped to the Storage Box separately (outside Restic) are encrypted with age before transit. This is the same approach used in the backup procedures runbook for the earlier PostgreSQL backup scripts.

The age public key is stored in Vault:

```
vault kv put kv/golemtrust/backup \
  restic_backup_password="..." \
  age_public_key="age1..."
```

The age private key is stored only in the Bank of Ankh-Morpork vault and is retrieved only for decryption during a restore. It is never stored on any server.

Retrieving the age public key in a script:

```
AGE_PUBKEY=$(vault kv get -field=age_public_key kv/golemtrust/backup)
```

## Restic repository key management

Restic supports multiple keys per repository. This allows different passphrases to unlock the same repository, which is useful for granting temporary access to a specific repository without sharing the primary password.

To add a secondary key to a repository (for example, a recovery key held by Cheery):

```
restic key add
```

Restic will prompt for the new passphrase. Generate it with `openssl rand -base64 32` and give it to Cheery to store in her personal Vaultwarden vault.

To list keys in a repository:

```
restic key list
```

Each key has an ID. To remove a key (for example, when a team member who held a recovery key leaves):

```
restic key remove <key-id>
```

At least one key must always remain. Removing the last key makes the repository permanently inaccessible.

## Annual password rotation

Rotate the backup password annually on the first Monday of January. The rotation requires re-encrypting the repository with a new password, which involves downloading and re-uploading all repository data. Plan for this to take several hours depending on repository size.

The procedure:

1. Generate a new password: `NEW_PASSWORD=$(openssl rand -base64 48)`
2. Change the password on the repository: `restic key passwd`
3. Update the password in Vault: `vault kv put kv/golemtrust/backup restic_backup_password="$NEW_PASSWORD"`
4. Update the Bank of Ankh-Morpork vault envelope with the new password
5. Confirm that the backup script can still authenticate and create a snapshot
6. Confirm that the old password no longer works: attempt `restic snapshots` with the old password (retrieve from the now-stale Vault KV version) and confirm it fails

Rotate all repositories on all servers before declaring the rotation complete. Vault KV v2 keeps version history; use `vault kv get -version=<n>` to retrieve the previous password if a rotation needs to be rolled back.
Last updated: 20 March 2026
