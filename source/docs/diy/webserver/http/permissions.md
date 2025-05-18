# Permissions-Policy

The HTTP `Permissions-Policy` header provides a mechanism to allow and deny the use of browser features in a document or within any `frame` elements in the document. It allows a site to control which APIs or features can be used in the browser.

## Apache

    Header always set Permissions-Policy "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self),payment=()"

## Nginx

    add_header Permissions-Policy "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self),payment=()";

## Resources

* [MDN Web docs: Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)