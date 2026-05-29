# Set a Content Security Policy

Hardening runbook. Adds a `Content-Security-Policy` header that tells the browser which sources it may load scripts, styles, and other content from. Its main job is to neutralise cross-site scripting: an injected script from an unapproved source has nowhere to run.

## When to run

On a web application during hardening. The change can break a working site if the policy is stricter than the site's actual content, so it is approached in report-only mode first on anything already in production.

## Approach

Start in report-only mode, see what the policy would block, fix or allow the legitimate sources, then enforce. A policy written and enforced blind will block the site's own scripts and styles as readily as an attacker's.

## Risk

A CSP that does not match the site's real content blocks the site's own resources: inline scripts stop running, styles fail to load, third-party widgets break. `Content-Security-Policy-Report-Only` applies the policy without enforcing it, logging violations instead, so the breakage can be found before it is live.

## Report-only first

Send the report-only header with the intended policy. The browser reports what it would block without blocking it. In Nginx:

```
add_header Content-Security-Policy-Report-Only "default-src 'self'; img-src 'self' data:; style-src 'self' https:; object-src 'none'" always;
```

Load the site, check the browser console for CSP violation reports, and adjust the policy until legitimate content no longer triggers them.

## Enforce

Once report-only is clean, switch to the enforcing header.

Nginx:

```
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; font-src 'self' https:; style-src 'self' https:; object-src 'none'; upgrade-insecure-requests;" always;
```

Apache:

```
Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data:; font-src 'self' https:; style-src 'self' https:; object-src 'none'; upgrade-insecure-requests;"
```

Reload:

```
sudo nginx -t && sudo systemctl reload nginx
# or
sudo apachectl configtest && sudo systemctl reload apache2
```

## What weakens it

`unsafe-inline` or `unsafe-eval` in `script-src` largely removes the XSS protection for those vectors: it permits exactly the inline injection CSP exists to stop. Avoid them where the site can be restructured to use external scripts, or use nonces. A policy containing them looks present in a scan but protects little. (The older `X-Content-Security-Policy` header name is obsolete; use `Content-Security-Policy`.)

## Verify

```
curl -sI https://example.com | grep -i content-security-policy
```

Confirm the enforcing header is present (not report-only). Load the site in a browser and confirm the console shows no CSP violations from legitimate content, and that scripts, styles, and images render.

## Done

Enforcing `Content-Security-Policy` header present. No violations from the site's own content. `script-src` free of `unsafe-inline` and `unsafe-eval`, or the exceptions are deliberate and noted. Site renders correctly.

## Rollback

Switch back to `Content-Security-Policy-Report-Only` (keeps reporting, stops blocking) or remove the header and reload. Report-only is the safe fallback if enforcement breaks something on a live site: it preserves visibility while restoring function.

## Follow-up

- Confirm with a [security header check](check.md).
- CSP limits execution, not injection itself. Server-side input handling and [nosniff](../reading-logs.md) close related gaps; see the [webserver stack](../stack.md).
