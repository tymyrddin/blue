# X-XSS-Protection

The HTTP X-XSS-Protection response header is a feature of Safari, Internet Explorer 8+, and Google Chrome that stops pages from loading when they detect reflected cross-site scripting (XSS) attacks. 

For example, to prevent browsers from rendering pages if an attack is detected:

    X-XSS-Protection: 1; mode=block

The header can be implemented in three ways:

* `X-XSS-Protection: 0` – disables the filter completely.
* `X-XSS-Protection: 1` – enforces the header but only sanitises potential malicious scripts.
* `X-XSS-Protection: 1; mode=block` – enforces the feature and completely blocks the page.

These protections are largely unnecessary in modern browsers when sites implement a strong [Content-Security-Policy](csp.md) that disables the use of inline JavaScript ('unsafe-inline').

## Apache

    Header always set X-XSS-Protection "1; mode=block"

## Nginx

    add_header X-XSS-Protection "1; mode=block" always;

## Resources

* [MDN Web docs: X-XSS-Protection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection)

