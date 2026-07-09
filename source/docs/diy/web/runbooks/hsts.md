# Enforce HTTPS with HSTS

Hardening runbook. Adds the `Strict-Transport-Security` header so that, once a browser has seen the site over HTTPS, it refuses to connect over plain HTTP to that domain. This closes the gap where a user typing the bare domain, or following an HTTP link, makes an interceptable first request.

## When to run

On a site already served over HTTPS with a valid certificate. After confirming all subdomains are HTTPS-capable, if `includeSubDomains` will be used.

## Prerequisites

A working HTTPS setup with a valid certificate ([Let's Encrypt](../../server/runbooks/lets-encrypt.md) for public sites). HSTS on a site whose HTTPS is broken makes the site unreachable, since the browser will refuse the HTTP fallback.

## Risk

HSTS is sticky and hard to undo. Once a browser caches the policy, it enforces it for the full `max-age` regardless of later changes. With `includeSubDomains`, every subdomain has to serve valid HTTPS for the whole period; one that cannot becomes unreachable in browsers that saw the header. With `preload`, the domain is baked into browser preload lists and removal is slow. Confirm HTTPS works everywhere it needs to before adding `includeSubDomains` or `preload`.

The header is only honoured over HTTPS. Setting it in a plain `listen 80` block has no effect.

## Nginx

In the HTTPS (`listen 443 ssl`) server block:

```
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Add `preload` only when committing to the preload list deliberately.

## Apache

In the HTTPS virtual host:

```
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

Reload after either:

```
sudo nginx -t && sudo systemctl reload nginx
# or
sudo apachectl configtest && sudo systemctl reload apache2
```

## Verify

```
curl -sI https://example.com | grep -i strict-transport-security
```

The header should be present with the intended `max-age`. Confirm it is absent on the plain HTTP response (it should only come over HTTPS), and that the site still loads normally over HTTPS.

## Done

`Strict-Transport-Security` present on HTTPS responses with the intended `max-age`. HTTPS works across all covered subdomains if `includeSubDomains` is set. Site loads normally.

## Rollback

Removing the header stops it being sent to new visitors, but browsers that already cached it keep enforcing until `max-age` expires. To shorten the window during a problem, serve the header with `max-age=0` over HTTPS; browsers that connect will clear the policy. This only reaches browsers that can still make an HTTPS connection.

## Follow-up

- Confirm with a [security header check](check.md).
- Pair with the `Secure` cookie flag ([Set-Cookie](cookie.md)) so session tokens never travel over HTTP.
Last updated: 29 May 2026
