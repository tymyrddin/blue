# Disable directory listing

Hardening runbook. Stops the web server from displaying the contents of a directory when no index file is present. An exposed listing hands an attacker a map of files and subdirectories they were never meant to see.

## When to run

On a new web server during setup. On an existing server where a [public exposure review](../../incidents/runbooks/exposure-review.md) or a directory request returned a file listing rather than a 404 or the intended page.

## What it is and is not

Directory listing is an information leak, not a direct compromise: it reveals file and directory names, which can point an attacker at backups, config files, or old versions. Closing it removes that aid to anyone mapping the server. It pairs with [hiding server version information](hide-info.md), which closes a related leak.

## Apache

Disable listing globally in `/etc/apache2/apache2.conf`:

```
<Directory />
    Options -Indexes
</Directory>
```

A typical root directory block then reads:

```
<Directory />
    Options FollowSymLinks
    AllowOverride None
</Directory>
```

`AllowOverride None` prevents a stray `.htaccess` re-enabling listing. Where one specific directory genuinely needs a listing, re-enable it there alone by adding `Indexes` to that directory's block.

Reload after the change:

```
sudo apachectl configtest && sudo systemctl reload apache2
```

## Nginx

Nginx does not list directories by default; `autoindex` has to be explicitly turned on. The hardening task is to confirm it is off. Search the config for any `autoindex on;` and set it to `off` or remove it:

```
grep -rn "autoindex" /etc/nginx/
```

Reload:

```
sudo nginx -t && sudo systemctl reload nginx
```

## Verify

Request a directory that has no index file, from a browser or:

```
curl -s https://example.com/somedir/ | head
```

The response should be a 403 or 404, not a list of files. Check a directory known to lack an index page, since one with `index.html` present will not reveal the setting either way.

## Done

Requests to index-less directories return 403 or 404, not a file listing. The web server config passes its syntax check and has been reloaded.

## Rollback

Re-add `Indexes` (Apache) or set `autoindex on;` (Nginx) for the specific directory and reload. Listing is rarely wanted on a production site; scope any exception to the single directory that needs it.

## Follow-up

- Pair with [hiding server information](hide-info.md) to close both information leaks together.
- Confirm via a [public exposure review](../../incidents/runbooks/exposure-review.md) that no directory still lists.
