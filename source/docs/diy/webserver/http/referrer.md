# Referrer-Policy

The `Referrer-Policy` HTTP header controls how much referrer information (sent via the Referer header) should be included with requests.

For example:

    Referrer-Policy: strict-origin-when-cross-origin

Meaning, send the origin, path, and querystring when performing a same-origin request. For cross-origin requests send the origin (only) when the protocol security level stays same (HTTPS → HTTPS). Do not send the Referrer header to less secure destinations (HTTPS → HTTP).

By checking the referrer, the new webpage can see where the request originated. The `Referrer-Policy` can be configured to cause the browser to not inform the destination site any URL information.

## Apache

    Header always set Referrer-Policy "strict-origin"

## Nginx

    add_header Referrer-Policy "strict-origin";

## Resources

* [MDN Web docs: Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy)
