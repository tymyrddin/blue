# X-Frame-Options

The `X-Frame-Options` HTTP response header defends an application from [clickjacking attacks](https://webapp.tymyrddin.dev/docs/techniques/clickjacking). It can be used to indicate whethera browser is allowed to render a page in a `frame`, `iframe`, `embed` or `object`.  

For example, to disallow displaying of a page in a frame:

    X-Frame-Options: DENY

This header can be configured in three ways:

* `DENY` – disables the iframe features completely.
* `SAMEORIGIN` – allows iframe to be used by anyone from the same origin.
* `ALLOW-FROM` – allows iframes from specific URLs

## Nginx

Add the following parameter to the nginx configuration file in the server section:

    add_header X-Frame-Options "SAMEORIGIN";

## Apache

    Header always set X-Frame-Options "SAMEORIGIN"

## Resources

* [MDN Web docs: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
