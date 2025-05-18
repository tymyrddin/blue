# Install and use ModSecurity

ModSecurity (`mod_security`) is an open-source IDS and prevention engine, originally developed for Apache, and now also available for Nginx (and other platforms) in a "standalone" version.

ModSecurity works as a supplemental firewall for the web server, allowing you to monitor traffic in real-time, and disabling host connections if the module suspects potential brute-force password attacks. 

## Nginx

To install it without (re)compiling Nginx, install the dependencies:

    # apt-get install libxml2 libxml2-dev libxml2-utils libaprutil1 libaprutil1-dev

And download, compile and install `mod_security`:

    # git clone https://github.com/SpiderLabs/ModSecurity.git mod_security
    # cd mod_security
    ~/mod_security# ./autogen.sh
    ~/mod_security# ./configure --enable-standalone-module
    ~/mod_security# make

To compile Nginx from source with the modsecurity module (check for latest version here: http://nginx.org/en/download.html)

    # wget http://www.nginx.org/download/nginx-1.9.5.tar.gz
    # tar -xvpzf nginx-1.9.5.tar.gz
    # cd nginx-1.9.5
    ~/nginx-1.9.5# ./configure --add-module=../mod_security/nginx/modsecurity
    ~/nginx-1.9.5# make
    ~/nginx-1.9.5# make install

The ModSecurity configuration file must be defined in the `nginx.conf` file, something like this:

    server {
       listen       80;
       server_name  localhost;

       location / {
          ModSecurityEnabled on;
          ModSecurityConfig modsecurity.conf;
       }

    }

For custom rules applied to different directories, create new mod_security.conf files, for example:

    location /secured {
       ModSecurityConfig modsecurity3.conf; 
       proxy_pass http://secured.core.com/;
       proxy_read_timeout 180s;
    }

To turn it off for a particular directory:

    location /unsecured/ {
       ModSecurityEnabled off;
       proxy_pass http://unsecured.core.com/;
       proxy_read_timeout 180s;
    }

Restart Nginx.

## Apache

[Compile and embed the ModSecurity module](https://www.netnea.com/cms/apache-tutorial-6_embedding-modsecurity/) or install from repository:

    # apt-get install libapache2-modsecurity

Check it was loaded:

    # apachectl -M | grep --color security

Rename the recommended-labeled configuration file:

    # mv /etc/modsecurity/modsecurity.conf-recommended /etc/modsecurity/modsecurity.conf

Restart Apache. 

## Usage

A new logfile named `/var/log/apache2/modsec_audit.log` has been created. Check that the default configuration file is not set to `DetectionOnly`, which logs requests according to rule matches and doesn't block anything. Edit the `/etc/modsecurity/modsecurity.conf` file to change it if need be (set it to `On`). Some possible changes:

    # Prevent path traversal (..) attacks
    SecFilter "../"

    # Weaker XSS protection but allows common HTML tags
    SecFilter "<[[:space:]]*script"

    # Prevent XSS atacks (HTML/Javascript injection)
    SecFilter "<(.|n)+>"

    # Very crude filters to prevent SQL injection attacks

    SecFilter "delete[[:space:]]+from"
    SecFilter "insert[[:space:]]+into"
    SecFilter "select.+from"
    SecFilter "drop[[:space:]]table"

    # Protecting from XSS attacks through the PHP session cookie
    SecFilterSelective ARG_PHPSESSID "!^[0-9a-z]*$"
    SecFilterSelective COOKIE_PHPSESSID "!^[0-9a-z]*$"

Restart Apache. 

## Configuration resources

Have a look at the [OWASP ModSecurity Core Rule Set Project](https://www.owasp.org/index.php/Category:OWASP_ModSecurity_Core_Rule_Set_Project) (CRS) for making more secure changes. The CRS aims to protect web applications from a wide range of attacks, with a minimum of false alerts.
