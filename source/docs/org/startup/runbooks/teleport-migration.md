# Migration from password-based access

Runbook for migrating production servers from direct SSH with passwords or static keys to Teleport with certificate-based authentication. This is the runbook Carrot used after the maintenance account compromise. The migration is a one-way door; once password authentication is disabled on a server, the only way back is physical console access or a reinstall. Do not rush it.

## Migration order

Migrate servers in this order:

1. Non-production servers first: dev, staging. These have lower stakes if something goes wrong.
2. Monitoring and security infrastructure: Graylog, Prometheus. These are not customer-facing.
3. Supporting infrastructure: Vault (with extra care), Teleport itself (tricky; see the note below).
4. Application servers: auth, database, customer portals. Last because they are customer-facing.

Within each group, migrate one server at a time. Verify Teleport access works before moving to the next. Never migrate all servers in a group simultaneously.

## Per-server migration procedure

Before starting on any server, confirm:

- The server appears in `tctl nodes ls` as a registered Teleport node
- You can connect to it via `tsh ssh` successfully
- At least one admin user (Carrot or Ponder) has tested this connection within the last 24 hours

If any of these conditions are not met, do not proceed with disabling password authentication.

Open two terminal sessions to the server: one via Teleport (`tsh ssh`) and one via direct SSH (the old method). Keep the direct SSH session open throughout the migration. If the Teleport configuration is wrong and you remove password access, the direct session is your recovery path.

In the Teleport session, edit `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
AuthorizedKeysFile none
```

Test the configuration:

```
sshd -t
```

If the test passes, reload:

```
systemctl reload sshd
```

Immediately open a third terminal and attempt a new `tsh ssh` connection to the server. It should succeed. If it does, close the direct SSH session. If it does not, use the open direct SSH session to revert the `sshd_config` change.

Once password access is disabled and Teleport access is verified, update the Hetzner firewall rules to remove direct SSH access (see the Teleport deployment runbook for the specific rules).

## Migrating legacy maintenance accounts

The `MaintenancePass123` account is gone. Other legacy accounts may still exist. Find them:

```
awk -F: '$3 >= 1000 && $1 != "nobody" {print $1}' /etc/passwd
```

For each account, determine whether it is used:

```
last <username> | head -10
grep <username> /var/log/auth.log | tail -10
```

For accounts used only by scripts:

1. Identify the scripts using the account
2. Refactor the scripts to use Vault-issued SSH certificates (see the Vault SSH secrets engine runbook)
3. Confirm the scripts work with the new authentication method in staging
4. Remove the legacy account: `userdel <username>`

For accounts used by third-party vendors:

1. Create a dedicated Teleport vendor account (see the RBAC runbook)
2. Notify the vendor of the new access method and the date the old account will be removed
3. Give vendors two weeks' notice
4. Remove the legacy account on the agreed date

Do not extend the deadline for legacy accounts. Extensions become permanent. The maintenance account was "temporary" for six months before the compromise.

## Migrating static SSH keys

Some systems may be using static authorised keys in `~/.ssh/authorized_keys` rather than passwords. These are more secure than passwords but still allow persistent access that does not expire.

List all authorised key files on a server:

```
find /home /root -name authorized_keys 2>/dev/null
cat /etc/ssh/sshd_config | grep AuthorizedKeysFile
```

For each key found, identify who it belongs to (check the comment field in the key, or cross-reference with Vaultwarden) and whether it is still needed.

Keys belonging to team members are replaced by Teleport access; remove the key once the Teleport account is confirmed working. Keys belonging to automated systems are replaced by Vault SSH certificates; migrate the system first, then remove the key.

Once all keys have been migrated, the `AuthorizedKeysFile none` setting in `sshd_config` prevents any static keys from being used, even if a new one were accidentally added later.

## Migrating the Teleport server itself

The Teleport Auth/Proxy node is a special case. If you lock yourself out of the Teleport server, you lose the ability to issue certificates for everything else.

Migrate the Teleport server last. Before disabling password access:

1. Confirm that Carrot, Ponder, and Adora Belle all have working Teleport certificates
2. Confirm that the Vault SSH CA is trusted on the Teleport server (for emergency break-glass access)
3. Generate a Vault SSH emergency certificate and test that it works on the Teleport server before removing password access

The emergency certificate test is: request a Vault SSH certificate for the `emergency-admin` role, use it to connect to `teleport.golemtrust.am`, confirm the connection works, then disconnect. Only after this confirmation should password authentication be disabled on the Teleport server itself.

## Post-migration verification

After completing the migration for all servers, run the following check from a workstation without any open SSH sessions:

```
for HOST in auth.golemtrust.am db.golemtrust.am graylog-1.golemtrust.am \
            vault-1.golemtrust.am vault-2.golemtrust.am vault-3.golemtrust.am; do
  echo -n "Testing $HOST: "
  tsh ssh ponder@$HOST -- 'echo OK' 2>&1
done
```

Every host should return `OK`. Any host that returns an error needs investigation before the migration is considered complete.

Attempt a direct password SSH connection to confirm it is blocked:

```
ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no \
    ponder@auth.golemtrust.am
```

This should be refused with `Permission denied`. If it succeeds, the server was not migrated correctly.

Record the migration completion date and the list of servers migrated in the internal security log. This record is useful during security audits and for incident response context.
Last updated: 20 March 2026
