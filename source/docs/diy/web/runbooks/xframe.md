# Prevent clickjacking with frame controls

Hardening runbook. Stops other sites from embedding the application in an iframe, which closes the clickjacking attack: a transparent frame of the real site overlaid on a decoy, so a user's click lands on the hidden page and performs an action under their own logged-in session.

## When to run

On a web application during hardening. When a [header check](check.md) shows neither `X-Frame-Options` nor a CSP `frame-ancestors` directive is set.

## The two mechanisms

`X-Frame-Options` is the older header, understood by all browsers:

- `DENY`: the page cannot be framed by anyone.
- `SAMEORIGIN`: only pages from the same origin may frame it.

`frame-ancestors` in CSP is the current replacement and allows per-origin allow-listing, which `X-Frame-Options` cannot do (its `ALLOW-FROM` option was removed from modern browsers). Setting both covers older browsers via the header and newer ones via CSP, with `frame-ancestors` taking precedence where supported.

## Risk

`DENY` or `SAMEORIGIN` breaks any legitimate embedding of the page: a dashboard intentionally iframed into another internal tool, a widget meant to be embedded, a payment flow rendered in a frame. Confirm whether anything is supposed to frame the page before denying it. Where legitimate embedding exists, `frame-ancestors` with an explicit allow-list fits better than a blanket `DENY`.

## Nginx

```
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Content-Security-Policy "frame-ancestors 'self'" always;
```

## Apache

```
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Content-Security-Policy "frame-ancestors 'self'"
```

For a page that nothing should ever frame, use `DENY` and `frame-ancestors 'none'`. For specific allowed embedders, list them: `frame-ancestors 'self' https://trusted.example.com`.

Reload:

```
sudo nginx -t && sudo systemctl reload nginx
# or
sudo apachectl configtest && sudo systemctl reload apache2
```

## Verify

```
curl -sI https://example.com | grep -iE "x-frame-options|frame-ancestors"
```

Confirm the header(s) are present with the intended value. Then confirm any legitimate embedding of the page still works, and that an attempt to frame it from an unapproved origin is blocked (a quick test page with an iframe pointing at the site will show a blank or refused frame).

## Done

`X-Frame-Options` and CSP `frame-ancestors` present with the intended scope. Legitimate embedding (if any) still works. Framing from an unapproved origin is refused.

## Rollback

Widen `frame-ancestors` to include a newly needed embedder, or remove the headers and reload, if a legitimate embedding turns out to be blocked. Prefer widening the allow-list over removing the protection.

## Follow-up

- Confirm with a [security header check](check.md).
- `frame-ancestors` is part of [CSP](csp.md); a site setting a full CSP can carry the frame control there.
Last updated: 10 July 2026
