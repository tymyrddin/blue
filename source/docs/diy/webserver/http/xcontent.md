# X-Content-Type-Options

The `X-Content-Type-Options` response HTTP header is used by the server to prevent browsers from guessing the media type (MIME type). This is known as MIME sniffing in which the browser guesses the correct MIME type by looking at the contents of the resource. The absence of this header might cause browsers to transform non-executable content into executable content.

This header helps mitigate the danger of drive-by downloads. 

## Apache

    Header always set X-Content-Type-Options "nosniff"

## Nginx

    X-Content-Type-Options: nosniff

## Resources

* [MDN Web docs: X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)

