# Set-Cookie

The `Set-Cookie` HTTP response header is used to send a cookie from the server to the user agent, so the user agent can send it back to the server later. To send multiple cookies, multiple `Set-Cookie` headers can be sent in the same response.

For example (the Domain attribute has been removed intentionally):

    Set-Cookie: name=value; Secure; HttpOnly; SameSite=Strict

## Apache

To append security attributes to cookies set by the application (requires `mod_headers`):

    Header always edit Set-Cookie ^(.*)$ "$1; SameSite=Strict; Secure; HttpOnly"

This modifies any `Set-Cookie` header the application produces. Useful when the application itself does not set these attributes.

## Nginx

When proxying to a backend, add cookie flags via the proxy module:

    proxy_cookie_flags ~ secure httponly samesite=strict;

For direct cookie headers set by Nginx itself:

    add_header Set-Cookie "name=value; Secure; HttpOnly; SameSite=Strict";

## Resources

* [MDN Web docs: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#Secure_and_HttpOnly_cookies)


