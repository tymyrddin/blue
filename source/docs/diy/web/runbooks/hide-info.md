# Hide web server information

Hardening runbook. Stops the web server from advertising its exact version and the host operating system in response headers and status pages. A version string tells a scanner precisely which known vulnerabilities to try.

## When to run

On a new web server during setup. On an existing server where `curl -I` shows a full version in the `Server` header, or where status and info pages are reachable.

## What it closes

This is an information leak. The version number lets an attacker skip the guesswork and go straight to the exploits matching that release. Removing it does not patch anything; it removes the signpost. It pairs with [disabling directory listing](directory-listing.md).

## Apache

In the Apache configuration (`apache2.conf` or `httpd.conf`):

Trim the `Server` header to the product name only, and drop the version footer on error pages:

```
ServerTokens Prod
ServerSignature Off
```

Disable the status and info pages, which expose configuration and live request data. Comment out the module or restrict the handler:

```
#LoadModule info_module modules/mod_info.so
```

```
#<Location /server-status>
#    SetHandler server-status
#    Require local
#</Location>
```

Reload:

```
sudo apachectl configtest && sudo systemctl reload apache2
```

## Nginx

Disable the version display, in the `http`, `server`, or `location` context:

```
server_tokens off;
```

This removes the version number from the `Server` header and from generated error pages. The header still reads `nginx`. Removing it entirely requires the third-party `Headers More` module compiled in, then `more_clear_headers Server;`, which is rarely worth the effort for a small setup.

Reload:

```
sudo nginx -t && sudo systemctl reload nginx
```

## Verify

```
curl -I https://example.com
```

The `Server` header should read `Apache` or `nginx` with no version number and no OS string. Confirm `/server-status` and `/server-info` (Apache) return 403 or 404.

## Done

`Server` header carries no version or OS detail. Apache status and info pages are not reachable. Config passes its syntax check and has been reloaded.

## Rollback

Restore `ServerTokens Full` / `ServerSignature On` (Apache) or `server_tokens on;` (Nginx) and reload. There is little operational reason to roll back; the version detail mainly aids attackers.

## Follow-up

- Confirm the change held with a [security header check](check.md).
- Pair with [disabling directory listing](directory-listing.md).
