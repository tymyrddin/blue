# Web application firewall with ModSecurity

Hardening runbook. Installs ModSecurity, a web application firewall engine, in front of Apache or Nginx, then runs it with the OWASP Core Rule Set to filter malicious request content (injection, traversal, common attack patterns) before it reaches the application.

## When to run

On a public-facing web application that cannot be quickly patched against common attack classes, or as a defence-in-depth layer during setup. After a [log review](../reading-logs.md) shows injection or traversal attempts in the access log.

## Approach

Run in detection-only mode first, then switch to blocking once the rules are confirmed not to break legitimate traffic. Starting in blocking mode on a live site risks rejecting real requests that happen to match a rule. The Core Rule Set, not hand-written rules, is the maintained source of detection logic.

## Nginx

Install the engine and connector:

```
sudo apt-get install libmodsecurity3 libnginx-mod-security2
```

If the connector does not load automatically, add to the top of `/etc/nginx/nginx.conf`:

```
load_module modules/ngx_http_modsecurity_module.so;
```

Set up the configuration, starting in detection-only:

```
sudo mkdir -p /etc/nginx/modsec
sudo cp /etc/modsecurity/modsecurity.conf-recommended /etc/nginx/modsec/modsecurity.conf
echo "Include /etc/nginx/modsec/modsecurity.conf" | sudo tee /etc/nginx/modsec/main.conf
```

Enable it in the server block:

```
server {
    modsecurity on;
    modsecurity_rules_file /etc/nginx/modsec/main.conf;
    location / { ... }
}
```

## Apache

```
sudo apt-get install libapache2-mod-security2
apachectl -M | grep security        # confirm the module loaded
sudo mv /etc/modsecurity/modsecurity.conf-recommended /etc/modsecurity/modsecurity.conf
```

## Detection first, then blocking

The recommended config starts with `SecRuleEngine DetectionOnly`: it logs what it would block without blocking. Run in this mode long enough to confirm legitimate traffic is not matching rules, checking the audit log (`/var/log/apache2/modsec_audit.log` on Apache; the Nginx error log on Nginx). Once clean, switch to blocking:

```
sudo sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/nginx/modsec/modsecurity.conf
```

### Risk

A switch to `SecRuleEngine On` before reviewing detection-mode logs can block legitimate users whose requests happen to match a rule. The detection period is the safeguard; do not skip it on a live site.

## Rules

Use the [OWASP Core Rule Set](https://coreruleset.org/) rather than hand-written rules for common attack classes; it is comprehensive and maintained. Hand-written `SecRule` directives are for application-specific cases the CRS does not cover. Note that the old `SecFilter` / `SecFilterSelective` directives were removed; current rules use `SecRule`.

## Verify

Reload, then confirm the engine is active and a known-bad request is handled:

```
sudo nginx -t && sudo systemctl reload nginx          # or apachectl configtest && reload apache2
curl -s "https://example.com/?test=../../etc/passwd"  # a traversal pattern
```

In blocking mode this returns a 403; in detection mode it succeeds but logs a rule match. Confirm normal pages still load for legitimate requests.

## Done

ModSecurity loaded with the Core Rule Set. Detection-mode logs reviewed and clean. Engine switched to `On`. A test attack pattern is blocked; legitimate traffic is not.

## Rollback

Set `SecRuleEngine DetectionOnly` (stops blocking, keeps logging) or `Off`, and reload. For Apache, `sudo a2dismod security2 && sudo systemctl reload apache2` removes it entirely. Detection-only is the safer fallback when false positives appear: it keeps visibility while stopping the blocking.

## Follow-up

- A WAF filters request content; [ModEvasive](mod_evasive.md) handles request rate. They cover different attacks.
- Review the audit log periodically; rule matches indicate what is being attempted against the site.
