# Mitigate known vulnerabilities

* Disable Compression (CRIME attack) – TLS compression can leak session cookies.
* Disable Renegotiation – Prevent DoS and MITM via insecure renegotiation.
* Disable TLS Session Tickets (if not needed) – Potential replay attack vector.

Example (Cloudflare settings):

    Disable TLS 1.0/1.1, enable TLS 1.3, disable SSL compression.