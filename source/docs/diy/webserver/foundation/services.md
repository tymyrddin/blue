# Disable unwanted services

The biggest threat to server security is the code that is written for the server to execute. Two sources of these problems are Common Gateway Interface (CGI) programs and Server Side Includes (SSI). Intruders exploit poor code by forcing buffer overflows or by passing shell commands through the program to the system. Server Side Includes are processed by the server before they are sent to the client. These files can include other files or execute code from script files. If user input is used to dynamically modify the SSI file, it is vulnerable to the same type of attacks as CGI scripts.

Administrators have two options:

* Disable Server Side Includes (SSI) and CGI execution completely.
* Review all programs included in the cgi-bin directory, don't allow `ExecCGI` in any other directory unless you're positive no one can place a script there that have not been reviewed, write programs that do not allow free-form user input, use drop-down menus instead of keyboard input and never trust user input.

## Apache 

Disallowing can be done by defining a `Directory` tag in the configuration file:

```
<Directory "/directory">
    Options -Includes -ExecCGI -FollowSymLinks
</Directory>
```

The most secure way to operate a server is to disallow all SSI processing. This is the default unless `All` or`Includes` is specified by an `Options` directive. A compromise setting is to allow SSI, but to disallow the `#include` and `#exec` commands, which are the greatest security threat. Use `IncludesNOEXEC` on the `Options` directive for this setting.

## Nginx

Nginx and OpenBSD httpd authors decided not to include CGI interpretation but instead use FastCGI. 
