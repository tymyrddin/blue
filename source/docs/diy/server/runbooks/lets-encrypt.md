# TLS certificates with Let's Encrypt

Maintenance runbook. Obtains and renews free TLS certificates using Certbot, the official Let's Encrypt client. Covers the common case of a web server needing a valid certificate, and the renewal that keeps it from expiring.

## When to run

When a new domain or subdomain needs HTTPS. When a certificate is approaching expiry and auto-renewal is not yet confirmed working. After a server rebuild, to reinstate certificates.

## Before starting

The domain's DNS already resolves to this server, and port 80 is reachable from the internet. Certbot proves control of the domain over HTTP; if the domain does not point here yet, validation fails.

## Obtaining a certificate

Install Certbot with the plugin for the web server in use:

```
sudo apt install certbot python3-certbot-nginx       # Nginx
sudo apt install certbot python3-certbot-apache       # Apache
```

Request the certificate and let Certbot edit the web server config:

```
sudo certbot --nginx        # or --apache
```

Certbot prompts for the domain and an email address for expiry notices. On success it places the certificate in `/etc/letsencrypt/live/<domain>/` and updates the web server to use it.

## Verify

Confirm the certificate files are present:

```
ls /etc/letsencrypt/live/<domain>/
# cert.pem  chain.pem  fullchain.pem  privkey.pem
```

Confirm the web server config is valid and reload:

```
sudo nginx -t && sudo systemctl reload nginx
```

Then confirm HTTPS serves the new certificate from outside, either in a browser or:

```
openssl s_client -connect <domain>:443 -servername <domain> </dev/null 2>/dev/null | openssl x509 -noout -dates
```

The `notAfter` date should be roughly 90 days out.

## Auto-renewal

Let's Encrypt certificates last 90 days. Certbot installs a timer that renews them automatically. Confirm it works:

```
sudo certbot renew --dry-run
sudo systemctl list-timers | grep certbot
```

A successful dry run means real renewals will succeed. A renewal that has silently failed is the usual cause of an unexpected certificate expiry.

## Done

Certificate present and served over HTTPS. Web server config valid. `certbot renew --dry-run` succeeds and the renewal timer is active.

## Rollback

A failed certificate change can leave the web server unable to start. Certbot keeps previous certificates under `/etc/letsencrypt/archive/`. Reverting the web server config to the previous certificate path and reloading restores service while the new certificate is sorted out.

## Follow-up

- Port 443 needs to be open in the [firewall](ufw.md) alongside 80.
- Renewal failures are easy to miss. The email address given to Certbot receives expiry warnings; a monitored address is worth using.
- A certificate is only half the job. The services that use it are hardened separately: [HSTS](../../web/runbooks/hsts.md) for the web server, [mail TLS](../../mail/runbooks/mail-tls.md) for the mail server.
Last updated: 10 July 2026
