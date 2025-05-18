# Restrict file and directory access

## Apache

To restrict a directory from access by users, deny all users using the `Directory` directive:

```
<Directory "/var/www/directory">
    Order Deny,Allow
    Deny from all
    Allow from 192.168.1.0/24
    Allow from .core.com
</Directory>
```

To restrict a file using the `File` directive:

```
# The following lines prevent .htaccess and .htpasswd files from being 
# viewed by Web clients. 
#
<Files ~ "^\.ht">
    Order allow,deny
    Deny from all
    Satisfy all
</Files>
```

To limit the scope of enclosed directives by URL use the `Location` directive:

```
<Location /admin>
    Order Deny,Allow
    Deny from all
    Allow from 192.168.1.0/24
    Allow from .core.com
</Location>
```

## Nginx

The Apache `.htaccess` is comparable to the `server{} block` in Nginx, but Nginx has a much more lightweight approach to parsing configuration, and it will not scan site directories for additional configurations.

To restrict access to multiple directories in one location entry will give a 403 because of the `deny all`:
    
    ...
    location ~ /(dir1|dir2|dir3) {
       deny all;
       return 404;
    }
    ...

To allow public access to a `/data/public` directory and execution of php scripts in it while denying public access to its subdirectories, put the php location in another file called `php.conf` and include that file in the server block and in the `/data/public/` block.

The config:

    server {
        location ^~ /data/public/ {
            allow all;
            try_files $uri $uri/ /index.php?args;
            # include to avoid writing it twice..
            include php.conf
        }

        location ^~ /data/ { 
            deny all; 
        }

        # .....
        # Some other config blocks
        # .....

        # This line instead of the php config block to avoid writing the php part twice
        include php.conf
    }

And the `php.conf` file:

    location ~ \.php$ {
         fastcgi_split_path_info ^(.+\.php)(/.+)$;
         fastcgi_pass unix:/var/run/php-fpm/php-fpm.sock;
         fastcgi_index index.php;
         include fastcgi_params;
    }
