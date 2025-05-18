# Set up and configure logging

Logging provides detailed information about client requests made on the web server, and will prove useful when investigating the cause of particular issues.

## Nginx

The nginx access and error logs are enabled by default and are located in `logs/error.log` and `logs/access.log` respectively. A `crit` severity level will cause nginx to log critical issues and all issues that have a higher severity level than `crit`. To set the severity level to `crit`, use the [error_log directive](https://nginx.org/en/docs/ngx_core_module.html#error_log):

    error_log logs/error.log crit;

The level of logging can be, in order of increasing severity, `debug`, `info`, `notice`, `warn`, `error`, `crit`, `alert`, or `emerg`. 

Monitoring and managing nginx log files makes it easier to understand requests made to the web server and notice errors. This will aid in discovering any attack attempts and identifying what can be done to optimise server performance.

Log management tools, such as logrotate, can be used to rotate and compress old logs and free up disk space. The `ngx_http_stub_status_module` module provides access to basic status information.

## Apache

To enable logging on Apache, the [mod_log_config](https://httpd.apache.org/docs/current/mod/mod_log_config.html) module needs to be included from the Apache `httpd.conf` file. This module provides the `TransferLog`, `LogFormat`, and `CustomLog` directives which are respectively used to create a log file, specify a custom format, and creating and formatting a log file, all in one go.

For example, to log the referrer and browser of each request along with the default logging parameters and use the `CustomLog` directive to instruct Apache to use this logging format:

    LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" detailed
    CustomLog logs/access.log detailed
