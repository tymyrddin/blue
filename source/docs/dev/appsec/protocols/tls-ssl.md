# Use Strong protocols & ciphers

* Disable SSL & Early TLS (SSLv3, TLS 1.0, TLS 1.1) – These are deprecated and vulnerable (e.g., POODLE, BEAST).
* Enforce TLS 1.2+ (TLS 1.3 preferred) – TLS 1.3 removes obsolete features and reduces attack surface.
* Prioritise Strong Ciphers – Use AES-GCM, ChaCha20-Poly1305 (avoid CBC mode where possible).

Example (Nginx config):

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-ECDSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers on;
```