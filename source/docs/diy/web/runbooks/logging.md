# Enable web server logging

Monitoring-enablement runbook. Confirms the web server records access and error logs in a usable format, so that requests can be investigated after the fact and attack attempts show up in something readable. Logging that is absent or too sparse means an incident leaves no trail.

## When to run

On a new web server during setup. On an existing server where the access log is missing fields needed to investigate (no user agent, no referrer), or where logging was never confirmed.

## Nginx

Access and error logs are on by default. On Debian/Ubuntu package installs they sit at `/var/log/nginx/access.log` and `/var/log/nginx/error.log`. The task is confirming the error log captures enough.

Set the error log level in the `http` or `server` context. Levels run, by increasing severity: `debug`, `info`, `notice`, `warn`, `error`, `crit`, `alert`, `emerg`. `warn` or `error` is a reasonable production level; `crit` records only the most severe:

```
error_log /var/log/nginx/error.log warn;
```

Reload:

```
sudo nginx -t && sudo systemctl reload nginx
```

## Apache

Logging needs `mod_log_config` (included by default on package installs). Define a format that captures referrer and user agent alongside the basics, and point a log at it in the site config:

```
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" detailed
CustomLog ${APACHE_LOG_DIR}/access.log detailed
```

The user agent and referrer are the fields that make an access log useful for spotting scanners and tracing where suspect traffic came from. Reload:

```
sudo apachectl configtest && sudo systemctl reload apache2
```

## Verify

Make a request to the site, then confirm it lands in the log with the expected fields:

```
curl -s https://example.com/ -A "test-agent" >/dev/null
tail -n 1 /var/log/nginx/access.log        # or the Apache access log
```

The new line should show the request, the response code, and (on the detailed Apache format) the `test-agent` user agent. Confirm the error log also receives entries by checking after a deliberate 404.

## Done

Access log records requests with response code, referrer, and user agent. Error log captures at the chosen level. A test request appears in the log with the expected fields. Config passes its syntax check.

## Follow-up

- Logs fill disks. Set up `logrotate` to rotate and compress old logs (it is configured by default for the packaged web servers, worth confirming).
- Logs on the server can be deleted by an attacker with access. Forward them to a [central destination](../../server/runbooks/centralised-logging.md) for anything worth protecting.
- For what to look for in the access log, see [reading web logs](../reading-logs.md).
Last updated: 29 May 2026
