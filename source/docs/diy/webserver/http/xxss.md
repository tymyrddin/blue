# X-XSS-Protection

`X-XSS-Protection` is deprecated. Chrome removed it in version 78, Firefox never implemented it, and it is no longer maintained in any major browser. New deployments are better served by a strong [Content-Security-Policy](csp.md) with `script-src` restrictions, which provides equivalent or better protection across all modern browsers.

The header may still appear in configurations targeting older Safari or Internet Explorer environments. It stops pages from loading when they detect reflected cross-site scripting (XSS) attacks. The three values:

* `X-XSS-Protection: 0` – disables the filter completely.
* `X-XSS-Protection: 1` – sanitises potential malicious scripts without blocking the page.
* `X-XSS-Protection: 1; mode=block` – blocks the page entirely if an attack is detected.

## Apache

    Header always set X-XSS-Protection "0"

## Nginx

    add_header X-XSS-Protection "0" always;

## Resources

* [MDN Web docs: X-XSS-Protection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection)

