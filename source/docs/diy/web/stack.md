# The webserver security stack

Webserver security controls divide into three layers: transport security, which protects the channel between client and
server; content and injection defences, which limit what the browser will execute; and cross-site controls, which
restrict what other origins can read or forge. The layers are not independent. Several of the controls only close gaps
that other controls leave open.

## Transport security

### TLS

TLS encrypts traffic between the browser and the server. Versions older than 1.2 carry
well-documented weaknesses and are worth disabling; TLS 1.3 is preferred where the deployment allows it, partly because
it does not require manually curating cipher suites.

TLS secures the channel but says nothing about whether the browser uses it. A user who types `http://` or follows an
HTTP link gets an unencrypted first request, which a network attacker can intercept and manipulate before any TLS
negotiation begins.

### HSTS

[HSTS](runbooks/hsts.md) closes the HTTP fallback gap. Once a browser has seen the `Strict-Transport-Security` header over
HTTPS, it refuses HTTP connections to that domain for the duration of `max-age`, regardless of what the user types or
clicks.

Two gaps remain. The first visit is still vulnerable: HSTS only applies after the browser has received the header at
least once, so a first-time visitor on a compromised network can be intercepted before the policy lands. HSTS preloading
addresses this by including a domain in browser preload lists before any visit occurs, but preloading is not easily
reversed once submitted.

The second gap is operational: a long `max-age` combined with `includeSubDomains` makes it difficult to move any
subdomain off HTTPS later. The policy is easy to set and slow to unwind.

## Content and injection defences

### CSP

[CSP](runbooks/csp.md) defines which sources the browser is permitted to load and execute for a given page: scripts, styles,
images, frames, and more. Its primary target is cross-site scripting (XSS): by restricting `script-src` to known origins
and excluding `unsafe-inline`, injected scripts from an attacker have nowhere to run.

CSP is powerful and easy to misconfigure. A policy that includes `unsafe-inline` or `unsafe-eval` in `script-src`
largely nullifies XSS protection for those vectors. And CSP does not prevent the injection itself; it limits execution.
Injected content that falls within allowed sources, or that exploits a trusted CDN, can still cause damage.

### X-Content-Type-Options

`X-Content-Type-Options: nosniff` prevents browsers from guessing a resource's MIME type when the
server has declared one. Without it, a browser may execute a file served as `text/plain` as JavaScript if the content
looks like script.

This bears on CSP specifically. A CSP that allows `'self'` for scripts trusts content from the same origin. If the
application allows file uploads and the server serves them without strict MIME types, an attacker can upload JavaScript
and the browser may execute it despite the `text/plain` declaration. `nosniff` closes that path.

### X-Frame-Options and CSP frame-ancestors

[X-Frame-Options](runbooks/xframe.md) controls whether the page can be embedded in an iframe, protecting against
clickjacking: an attack that overlays the legitimate page with a transparent iframe to trick users into clicking
elements they cannot see.

`X-Frame-Options` is the legacy mechanism, supporting only `DENY` and `SAMEORIGIN`. The CSP `frame-ancestors` directive
is the modern replacement and allows per-origin allow-listing. Setting both provides redundancy for older browsers that
do not parse CSP, but `frame-ancestors`, where supported, takes precedence.

## Cross-site controls

### Cookie flags

Three attributes on the [`Set-Cookie`](runbooks/cookie.md) header cover distinct attack vectors.

`Secure` ensures the cookie is not transmitted over plain HTTP. It complements HSTS at the cookie level: even if a
request somehow goes out unencrypted, the session token does not travel with it.

`HttpOnly` makes the cookie inaccessible to JavaScript. If XSS fires despite CSP, the attacker cannot read session
cookies via `document.cookie`. The session remains intact even when script execution occurs.

`SameSite=Strict` (or `Lax`) restricts cross-site cookie transmission. Cross-site requests from another origin do not
carry the cookie, which is the mechanism cross-site request forgery (CSRF) depends on.

The three flags address different attack stages: `Secure` protects in transit, `HttpOnly` limits what XSS can extract,
`SameSite` prevents cross-site forgery. None of them overlaps.

### CORS

[CORS](runbooks/cors.md) is the browser's enforcement mechanism for cross-origin requests. A strict CORS policy
limits which origins can read responses from the server, preventing a malicious page on another domain from silently
extracting data using a logged-in user's credentials.

Two gaps are worth noting. CORS is browser-enforced: a direct server-to-server request from an attacker bypasses it
entirely, making CORS irrelevant for server-side credential theft or API abuse. And a permissive CORS policy,
particularly one that dynamically reflects the request origin without validation, is exploitable regardless of other
controls.

## Not addressed

Even with TLS 1.3, HSTS with preloading, a tight CSP, `nosniff`, frame controls, hardened cookie flags, and a strict
CORS policy in place, significant attack surface remains.

Server-side vulnerabilities (SQL injection, path traversal, SSRF, command injection) occur before any of these headers
are relevant. The headers control browser behaviour; they say nothing about what the server does with incoming data.

The TLS certificate trust model is outside this stack. A certificate authority that issues a fraudulent certificate for
a domain can undermine TLS regardless of configuration. Certificate Transparency logs provide some visibility; the
underlying CA ecosystem is not something a single server operator controls.

Application logic flaws, insecure direct object references, broken access control, and similar issues require controls
in the application layer. No combination of HTTP headers addresses them.

The stack closes the browser-level attack surface. What happens between the browser and the application, and inside the
application, is a different perimeter.
Last updated: 29 May 2026
