# Certificate-based authentication setup

Runbook for configuring certificate-based authentication across Teleport and the Vault SSH secrets engine. This runbook covers the end-to-end picture: how certificates are issued, how servers are configured to trust them, and how human and automated access are distinguished.

## How the certificate chain works

Teleport maintains its own internal CA for user and host certificates within the Teleport cluster. When a user authenticates to Teleport (password plus MFA), Teleport issues them a short-lived user certificate. That certificate is presented to SSH agents within the cluster; the agents trust the Teleport CA and accept the certificate without a password.

Vault's SSH secrets engine maintains a separate CA for automated access. Scripts and applications use Vault-issued certificates to connect directly to servers (bypassing Teleport), but only to the `deploy` and `golem-operator` Linux users. Human users do not use Vault SSH certificates; they use Teleport.

The two CAs are trusted by the same servers but grant different access levels:
- Teleport CA: grants access to named Linux users based on the Teleport user's roles
- Vault SSH CA: grants access only to `deploy` and `golem-operator`

No server accepts password-based SSH login. This is enforced via `sshd_config`.

## Disabling password authentication

On every production server, ensure password authentication is disabled in `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
AuthorizedKeysFile none
```

`AuthorizedKeysFile none` disables static authorised key files entirely. The only valid authentication methods are certificates from the Teleport CA or the Vault SSH CA. There is no fallback to a key file, and no fallback to a password.

After editing, reload:

```
sshd -t && systemctl reload sshd
```

The `sshd -t` test step is important. An invalid `sshd_config` will prevent SSH from reloading and, if combined with a closed Teleport session, will lock you out. Always test before reloading.

## Teleport CA distribution

Teleport automatically handles CA distribution to servers registered as Teleport nodes. The Teleport agent on each server adds the Teleport CA to the host's `sshd_config` via Teleport's managed configuration. This happens automatically when the agent starts and when certificates are rotated.

Confirm that the Teleport CA is trusted on a server:

```
cat /var/lib/teleport/teleport_ssh_host_ca_certauthority
```

This file is managed by Teleport. Do not edit it manually.

## Vault SSH CA distribution

The Vault SSH CA is distributed manually (see the Vault SSH secrets engine runbook) and does not rotate automatically. When rotating the Vault SSH CA:

1. Generate a new CA in Vault: `vault write ssh/config/ca generate_signing_key=true key_type=ed25519`
2. Export the new public key: `vault read -field=public_key ssh/config/ca > /tmp/new-vault-ca.pub`
3. Add the new public key to `TrustedUserCAKeys` on all servers (temporarily trust both old and new CA)
4. Update all automated processes to request certificates from the new CA
5. Confirm no processes are still using the old CA (check the Vault audit log for certificate requests)
6. Remove the old CA from `TrustedUserCAKeys`

Do not remove the old CA before confirming that nothing still relies on it. An automated process that loses its ability to authenticate will fail silently at 3 in the morning.

## Certificate rotation for Teleport

Teleport supports automatic certificate authority rotation. This rotates the internal CAs and re-issues certificates to all nodes without service interruption. Run the rotation from the Teleport Auth server:

```
tctl auth rotate --grace-period=24h
```

The `--grace-period` allows existing certificates issued under the old CA to remain valid for 24 hours while the new CA is distributed. After the grace period, only new-CA certificates are accepted.

Monitor rotation progress:

```
tctl status
```

A rotation in progress will show the current phase. Complete phases are: `init`, `update_clients`, `update_servers`, `standby`. Do not interrupt a rotation mid-process.

## MFA configuration for infrastructure access

All human Teleport logins require MFA. Hardware authentication devices from Überwald are registered via the Teleport web UI under Account Settings, then Two-Factor Devices.

MFA registration for a new user:

1. The user logs in to `https://teleport.golemtrust.am` with their password
2. Teleport requires MFA registration before the session is fully established
3. The user registers their hardware device via the FIDO2 challenge
4. Subsequent logins require the hardware device

If a user loses their hardware device, their account must be locked immediately and a new device registered after identity verification by Carrot. Do not issue a temporary password bypass; instead, issue a temporary registration link for a new device:

```
tctl users reset carrot.ironfoundersson --ttl=15m
```

This forces a fresh device registration without granting temporary password-only access.

## Third-party vendor access

Third-party vendors who previously used the `MaintenancePass123` account receive dedicated Teleport accounts with heavily restricted roles. Each vendor account has:

- A role permitting access only to the specific servers they need
- No access to databases, Vault, or Keycloak
- A time-limited validity window corresponding to their contracted support hours
- Session recording enabled (as for all accounts)
- A require-reason-to-connect policy so that every connection is associated with a support ticket

Create a vendor account:

```
tctl users add vendor-guild-support \
  --roles=vendor-guild \
  --logins=vendor
```

The `vendor-guild` role is defined in the RBAC runbook. Disable the account when vendor support is not active:

```
tctl users update vendor-guild-support --set-disabled=true
```

Re-enable for a specific support window:

```
tctl users update vendor-guild-support --set-disabled=false
```

Enable and disable operations are logged in Teleport's audit log.
Last updated: 20 March 2026
