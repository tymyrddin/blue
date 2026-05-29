# HTTP security control gaps

HTTP security controls interact: a gap in one can open an exploitable path through another. The scenarios below describe what becomes possible when a control is absent or misconfigured, and which control closes each gap.

## CSP with unsafe-inline

`unsafe-inline` in `script-src` allows any inline script on the page to execute. A reflected or stored XSS payload runs directly in the page context, regardless of whatever else the policy restricts. The header is present and appears in a security scan as configured; the protection against script injection is not there. The rest of the CSP policy, however tight, is irrelevant for inline execution.

Removing `unsafe-inline` and moving scripts to external files, or using CSP nonces, closes this.

## CSP allows self, X-Content-Type-Options absent, file uploads permitted

CSP restricts scripts to `'self'`, trusting same-origin content. The application allows file uploads. A user uploads a file containing JavaScript; the server stores and serves it with `Content-Type: text/plain`. Without `X-Content-Type-Options: nosniff`, the browser sniffs the content, determines it looks like script, and executes it. The file came from the same origin; CSP's `'self'` allowance covers it. Two controls that individually seem unrelated close together to create a bypass.

`X-Content-Type-Options: nosniff` closes the sniffing path; the content type the server declares becomes the content type the browser uses.

## HSTS with short max-age

The HSTS header is present. `max-age` is set to a small value (60 seconds, or a few minutes), typically left over from testing. Between sessions, or on a fresh visit after the policy has expired, the browser makes an initial HTTP request before being redirected. A network attacker intercepting that request can serve a page that strips the HTTPS upgrade entirely, and the short-lived policy offers no protection for the next connection.

Setting `max-age` to at least 31536000 (one year) closes this; the browser caches the policy long enough to cover realistic session gaps.

## Session cookie without HttpOnly

XSS fires, whether through a CSP misconfiguration, an unpatched injection point, or an allowed inline script. `document.cookie` is readable from JavaScript. The injected script sends the session token to an attacker-controlled endpoint. The user's session is hijacked without any visible indication. The cookie was transmitted over HTTPS and marked Secure; neither attribute protects it once script can read it.

`HttpOnly` on session cookies prevents JavaScript from reading them regardless of what executes on the page.

## Session cookie without SameSite

A form on a page the attacker controls submits a POST request to a sensitive endpoint on the target application. The victim's browser includes the session cookie with the cross-site request because `SameSite` is not set. The server receives an authenticated request the user did not knowingly initiate: a fund transfer, a password change, an account deletion. The session is valid; the server cannot distinguish this request from a legitimate one.

`SameSite=Strict` or `SameSite=Lax` on session cookies stops the browser from including them in cross-site requests.

## CORS reflecting the request origin without validation

The server reads the `Origin` header from the incoming request and echoes it directly into `Access-Control-Allow-Origin`, combined with `Access-Control-Allow-Credentials: true`. A page on an attacker-controlled domain makes a credentialed fetch to the API; the server reflects the attacker's origin back and permits the response. The attacker's script reads the full response body, including whatever data the authenticated user has access to. A wildcard `*` would have caused the browser to refuse the credentialed request; reflecting the origin achieves the same access without triggering that restriction.

An explicit allowlist of trusted origins, checked server-side before the header is set, closes this.

## X-Frame-Options absent, no CSP frame-ancestors

The page loads inside an iframe on any domain. An attacker hosts a page that embeds the target application transparently, overlaid on a fake interface that looks plausible. The victim sees a button that appears to be on a safe page; the click lands on a button inside the invisible iframe, confirming a transfer, granting a permission, or deleting an account. No credentials are stolen; the victim's own authenticated session performs the action.

`X-Frame-Options: DENY` or `SAMEORIGIN`, mirrored in CSP `frame-ancestors` for full modern browser coverage, closes this.

## TLS 1.2 without forward secrecy

RSA key exchange is configured alongside ECDHE ciphers. A recording attacker captures encrypted sessions over a period of months. The server's long-term private key is later obtained, through a breach, a certificate reissuance attack, or legal compulsion. Every recorded session can be decrypted retroactively. Forward secrecy is not a property of TLS itself; it depends on which cipher suites are active.

Disabling RSA key exchange and requiring ECDHE or DHE ciphers means each session uses an ephemeral key that is never stored. TLS 1.3 provides this automatically; TLS 1.2 requires explicit cipher suite configuration.
