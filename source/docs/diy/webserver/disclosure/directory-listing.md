# Disable directory listing

Web servers by default display the content of the documents and files in the root directory when an index.html file is missing. This means that a potential attacker could possibly view all of the files and subdirectories that are presented to the browser.

As with the [hiding of version and OS identity](hide-info.md), this is not a direct security threat 
as it only allows the attacker to gain information.

## Apache

Add the following configuration in `/etc/apache2/apache2.conf` to disable directory listing globally (server wide):

```
<Directory />
    Options -Indexes 
</Directory>
```

Do not overwrite this inside any directory. Your root directory may look like this:

```
<Directory />
    Options FollowSymLinks
    AllowOverride None
</Directory>
```

`AllowOverride None` will prevent any accidental changes in `.htaccess` files.

After that you can enable listing per directory by adding the `Indexes` option:

```
<Directory /www/directory>
    Options Indexes FollowSymLinks
    AllowOverride None
</Directory>
```

This enables the generation of `Indexes` only in that folder. 

## Nginx 

Nginx cannot directly execute external programs (CGI). Phew. But if you really really want it to, use [fcgi](https://www.nginx.com/resources/wiki/start/topics/examples/fastcgiexample/) securely.

## Disable SSI and autoindex execution 

The `ngx_http_autoindex_module` processes requests ending with the slash character `/` and produces a directory listing. Usually a request is passed to the `ngx_http_autoindex_module` when the `ngx_http_index_module` cannot find an index file.

You can configure and install Nginx using only required modules. To see which modules can be turned on or off while compiling the Nginx server:

    # ./configure --help | less

To disable the SSI and autoindex module:

    # ./configure --without-http_autoindex_module --without-http_ssi_module
    # make
    # make install
