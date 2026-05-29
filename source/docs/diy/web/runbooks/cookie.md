# Harden cookie attributes

Hardening runbook. Sets the `Secure`, `HttpOnly`, and `SameSite` attributes on cookies, so that session tokens are not sent over plain HTTP, not readable by JavaScript, and not attached to cross-site requests. The three attributes cover three different attacks and do not overlap.

## When to run

On a web application during hardening, especially one that uses session cookies. When a [header check](check.md) or a look at `Set-Cookie` shows session cookies without these attributes.

## What each attribute does

- `Secure`: the cookie is never sent over plain HTTP, only HTTPS. A request that somehow goes out unencrypted does not carry the session token.
- `HttpOnly`: JavaScript cannot read the cookie. If an XSS payload runs, it cannot steal the session token through `document.cookie`.
- `SameSite=Strict` (or `Lax`): the cookie is not sent on cross-site requests, which is the mechanism cross-site request forgery depends on.

The target value for a session cookie:

```
Set-Cookie: session=value; Secure; HttpOnly; SameSite=Strict
```

## Where to set them

Best set by the application that issues the cookie, since it knows which cookies are session tokens and which need to be readable by scripts. Where the application cannot be changed, the web server can add the attributes to cookies passing through it.

## Risk

`Secure` on a cookie breaks the site if any part is still served over plain HTTP, since the cookie then never reaches the server. `SameSite=Strict` blocks the cookie on inbound cross-site navigation, which can break flows that rely on it (following a link from an external site into an authenticated area); `Lax` is the looser option where `Strict` is too restrictive. Confirm the site is fully HTTPS and test login and cross-site entry flows after the change.

## Apache

With `mod_headers`, append the attributes to cookies the application sets:

```
Header always edit Set-Cookie ^(.*)$ "$1; SameSite=Strict; Secure; HttpOnly"
```

## Nginx

When proxying to a backend:

```
proxy_cookie_flags ~ secure httponly samesite=strict;
```

For cookies Nginx sets directly:

```
add_header Set-Cookie "name=value; Secure; HttpOnly; SameSite=Strict";
```

Reload after either:

```
sudo nginx -t && sudo systemctl reload nginx
# or
sudo apachectl configtest && sudo systemctl reload apache2
```

## Verify

```
curl -sI https://example.com/login | grep -i set-cookie
```

Confirm the session cookie carries `Secure`, `HttpOnly`, and `SameSite`. Then log in through a browser and confirm the session works normally, and that a cross-site entry flow behaves as intended under the chosen `SameSite` value.

## Done

Session cookies carry `Secure`, `HttpOnly`, and `SameSite`. Login and session behaviour confirmed working. Any cookie that legitimately needs JavaScript access is deliberately exempt from `HttpOnly`, not exempt by accident.

## Rollback

Remove or relax the added attributes and reload. If `SameSite=Strict` breaks a needed cross-site flow, `Lax` is the usual middle ground rather than dropping the attribute entirely.

## Follow-up

- `Secure` complements [HSTS](hsts.md): one keeps the cookie off HTTP, the other keeps the connection on HTTPS.
- `HttpOnly` is a backstop for [CSP](csp.md): if XSS fires despite CSP, the session token is still out of the script's reach.
