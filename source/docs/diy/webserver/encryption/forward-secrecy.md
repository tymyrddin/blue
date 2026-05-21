# Configure forward secrecy

Forward secrecy means each TLS session uses an ephemeral key pair, generated fresh for that connection and discarded afterwards. If the server's long-term private key is later compromised, recorded past sessions cannot be decrypted because the ephemeral keys were never stored.

The contrast is with RSA key exchange, where the client encrypts the pre-master secret using the server's long-term public key. Anyone who later obtains that private key can decrypt any session recorded at the time.

TLS 1.3 uses only ECDHE (Elliptic Curve Diffie-Hellman Ephemeral), so forward secrecy is automatic. TLS 1.2 requires explicit configuration to prefer ECDHE or DHE ciphers and exclude RSA key exchange.

## DH parameter file

For DHE on TLS 1.2, a Diffie-Hellman parameter file sets the prime used in key exchange. Without a custom file, Nginx falls back to a 1024-bit prime, which is too weak for current practice. Generating a fresh file at 2048 bits is worth doing before enabling DHE ciphers.

```bash
openssl dhparam -out /etc/nginx/dhparam.pem 2048
```

2048 bits is widely accepted. 4096 bits offers a larger margin at the cost of noticeably slower handshakes on low-powered hardware.

## Nginx

In the `http` block or a server block:

```nginx
ssl_dhparam /etc/nginx/dhparam.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
```

`ssl_prefer_server_ciphers off` lets the client choose, which typically means ECDHE is selected when both sides support it.

Test and reload:

```bash
nginx -t && systemctl reload nginx
```

## Apache

Generate the DH parameters (any readable path works; `/etc/ssl/dhparam.pem` is conventional):

```bash
openssl dhparam -out /etc/ssl/dhparam.pem 2048
```

In the global SSL configuration (`/etc/apache2/mods-enabled/ssl.conf`) or a virtual host:

```apache
SSLProtocol             all -SSLv3 -TLSv1 -TLSv1.1
SSLCipherSuite          ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256
SSLHonorCipherOrder     off
SSLOpenSSLConfCmd       DHParameters "/etc/ssl/dhparam.pem"
```

Test and reload:

```bash
apachectl configtest && systemctl reload apache2
```

## Verification

Confirm that ephemeral key exchange is in use:

```bash
openssl s_client -connect example.com:443 </dev/null 2>/dev/null | grep "Server Temp Key"
```

Output containing `ECDH` or `DH` confirms an ephemeral key was negotiated. An `RSA` line here means the cipher suite fell back to static key exchange.

[SSL Labs](https://www.ssllabs.com/ssltest/) reports forward secrecy coverage across all tested cipher suites under the "Forward Secrecy" row, and flags any cipher that does not provide it.
