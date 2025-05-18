# Hide web server information

## Apache

If the `<Location /server-info>` directive in the `httpd.conf` configuration file is enabled, information about the Apache configuration can be read by accessing the `/server-info` page.
The information includes server version, system paths, database names, library information, etc.

This directive can be disabled by commenting out the `mod_info` module in the `httpd.conf` Apache configuration file:

    #LoadModule info_module modules/mod_info.so

The `<Location /server-status>` directive lists information about server performance, such as server uptime, server load, current HTTP requests, and client IP addresses. To disable this directive, comment it out in the `httpd.conf` Apache configuration file:

    #<Location /server-status>
    # SetHandler server-status
    # Order deny,allow
    # Deny from all
    # Allow from .domain.com
    #</Location>

The `ServerSignature` directive adds a footer to server-generated documents. The footer includes the version of Apache and the operating system. To disable this directive in the `httpd.conf` Apache configuration file:

    ServerSignature Off

The [ServerTokens](https://httpd.apache.org/docs/current/mod/core.html#servertokens) directive controls the information that is sent back in the Server response header field. To set it to `Prod` to instruct Apache to return only Apache in the server response headers, include this directive in the `httpd.conf` Apache configuration file:

    ServerTokens Prod

And restart Apache web server.

## Nginx

Find `nginx.conf` in `nginx installation directory/conf` on Windows systems, and in `/etc/nginx` or `/usr/local/etc/nginx` on Linux systems. You may also need to do some changes to virtual host configuration files in the `sites-available` subdirectory.

By default, the `server_tokens` directive in nginx displays the nginx version number. It is directly visible in all automatically generated error pages but also present in all HTTP responses in the Server header. To disable the `server_tokens` directive:

    server_tokens off

If you want to remove the Server header completely, you have to compile the `Headers More` module in, because the header is hard coded in the Nginx source, and it allows changing any http headers.

Then, to clear the Server header:

    more_clear_headers Server; 

Or to set a custom string as Server

    more_set_headers 'Server: some-string-here';
