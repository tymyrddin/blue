# X-Frame-Options

The `X-Frame-Options` HTTP response header defends an application from [clickjacking attacks](https://webapp.tymyrddin.dev/docs/techniques/clickjacking). It can be used to indicate whether a browser is allowed to render a page in a `frame`, `iframe`, `embed` or `object`.  

For example, to disallow displaying of a page in a frame:

    X-Frame-Options: DENY

This header supports two current options:

* `DENY`: disables iframe embedding completely.
* `SAMEORIGIN`: allows embedding only by pages from the same origin.

`ALLOW-FROM` was a third option for allowing iframes from a specific URL, but it has been deprecated and removed from Chrome, Firefox, and Edge. The CSP `frame-ancestors` directive is the current replacement for origin-specific allow-listing.

## Nginx

Add the following parameter to the nginx configuration file in the server section:

    add_header X-Frame-Options "SAMEORIGIN";

## Apache

    Header always set X-Frame-Options "SAMEORIGIN"

## Resources

* [MDN Web docs: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
