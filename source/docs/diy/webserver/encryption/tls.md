# (Re)configure TLS

Transport Layer Security (TLS) and its predecessor, Secure Socket Layer (SSL), are widely used protocols. They were designed to secure the transfer of data between the client and the server through authentication, encryption, and integrity protection.

All the SSL and TLS versions older than 1.2 are having lots of known vulnerabilities, which is why the latest browsers have removed support for these vulnerable protocols. 

Likewise, do not use old versions of the TLS protocol (TLSv1 TLSv1.1) on web servers, because they open the door to [SSL attacks](https://network.tymyrddin.dev/docs/notes/hacks). TLS 1.3 is preferred as it does not require manually specifying [cipher suites](cipher.md) in configuration.

## Nginx

Add this directive in the server section of the Nginx configuration file:

    ssl_protocols TLSv1.2 TLSv1.3;

Restart Nginx service.

## Apache

    <VirtualHost *:443>
        ServerName www.example.com
        DocumentRoot /var/www/html
    
        SSLEngine on
        SSLProtocol -all +TLSv1.2 +TLSv1.3
        SSLCertificateFile /etc/letsencrypt/live/example.com/cert.pem
        SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    </VirtualHost>

Restart Apache service.
