# Set up fail2ban

Hardening runbook. Rate-limits authentication attempts and bans source IPs after repeated failures. It is a rate-limiter, not an authentication control: useful for services that cannot drop passwords (web auth, mail auth, admin panels), and of little value on SSH once key-only authentication is enforced.

## When to run

On a server running password-accepting services exposed to the internet. After a log review shows repeated authentication failures from one or more source IPs.

## What it does not do

Against a distributed brute force spread across many source IPs, per-IP banning helps little. Fail2ban reduces noise and slows single-source attacks. It does not replace strong authentication. On SSH, enforcing keys removes the attack it would defend against.

## Steps

### Install

```
sudo apt-get install fail2ban
```

### Configure

Work in a local override, never the packaged `jail.conf` (package updates overwrite it):

```
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

In `[DEFAULT]`, set the ignore list, ban duration, and failure threshold:

```
ignoreip = 127.0.0.1/8
bantime  = 3600
maxretry = 3
```

### Risk

Put the admin's own static IP in `ignoreip`. Without it, a few failed logins from the admin's location can ban that address and lock out administration. On a dynamic IP this is a real risk; key access is the fallback.

### Enable a jail

A jail applies the rules to one service. For Nginx authentication:

```
[nginx-http-auth]
enabled  = true
filter   = nginx-http-auth
port     = http,https
logpath  = /var/log/nginx/error.log
maxretry = 6
```

For Apache:

```
[apache-auth]
enabled  = true
port     = http,https
filter   = apache-auth
logpath  = /var/log/apache2/*error.log
maxretry = 6
```

Restart to apply:

```
sudo systemctl restart fail2ban
```

## Verify

```
sudo fail2ban-client status
sudo fail2ban-client status nginx-http-auth
```

The named jail should appear in the list and report its state. To confirm banning works, trigger failed logins from a second machine (not the admin IP) and watch the banned-IP count rise.

## Unbanning

To release an address banned in error:

```
sudo fail2ban-client set nginx-http-auth unbanip 203.0.113.5
```

## Done

Fail2ban running. Intended jails enabled and visible in `fail2ban-client status`. Admin IP in the ignore list. A test failure from another host results in a ban.

## Rollback

Stop and disable the service to remove all banning behaviour:

```
sudo systemctl stop fail2ban && sudo systemctl disable fail2ban
```

Existing bans are firewall entries that clear on service stop.

## Follow-up

- For SSH specifically, prefer [key-only authentication](harden-ssh.md) over relying on fail2ban.
- Review banned-IP patterns during a [log review](log-commands.md); a single source banned repeatedly may warrant a permanent firewall block.
Last updated: 29 May 2026
