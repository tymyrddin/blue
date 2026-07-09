# Set up spam filtering with Rspamd

Hardening runbook. Installs Rspamd in front of Postfix to score and filter inbound spam, detect malware, and (optionally) handle DKIM signing, in one daemon. It replaces the older Amavis and SpamAssassin combination.

## When to run

When setting up a mail server that receives mail and needs spam filtering. When inbound spam is reaching mailboxes and no filter is in place.

## Install

Add the Rspamd repository and install:

```
curl https://rspamd.com/apt-stable/gpg.key | gpg --dearmor > /etc/apt/trusted.gpg.d/rspamd.gpg
echo "deb [arch=amd64] http://rspamd.com/apt-stable/ $(lsb_release -cs) main" > /etc/apt/sources.list.d/rspamd.list
sudo apt update && sudo apt install rspamd
```

## Connect Postfix

Hand mail to Rspamd via the milter protocol. In `/etc/postfix/main.cf`:

```
smtpd_milters = inet:localhost:11332
non_smtpd_milters = inet:localhost:11332
milter_protocol = 6
milter_default_action = accept
```

`milter_default_action = accept` means mail still flows if Rspamd is down. The trade-off is unfiltered mail during an outage. Reload:

```
sudo systemctl reload postfix
```

## Securing the dashboard

Rspamd exposes a web dashboard on `localhost:11334` showing message statistics, per-symbol scores, and the greylist queue. Set a password before it is reachable from anywhere but localhost:

```
rspamadm pw --encrypt
```

Put the resulting hash in `/etc/rspamd/local.d/worker-controller.inc`:

```
password = "$2$<hash-from-above>";
```

### Risk

The dashboard can act on mail flow and exposes message metadata. Left without a password, or bound beyond localhost, it is an exposure. Keep it on localhost (reached via an SSH tunnel when needed) and set the password before opening any access.

## Optional: DKIM signing through Rspamd

Rspamd can sign outbound mail instead of running [OpenDKIM](dkim.md) separately. Generate a key:

```
rspamadm dkim_keygen -s 2024 -d example.com \
    -k /var/lib/rspamd/dkim/example.com.2024.key > /var/lib/rspamd/dkim/example.com.2024.txt
sudo chown _rspamd:_rspamd /var/lib/rspamd/dkim/example.com.2024.key
sudo chmod 640 /var/lib/rspamd/dkim/example.com.2024.key
```

Configure signing in `/etc/rspamd/local.d/dkim_signing.conf` pointing at the key and selector, then publish the record from the `.txt` file at `2024._domainkey.example.com`. Run either Rspamd or OpenDKIM for signing.

Reload to apply:

```
sudo systemctl reload rspamd
```

## Verify

Send a test message through the server and confirm Rspamd processed it: the headers carry an `X-Spamd-Result` (or similar) symbol score, and the dashboard shows the message. Send a known spam-test pattern (the GTUBE test string is the standard) and confirm it scores as spam. Confirm the dashboard refuses access without the password.

## Done

Rspamd filtering mail through Postfix. Test messages show scoring in headers and the dashboard. Dashboard password-protected and on localhost. If DKIM signing is via Rspamd, outbound mail is signed and only one signer runs.

## Rollback

Remove the `smtpd_milters` / `non_smtpd_milters` lines from `main.cf` and reload Postfix to take Rspamd out of the mail path. Mail flows unfiltered until it is reconnected.

## Follow-up

- Spam filtering handles content; it is separate from sender authentication. Pair with [SPF](spf.md), [DKIM](dkim.md), and [DMARC](dmarc.md).
- Review the dashboard periodically; the symbol scores show what is being caught and any false positives.
Last updated: 10 July 2026
