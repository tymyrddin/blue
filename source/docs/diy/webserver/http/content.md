# Content-Type

The `Content-Type` representation header is used to indicate the original media type of the resource (before any content encoding is applied for sending).

For example:

    Content-Type: text/html; charset=UTF-8

* The `charset` attribute is necessary to prevent XSS in HTML pages
* The `text/html` can be any of the possible MIME types

## Resources

* [MDN Web docs: Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)