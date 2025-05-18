# Disable unwanted HTTP methods

HTTP `TRACE` and `TRACK` requests can be used for legitimate purposes, such as debugging connection errors within the network, but these protocols can also compromise the security of a web server. One of the most common exploitation methods are [cross-site scripting (XSS) attacks], where attackers use and manipulate the `TRACE` and `TRACK` methods to intercept normal traffic connections, session cookies and possibly any data in transit.

Disable any HTTP methods, which are not going to be used and which are not required to be implemented on the web server.

## Nginx

Add this condition in the location block of the nginx virtual host configuration file, 

    location / {
    limit_except GET HEAD POST { deny all; }
    }

The server will only allow `GET`, `HEAD`, and `POST` methods and will filter out methods such as `PUT`, `DELETE`, `PATCH`, `TRACE`, `TRACK`, and `OPTIONS`.

Or for a more universal solution, add this condition to the server section (or server block):

    if ($request_method !~ ^(GET|HEAD|POST)$ ) {
        return 444; }

Note: Be very careful with `if` statements in the location context.

## Apache

Make sure that the `mod_rewrite` module and `.htaccess` are enabled. To enable the `mod_rewrite` module:

    # a2enmod rewrite

Add `AllowOverride All` in the VirtualHost configuration file:
	
    <VirtualHost *:80>
        ServerName  www.example.com
        DocumentRoot /var/www/html
     
        <Directory /var/www/html>
            AllowOverride All
        </Directory> 
    </VirtualHost>

Or enable it globally by editing the Apache main configuration file.

    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
    </Directory>

Restart Apache, and create a `.htaccess` file under the document root directory with the following code. 

    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} ^(PUT|DELETE|PATCH|TRACE|OPTIONS) 
    RewriteRule .* - [F]

The above configuration will disable `PUT`, `DELETE`, `PATCH`, `TRACE`, `TRACK`, and `OPTIONS` methods.