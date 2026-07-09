# Rate limiting with ModEvasive

Hardening runbook. Installs ModEvasive on Apache to block source IPs that exceed a request-rate threshold. A supplementary layer against brute-force requests and low-rate application flooding.

## When to run

On an Apache server seeing repeated rapid requests from single sources (login brute force, scraping, low-volume flooding). As a preventative layer during setup of a public-facing Apache site.

## What it catches and what it does not

ModEvasive counts requests per Apache worker process. An attacker spreading requests across many connections may stay under any single worker's threshold. It handles lower-rate probing well; high-volume floods are caught more reliably by network-level rate limiting (nftables or a reverse proxy) that acts before Apache sees the connection.

## Steps

### Install

```
sudo apt install libapache2-mod-evasive
sudo a2enmod evasive
```

Create the log directory Apache will write blocks to:

```
sudo mkdir -p /var/log/mod_evasive
sudo chown www-data:www-data /var/log/mod_evasive
```

### Configure

Edit `/etc/apache2/mods-available/evasive.conf`:

```
<IfModule mod_evasive24.c>
    DOSHashTableSize    3097
    DOSPageCount        5
    DOSSiteCount        50
    DOSPageInterval     1
    DOSSiteInterval     1
    DOSBlockingPeriod   10
    DOSLogDir           /var/log/mod_evasive
    DOSWhitelist        127.0.0.1
</IfModule>
```

What the thresholds mean:

- `DOSPageCount`: requests to the same URI within `DOSPageInterval` seconds before the source is blocked.
- `DOSSiteCount`: total requests to the site within `DOSSiteInterval` seconds before blocking.
- `DOSBlockingPeriod`: seconds a blocked IP receives 403s before the block lifts.
- `DOSWhitelist`: addresses exempt from limits. Monitoring tools and known internal addresses belong here.

### Risk

The default thresholds are tight. On a busy public site they can block legitimate traffic spikes. Whitelist monitoring and uptime-check sources, and raise the counts if real users trip the limit. Test before relying on it.

Reload:

```
sudo systemctl reload apache2
```

## Verify

A test script ships with the package:

```
perl /usr/share/doc/libapache2-mod-evasive/examples/test.pl
```

It sends a rapid burst to localhost. Blocked requests return HTTP 403 and the source IP appears in `/var/log/mod_evasive`. If no log file appears, the log directory path or its ownership is the likely cause.

## Done

ModEvasive enabled. A burst from the test script results in 403s and a log entry. Legitimate monitoring sources are whitelisted. Apache reloaded cleanly.

## Rollback

```
sudo a2dismod evasive && sudo systemctl reload apache2
```

This removes the rate limiting entirely. Use it if false positives are blocking real users while the thresholds are reconsidered.

## Follow-up

- For high-volume floods, add network-level rate limiting ahead of Apache; ModEvasive is the supplementary layer.
- A [WAF](mod_security.md) covers a different class of attack (malicious request content).
Last updated: 10 July 2026
