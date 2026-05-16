# HTTP Host header injection

The HTTP `Host` header tells the server which virtual host the client is requesting. When application code uses the `Host` header value to construct URLs (for password reset links, redirects, canonical links, or cache keys), an attacker can substitute an arbitrary hostname and influence that output. The [Host header attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/headers.html) page covers the escalation paths: password reset poisoning, cache poisoning, and SSRF via routing misconfigurations.

## Use a configured hostname, not the request header

The Host header is client-controlled. Any URL constructed from it is attacker-influenced. The server's own hostname is a deployment configuration value, not something to read from the request:

```python
# Django: use the Sites framework or a settings value
from django.conf import settings

def build_reset_url(token: str) -> str:
    base = settings.SITE_URL  # e.g., "https://example.com"
    return f"{base}/password-reset/{token}/"
```

```python
# Flask: use SERVER_NAME from config
from flask import current_app

def build_reset_url(token: str) -> str:
    server = current_app.config["SERVER_NAME"]
    return f"https://{server}/password-reset/{token}/"
```

The configuration value is set during deployment; it is not influenced by request headers.

## Validating the Host header when it cannot be avoided

Some reverse proxy and load balancer setups pass the original Host header to the application for routing decisions. When the application code has to read `Host` for a legitimate reason, validating it against an explicit allowlist prevents injection:

```python
ALLOWED_HOSTS = {"example.com", "www.example.com"}

def validate_host(host: str) -> str:
    # strip port suffix if present
    hostname = host.split(":")[0].lower()
    if hostname not in ALLOWED_HOSTS:
        raise ValueError(f"host not permitted: {hostname!r}")
    return hostname
```

Django's `ALLOWED_HOSTS` setting performs this validation automatically and returns a 400 for requests with unrecognised Host headers.

## Reverse proxy configuration

The proxy layer is where Host header validation is most naturally enforced. An nginx virtual host that returns 444 (connection closed) for unrecognised hostnames prevents those requests from reaching the application:

```nginx
server {
    listen 80 default_server;
    return 444;
}

server {
    listen 80;
    server_name example.com www.example.com;
    # proxy to application
}
```

The `default_server` block acts as a catch-all that closes connections for any Host value not handled by a named server block.

## Override headers

Headers like `X-Forwarded-Host`, `X-Host`, and `X-Forwarded-Server` are sometimes used by proxies to preserve the original client-facing hostname through a chain of reverse proxies. When an application reads these headers and uses them to construct URLs, the same injection risk applies. Support for these headers is worth limiting to the specific proxy infrastructure that sends them, and only when the proxy is within the trusted network boundary.
