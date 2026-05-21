# Webserver audit commands

Webservers are the most visible part of a public infrastructure. A thorough audit checks that the configuration is intentional, exposure is minimal, and the usual mistakes are absent.

## Software & version checks

```
httpd -v  # Apache version
nginx -v  # Nginx version
php -v    # PHP version (if applicable)
```

Outdated versions carry known CVEs. Apply security patches promptly.

## Configuration review

```
cat /etc/apache2/apache2.conf       # Apache config
cat /etc/nginx/nginx.conf           # Nginx config
cat /etc/php/8.*/fpm/php.ini         # PHP settings (replace 8.* with the installed version)
```

Look for ServerTokens, ServerSignature, directory listing, and dangerous PHP settings like `allow_url_fopen`.

## TLS & HTTPS

```
openssl s_client -connect yourdomain.com:443
```

Check certificate validity, issuer, and expiry. Let's Encrypt certificates are available at no cost.

Use SSL Labs Test for a thorough TLS configuration review.

## HTTP headers & security features

```
curl -I https://yourdomain.com
```

Check for the presence of:

* Strict-Transport-Security
* X-Content-Type-Options
* X-Frame-Options
* Content-Security-Policy

## File & directory permissions

```
ls -l /var/www/html/
```

Permissions of 777 expose files to all users on the system and are worth catching early.

## Logs & monitoring

```
tail -f /var/log/apache2/access.log
tail -f /var/log/nginx/access.log
```

Scan for odd requests, suspicious user agents, or IPs making unusually high request volumes.

## Vulnerability & attack surface

```
nikto -host https://yourdomain.com
```

A quick scanner for common vulnerabilities and misconfigurations.

For WordPress/Joomla/etc., check for outdated plugins and admin panels exposed at `/wp-admin`, `/admin`, etc.
