# CORS on Apache

Enable the `headers` module if not already active:

    # a2enmod headers

## Single origin

To allow requests from a specific origin, add to the virtual host or a `Location` block:

    Header always set Access-Control-Allow-Origin "https://example.com"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

Handle preflight `OPTIONS` requests by returning 200 immediately (requires `mod_rewrite`):

    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^ - [R=200,L]

## Public API (any origin)

    Header always set Access-Control-Allow-Origin "*"

A wildcard origin cannot be combined with `Access-Control-Allow-Credentials: true`. If credentialed requests are needed, the origin must be explicitly reflected from the `Origin` request header rather than using `*`.

## Resources

* [MDN Web docs: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
* [MDN Web docs: Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)
