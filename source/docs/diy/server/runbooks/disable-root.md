# Disable root access

Hardening runbook. Removes the root account as a usable login target, so an attacker who reaches the login prompt has no known account name to aim at and no direct path to full privilege.

## When to run

On every new server, as part of initial setup, after a normal admin account with sudo is in place. Also run on an existing server where root login was never disabled.

## Before starting

A normal user account with working sudo access. Confirm it before going further:

```
sudo whoami
```

A response of `root` means sudo works. If it does not, stop and fix sudo access first. Disabling root without a working alternative locks the server.

## Risk

Disabling root without a confirmed working admin account locks everyone out. The console or recovery access offered by the hosting provider is the only way back in. Confirm the admin account before each step that removes a path.

## Steps

### Lock the root password

```
sudo passwd -l root
```

This disables password login for root. It does not remove the account, which other processes still rely on.

### Disable root SSH login

In `/etc/ssh/sshd_config`, set:

```
PermitRootLogin no
```

Reload SSH:

```
sudo systemctl reload ssh
```

### Verify

From a separate terminal (keep the current session open as a fallback):

```
ssh root@server-address
```

The connection should be refused or the root login rejected. If it succeeds, the change did not apply: confirm the directive is not overridden elsewhere in `/etc/ssh/sshd_config.d/`.

Confirm the normal admin account still logs in and sudo still works:

```
ssh adminuser@server-address
sudo whoami
```

## Done

Root SSH login rejected. Root password locked. Admin account logs in and holds working sudo. The fallback session was never needed.

## Rollback

Root SSH can be restored by setting `PermitRootLogin prohibit-password` and reloading SSH. The root password lock is reversed with `sudo passwd root` to set a new one. Rolling back widens the attack surface; do it only to recover access, then close the path again.

## Follow-up

- Confirm [SSH key authentication and password login are hardened](harden-ssh.md).
- Record which account holds admin access, so offboarding can revoke it later.
