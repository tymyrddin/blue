# Install and use ModEvasive

ModEvasive watches the rate of incoming requests and blocks IP addresses that exceed configurable thresholds. It is a simple layer of defence against brute-force requests and some forms of application-layer flooding, not a substitute for network-level rate limiting.

## Installation

```bash
apt install libapache2-mod-evasive
a2enmod evasive
```

Create the log directory and set ownership so Apache can write to it:

```bash
mkdir -p /var/log/mod_evasive
chown www-data:www-data /var/log/mod_evasive
```

## Configuration

Edit `/etc/apache2/mods-available/evasive.conf`:

```apache
<IfModule mod_evasive24.c>
    DOSHashTableSize    3097
    DOSPageCount        5
    DOSSiteCount        50
    DOSPageInterval     1
    DOSSiteInterval     1
    DOSBlockingPeriod   10
    DOSLogDir           /var/log/mod_evasive
    DOSWhitelist        127.0.0.1
    DOSWhitelist        10.0.0.*
</IfModule>
```

Directives:

- `DOSPageCount`: requests to the same URI within `DOSPageInterval` seconds before the source IP is blocked.
- `DOSSiteCount`: total requests to the site within `DOSSiteInterval` seconds before blocking.
- `DOSBlockingPeriod`: seconds a blocked IP receives 403 responses before the block expires.
- `DOSWhitelist`: IP addresses or CIDR ranges exempt from rate limits. Monitoring tools and known internal addresses are worth adding here.

The defaults above are conservative. A busy public site may see false positives during legitimate traffic spikes and may need higher counts or wider intervals.

## Testing

Reload first:

```bash
systemctl reload apache2
```

A test script ships with the package:

```bash
perl /usr/share/doc/libapache2-mod-evasive/examples/test.pl
```

The script sends a rapid burst of requests to localhost. A blocked request returns HTTP 403 and the source IP appears in the log directory. If no log file appears, the log directory path or permissions are likely the issue.

## Limitations

ModEvasive counts per-process, not across all Apache worker processes. An attacker distributing requests across many connections may not trigger any single worker's threshold. Network-level rate limiting via nftables or a reverse proxy operates before Apache sees the connection and catches high-volume floods more consistently. ModEvasive works well for lower-rate probing and as a supplementary layer.
