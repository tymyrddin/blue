# Harden the SSH server

Hardening runbook. Closes the most common remote entry point: SSH exposed with password authentication, root login, and default settings. The aim is a server that cannot be brute-forced and that only the intended people can reach.

## When to run

On every new server during initial setup. On an existing server that still accepts password authentication or root login. After any change to who needs SSH access.

## Before starting

Working SSH key access for at least one admin account. Confirm a key login succeeds before disabling passwords:

```
ssh -i ~/.ssh/your_key adminuser@server-address
```

If key login does not yet work, set it up first (see [key management](key-management.md)). Disabling password authentication before keys work locks the server.

## Risk

Disabling password authentication without confirmed key access locks everyone out. Keep the existing session open while testing a new one, so there is always a way back in.

## Steps

All changes are in `/etc/ssh/sshd_config`. Edit, then reload at the end.

### Disable password authentication

```
PasswordAuthentication no
```

Keys cannot be guessed; passwords can. This is the change that removes the brute-force surface.

### Disable root login

```
PermitRootLogin no
```

### Limit who can log in

```
AllowUsers adminuser deployuser
```

Only the listed accounts can authenticate. This does not replace strong authentication, but it narrows what an attacker can target.

### Disable X11 forwarding

```
X11Forwarding no
```

The X11 protocol was not built with security in mind and is rarely needed on a server.

### Optional: move off port 22

```
Port 2200
```

Port 22 attracts constant automated scanning. Moving the port does not add real security, but it cuts the noise in the logs considerably. If the port is changed, open the new port in the firewall and close 22 before reloading, or the next connection will fail.

### Apply

```
sudo sshd -t && sudo systemctl reload ssh
```

`sshd -t` checks the configuration for syntax errors first. A reload with a broken config can drop the SSH daemon; the syntax check guards against it.

## Verify

From a separate terminal, keeping the current session open:

```
ssh adminuser@server-address       # on the new port if changed
```

Confirm key login works, password login is refused, and root is refused:

```
ssh -o PreferredAuthentications=password adminuser@server-address   # should be rejected
ssh root@server-address                                             # should be rejected
```

## Done

Key login works for allowed accounts. Password authentication refused. Root login refused. Configuration passes `sshd -t`. The fallback session was never needed.

## Rollback

Revert the changed directives in `/etc/ssh/sshd_config` and reload. If locked out entirely, use the hosting provider's console access to edit the file, since SSH is the path that just closed.

## Follow-up

- Add [fail2ban](fail2ban.md) for services that still accept passwords (web, mail, admin panels). It does not help SSH once keys are enforced, but it covers what cannot drop passwords.
- For static-IP admin access, TCP wrappers (`/etc/hosts.allow`, `/etc/hosts.deny`) or a firewall rule can restrict SSH to known source addresses.
