# Let's Encrypt

[Let's Encrypt](https://letsencrypt.org/) is a free, automated, and open Certificate Authority run by the Internet Security Research Group (ISRG). Certbot is the official client for obtaining and renewing Let's Encrypt certificates.

## Installation

Install Certbot and the Nginx plugin:

    # apt install certbot python3-certbot-nginx

For Apache:

    # apt install certbot python3-certbot-apache

## Obtaining a certificate

Get a certificate and have Certbot edit the Nginx configuration automatically:

    # certbot --nginx

For Apache:

    # certbot --apache

Certbot will prompt for a domain name and an email address for renewal notices. On success, the certificates are placed in `/etc/letsencrypt/live/<your-domain>/`.

## Verification

Check the certificate files are present:

    # ls /etc/letsencrypt/live/<your-domain>/
    cert.pem  chain.pem  fullchain.pem  privkey.pem

Verify the Nginx configuration syntax:

    # nginx -t

Reload to apply:

    # systemctl reload nginx

## Auto renewal

Certbot installs a systemd timer that renews certificates automatically before they expire (certificates are valid for 90 days). Test the renewal process:

    # certbot renew --dry-run

Check the timer status:

    # systemctl status snap.certbot.renew.timer

## Firewall

HTTPS traffic (port 443) needs to be open in the firewall alongside the existing HTTP port.

## Configuration resources

* [Certbot documentation](https://certbot.eff.org/), EFF
* [Let's Encrypt documentation](https://letsencrypt.org/docs/)
