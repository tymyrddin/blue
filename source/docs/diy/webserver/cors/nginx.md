# CORS on Nginx

## Single origin

In the `server` or `location` block, set the allowed origin and methods:

    location /api/ {
        add_header Access-Control-Allow-Origin "https://example.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

        if ($request_method = OPTIONS) {
            add_header Content-Length 0;
            return 204;
        }
    }

The `always` parameter ensures the header is added even on error responses, which is needed for browsers to surface CORS errors correctly.

## Public API (any origin)

    add_header Access-Control-Allow-Origin "*" always;

A wildcard origin cannot be combined with `Access-Control-Allow-Credentials: true`. Credentialed requests require reflecting the request's `Origin` header explicitly.

## Resources

* [MDN Web docs: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
* [MDN Web docs: Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)
