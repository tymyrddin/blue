# Webserver audit commands

Webservers are the front door to your digital house. A thorough audit ensures that door isn’t wide open (or quietly 
missing altogether).

## Software & version checks

```
httpd -v  # Apache version
nginx -v  # Nginx version
php -v    # PHP version (if applicable)
```

Outdated versions are hacker catnip. Patch them.

## Configuration review

```
cat /etc/apache2/apache2.conf       # Apache config
cat /etc/nginx/nginx.conf           # Nginx config
cat /etc/php/7.x/fpm/php.ini        # PHP settings
```

Look for ServerTokens, ServerSignature, directory listing, and dangerous PHP settings like `allow_url_fopen`.

## TLS & HTTPS

```
openssl s_client -connect yourdomain.com:443
```

Check certificate validity, issuer, and expiry. Let’s Encrypt is free, so no excuses.

Use SSL Labs Test for a thorough TLS configuration review.

## HTTP headers & security features

```
curl -I https://yourdomain.com
```

Ensure the presence of headers like:

* Strict-Transport-Security
* X-Content-Type-Options
* X-Frame-Options
* Content-Security-Policy

## File & directory permissions

```
ls -l /var/www/html/
```

No 777 permissions. Ever. Not even once.

## Logs & monitoring

```
tail -f /var/log/apache2/access.log
tail -f /var/log/nginx/access.log
```

Scan for odd requests, suspicious user agents, or IPs hammering the server.

## Vulnerability & attack surface

```
nikto -host https://yourdomain.com
```

A quick scanner for common vulnerabilities and misconfigurations.

For WordPress/Joomla/etc., check for outdated plugins and admin panels exposed at `/wp-admin`, `/admin`, etc.
