# HTTP Strict Transport Security (HSTS)

HTTP Strict Transport Security (HSTS) is a method used by websites to declare that they should only be accessed using a secure connection (HTTPS). If a website declares an HSTS policy, the browser refuses all HTTP connections and prevents users from accepting insecure SSL certificates.

Browsers only honour HSTS headers delivered over HTTPS. Setting the header in a plain HTTP (`listen 80`) server block has no effect.

## Nginx

To add an HSTS header to a Nginx server, add the `Strict-Transport-Security` directive to the server section:

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

Example of the Nginx config file with the added HTTP Strict Transport Security (HSTS) header:

    upstream example {
        server localhost:8080;
    }
    server {
        listen 443 ssl;
        server_name example.test;
        add_header Strict-Transport-Security 'max-age=31536000; includeSubDomains; preload';
        location / {
            proxy_pass http://example;
        }
    }

## Apache

    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

## Resources

* [MDN Web docs: Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)