# Install and use ModSecurity

ModSecurity (`mod_security`) is an open-source web application firewall engine, originally developed for Apache and available for Nginx via a connector module.

ModSecurity works as a supplemental firewall for the web server, allowing real-time traffic monitoring and blocking of requests that match configured rules.

## Nginx

Install the ModSecurity v3 library and the Nginx connector:

    # apt-get install libmodsecurity3 libnginx-mod-security2

The connector module is loaded automatically on Debian/Ubuntu. If it is not, add to the top of `/etc/nginx/nginx.conf`:

    load_module modules/ngx_http_modsecurity_module.so;

Copy and activate the default configuration:

    # mkdir -p /etc/nginx/modsec
    # cp /etc/modsecurity/modsecurity.conf-recommended /etc/nginx/modsec/modsecurity.conf
    # sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/nginx/modsec/modsecurity.conf

Create `/etc/nginx/modsec/main.conf` to include the rules:

    Include /etc/nginx/modsec/modsecurity.conf

Enable ModSecurity in the server block:

    server {
       listen       80;
       server_name  localhost;

       modsecurity on;
       modsecurity_rules_file /etc/nginx/modsec/main.conf;

       location / {
          ...
       }
    }

For custom rules applied to a specific location:

    location /secured {
       modsecurity on;
       modsecurity_rules_file /etc/nginx/modsec/secured.conf;
       proxy_pass http://secured.core.com/;
       proxy_read_timeout 180s;
    }

To disable ModSecurity for a particular path:

    location /unsecured/ {
       modsecurity off;
       proxy_pass http://unsecured.core.com/;
       proxy_read_timeout 180s;
    }

Restart Nginx.

## Apache

Install from the repository:

    # apt-get install libapache2-mod-security2

Check that the module loaded:

    # apachectl -M | grep --color security

Rename the recommended configuration file:

    # mv /etc/modsecurity/modsecurity.conf-recommended /etc/modsecurity/modsecurity.conf

Restart Apache.

## Usage

A log file at `/var/log/apache2/modsec_audit.log` is created on Apache; on Nginx, ModSecurity logs through the Nginx error log. Check that `SecRuleEngine` is set to `On` in `modsecurity.conf` rather than `DetectionOnly`.

The `SecFilter` and `SecFilterSelective` directives were removed in ModSecurity v2 and do not exist in current versions. The equivalent is `SecRule`. Some illustrative examples:

    # Prevent path traversal attacks
    SecRule REQUEST_URI "@contains ../" "id:1001,phase:1,deny,log,msg:'Path traversal attempt'"

    # Block script injection
    SecRule ARGS "@rx <[[:space:]]*script" "id:1002,phase:2,deny,log,msg:'XSS attempt'"

    # Block basic SQL injection patterns
    SecRule ARGS "@rx (?i:delete[[:space:]]+from|insert[[:space:]]+into|select.+from|drop[[:space:]]table)" \
        "id:1003,phase:2,deny,log,msg:'SQL injection attempt'"

    # Validate PHP session cookie format
    SecRule ARGS:PHPSESSID "!@rx ^[0-9a-z]*$" "id:1004,phase:2,deny,log,msg:'Invalid PHPSESSID'"
    SecRule REQUEST_COOKIES:PHPSESSID "!@rx ^[0-9a-z]*$" "id:1005,phase:2,deny,log,msg:'Invalid PHPSESSID cookie'"

Restart Apache or Nginx.

## Configuration resources

The [OWASP ModSecurity Core Rule Set](https://coreruleset.org/) (CRS) provides a comprehensive, maintained set of generic attack detection rules. Using the CRS is preferable to maintaining hand-written rules for common attack classes.
