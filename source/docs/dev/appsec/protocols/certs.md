# Certificate management

* Use Trusted Certificate Authorities (CAs) – Avoid self-signed certs in production.
* Short-Lived Certificates – Rotate certs frequently (e.g., via Let’s Encrypt with 90-day validity).
* OCSP Stapling – Reduce latency and privacy leaks by caching revocation status.
* HSTS (HTTP Strict Transport Security) – Enforce HTTPS and prevent downgrade attacks.

Example (Apache config):

```apache
Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
SSLUseStapling on
```