# Keep only required modules

Minimise the risk of potential attacks by limiting allowed operations. The more services and functions a web server is running, the more opportunities an attacker will have to exploit the network. There are 65,535 available ports each server could possibly service. The server probably does not need all of them open and receptive. 

Disable and turn off any unnecessary modules, services, ports or functions. 

## Nginx

Default, Nginx includes many modules, and it is not possible to choose modules at runtime. To disable modules, Nginx needs to be recompiled and the configure option during installation to disable modules that are not required. For example, to disable the `autoindex` module, which generates automatic directory listings:

    # ./configure --without-http_autoindex_module
    # make
    # make install

## Apache

Default installation may include many pre-installed and enabled modules that are not needed. The [Apache module documentation](https://httpd.apache.org/docs/2.4/mod/) lists and explains all the modules available for Apache. Research the enabled modules to make sure that they are really required for the functionality of the website. Unnecessary modules can be disabled by commenting out a specific `LoadModule` line.
