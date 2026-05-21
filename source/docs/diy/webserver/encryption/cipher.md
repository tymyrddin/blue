# Manually specify cipher suite

TLS uses cipher suites to negotiate authentication, key exchange, and encryption for each
connection. TLS 1.3 handles cipher selection automatically and does not require manual
configuration. TLS 1.2 requires explicit configuration to exclude weak algorithms.

The configuration below reflects the Mozilla intermediate profile, which supports clients back to
Firefox 27 and Chrome 30 while excluding known-weak algorithms. Depending on regulatory
requirements or the need to support older browsers, a different profile may be more appropriate.
The [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/) produces ready-to-use
configs for Nginx, Apache, HAProxy, and others across modern, intermediate, and old profiles.

## Nginx

In the `http` block or a server block:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
```

`ssl_prefer_server_ciphers off` allows clients to select the cipher, which means TLS 1.3
is preferred when both sides support it.

Test and reload:

```bash
nginx -t && systemctl reload nginx
```

## Apache

In the global SSL configuration (`/etc/apache2/mods-enabled/ssl.conf`) or a virtual host:

```apache
SSLProtocol             all -SSLv3 -TLSv1 -TLSv1.1
SSLCipherSuite          ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256
SSLHonorCipherOrder     off
SSLSessionTickets       off
```

Test and reload:

```bash
apachectl configtest && systemctl reload apache2
```

## Verification

Check the negotiated cipher from an external host:

```bash
openssl s_client -connect example.com:443 </dev/null 2>/dev/null | grep "Cipher"
```

Or use [SSL Labs](https://www.ssllabs.com/ssltest/) for a full analysis including protocol
support, certificate chain, and known vulnerabilities.
