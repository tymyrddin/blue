# Content Security Policy (CSP)

Content Security Policy (CSP) protects the web server against certain types of attacks, including [Cross-site Scripting attacks (XSS)](https://webapp.tymyrddin.dev/docs/techniques/xss) and data injection attacks. These attacks are used for everything from data theft to site defacement to distribution of malware. It defines the approved content sources that allow the browser to load them (or not). 

For example, to restrict most of the resource types to the same site and subdomains of `example.com`:

    Content-Security-Policy: default-src 'self' *.example.com; font-src 'self' https: data:; img-src 'self' data: blob:; object-src 'none'; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;

Inline script elements and inline script event handlers like `onload` will stop working with the above header. This is required to neutralise XSS attacks.

You may see mentions of the `X-Content-Security-Policy` header, but that's an older version.

Add the `Content-Security-Policy` header to match your requirements.

## Nginx

    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; font-src 'self' https:; style-src 'self' https:; object-src 'none'; upgrade-insecure-requests;" always;

## Apache

    Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data:; font-src 'self' https:; style-src 'self' https:; object-src 'none'; upgrade-insecure-requests;"

## Resources

* [MDN Web docs: Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
