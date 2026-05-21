# Content-Type

The `Content-Type` representation header is used to indicate the original media type of the resource (before any content encoding is applied for sending).

For example:

    Content-Type: text/html; charset=UTF-8

* The `charset` attribute is necessary to prevent XSS in HTML pages
* The `text/html` can be any of the possible MIME types

## Apache

Set a default charset for all text responses in the virtual host or global config:

    AddDefaultCharset UTF-8

Override or declare specific MIME types:

    AddType text/html .html
    AddType application/json .json

## Nginx

Nginx sets `Content-Type` automatically based on `mime.types`. To attach a charset to text responses, add to the `http`, `server`, or `location` block:

    charset utf-8;
    charset_types text/html text/css application/javascript application/json;

## Resources

* [MDN Web docs: Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)