# Rspamd configuration

Rspamd replaces Amavis and SpamAssassin as an email filter, handling spam scoring, malware
detection, and DKIM signing in a single daemon. It integrates with Postfix via the milter protocol
and exposes a web dashboard for monitoring.

## Installation

```bash
curl https://rspamd.com/apt-stable/gpg.key | gpg --dearmor \
    > /etc/apt/trusted.gpg.d/rspamd.gpg
echo "deb [arch=amd64] http://rspamd.com/apt-stable/ $(lsb_release -cs) main" \
    > /etc/apt/sources.list.d/rspamd.list
apt update && apt install rspamd
```

## Postfix integration

Add to `/etc/postfix/main.cf`:

```
smtpd_milters = inet:localhost:11332
non_smtpd_milters = inet:localhost:11332
milter_protocol = 6
milter_default_action = accept
```

Reload Postfix:

```bash
systemctl reload postfix
```

## DKIM signing

Generate a key pair for the domain:

```bash
rspamadm dkim_keygen \
    -s 2024 \
    -d example.com \
    -k /var/lib/rspamd/dkim/example.com.2024.key \
    > /var/lib/rspamd/dkim/example.com.2024.txt
```

The `.txt` file contains the DNS TXT record to publish. Publish it under the selector subdomain:
`2024._domainkey.example.com`.

Configure signing in `/etc/rspamd/local.d/dkim_signing.conf`:

```lua
domain {
    example.com {
        path = "/var/lib/rspamd/dkim/example.com.2024.key";
        selector = "2024";
    }
}
```

Set correct permissions on the key:

```bash
chown _rspamd:_rspamd /var/lib/rspamd/dkim/example.com.2024.key
chmod 640 /var/lib/rspamd/dkim/example.com.2024.key
```

## Web interface

Rspamd exposes a dashboard at `http://localhost:11334`. Set a password before exposing it:

```bash
rspamadm pw --encrypt
```

Add the resulting hash to `/etc/rspamd/local.d/worker-controller.inc`:

```
password = "$2$<hash-from-above>";
```

Reload Rspamd to apply changes:

```bash
systemctl reload rspamd
```

The dashboard shows message statistics, per-symbol scores, and the greylist queue.

For integration with MTAs other than Postfix, see the
[Rspamd integration documentation](https://www.rspamd.com/doc/integration.html).
