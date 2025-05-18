# Let's Encrypt

Web PKI being yet another golden goose in the context of the business model that underpins the digital world. , we also have an alternative. [Let’s Encrypt](https://letsencrypt.org/) is a free, automated, and open Certificate Authority. The below is for debian (stretch).

## Installation certbot

Certbot is in active development, so the packages provided by Debian with stable releases tend to be outdated. Get a more up-to-date package by enabling the backports repository. Create the `/etc/apt/sources.list.d/letsencrypt.list` file and append:

    # echo 'deb http://deb.debian.org/debian <distribution>-backports main contrib non-free' >> /etc/apt/sources.list.d/letsencrypt.list

    # echo 'deb-src http://deb.debian.org/debian <distribution>-backports main contrib non-free' >> /etc/apt/sources.list.d/letsencrypt.list

Update the package list to pick up the new repository's package information:

    # apt update

Install on Nginx with:

    # apt install python-certbot-nginx -t <distribution>-backports

## Get SSL certificate

Get a certificate and have Certbot edit your Nginx configuration automatically to serve it, turning on HTTPS access in a single step.

    # certbot --nginx

## Verification

Check the `/etc/letsencrypt/live/<your-domain>/` directory for the presence of `cert.pem`, `privkey.pem` and `chain.pem`.

Certbot looks for a `server_name` directive that matches your domain. Open the server block file for your domain:

    # vi /etc/nginx/sites-available/yourdomain.tld

If necessary, change the `server_name` directive to:

    server_name yourdomain.tld www.yourdomain.tld;

Verify the syntax of your configuration file:

    # nginx -t

Reload Nginx to load the new configuration:

    # systemctl reload nginx

## Firewall

Punch a hole in the firewall to allow HTTPS traffic (allow the Nginx Full profile) and delete the redundant Nginx HTTP profile allowance.

## Auto renewal

Certbot comes with a renew script in `/etc/cron.d` that will renew your certificates automatically before they expire (they last for 90 days). Test automatic renewal:

    # certbot renew --dry-run

## Configuration resources

* [Certbot instructions](https://certbot.eff.org/lets-encrypt/debianstretch-nginx.html), EFF

