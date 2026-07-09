# Reading web logs and configuration

A web server produces three kinds of evidence worth examining: access logs, which record every request; TLS and certificate state, which determines whether the channel is actually secure; and HTTP response headers, which determine what browsers enforce on the client side.

## Access logs

`/var/log/nginx/access.log` or `/var/log/apache2/access.log`. Each line is a request: source IP, timestamp, method, path, response code, bytes transferred, referrer, user agent.

A single IP hitting many different paths in a short window is a scanner. Tools like Nikto, dirb, and gobuster produce characteristic patterns: rapid sequential requests to paths like `/admin`, `/phpmyadmin`, `/wp-admin`, `/.env`, `/.git/config`, and similar. The scan does not itself constitute a breach, but a response code other than 404 on a path that has no business returning content indicates the server has something exposed.

`/.env` returning 200 is not a scan artefact. It is a credential leak. An `.env` file in the webroot responding with 200 has served its contents, including database passwords and API keys, to whoever asked.

A spike in 4xx responses without a corresponding traffic increase sometimes indicates a misconfiguration introduced recently, or a deployment that broke URL routing. A spike in 5xx responses indicates server errors; this can occasionally indicate exploitation attempts that triggered error conditions in the application.

Unusual user agent strings are a secondary signal. Scanners frequently use identifiable agents (`nikto/2.x`, `sqlmap`, bare `curl`). A high volume of requests from an empty or obviously fabricated user agent, correlated against what paths were hit, is worth examining.

## TLS and certificate state

`openssl s_client -connect hostname:443` shows what the server is actually serving.

`verify error:num=` indicates a problem. Common values: 10 (expired certificate), 18 (self-signed), 20 (issuer not in trusted chain). Any of these causes browser certificate warnings.

The `subject` line shows the Common Name and Subject Alternative Names the certificate covers. A wildcard (`*.example.com`) covers exactly one subdomain level; it does not cover the apex domain `example.com` or deeper subdomains like `sub.sub.example.com`.

`SSL-Session: Protocol:` shows the negotiated version. TLS 1.2 is acceptable; TLS 1.0 and 1.1 are not. The `Cipher:` line shows what was negotiated. Anything containing `RC4`, `DES`, `EXPORT`, `NULL`, or `anon` in the name indicates a weak or broken cipher.

## HTTP response headers

`curl -I https://hostname` returns response headers. Each absent security header corresponds to a browser enforcement gap.

`Strict-Transport-Security` absent means the browser does not upgrade HTTP connections to HTTPS automatically. A user following an HTTP link or typing the domain without `https://` makes an unencrypted first request that a network attacker on the same path can intercept and modify before any TLS negotiation begins.

`Content-Security-Policy` absent means the browser imposes no restriction on what scripts, styles, or frames the page loads. Without CSP, a successful XSS injection has nowhere it cannot run. Its presence is necessary but not sufficient: a policy containing `unsafe-inline` or `unsafe-eval` in `script-src` largely removes XSS protection for those vectors.

`X-Content-Type-Options: nosniff` absent means the browser may execute files served with an incorrect MIME type as scripts. This particularly affects applications that allow file uploads and serve them from the same origin.

`X-Frame-Options` absent means the page can be framed from any origin. This is the clickjacking surface: a transparent iframe over the legitimate page, positioned to trick users into clicking elements they cannot see.

The [webserver stack](stack.md) covers how these headers interact and where each one leaves gaps.

## Configuration red flags

In Nginx: `server_tokens on` (the default) means the `Server:` response header includes the exact version number, which tells a scanner exactly which CVEs to test against. `autoindex on` enables directory listing when no index file is present.

In Apache: `ServerTokens Full` or `ServerTokens OS` includes version and platform information. `Options Indexes` enables directory listing.

In PHP: `allow_url_fopen = On` and `allow_url_include = On` open paths to remote code inclusion attacks. Both are off by default in recent PHP versions; finding them enabled in a production configuration is worth investigating.
Last updated: 29 May 2026
