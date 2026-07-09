# Gaps in web security controls

A control that passes a compliance check is not necessarily a control that prevents an attack. For example, three
web security mechanisms are frequently deployed in forms that satisfy the letter of a security
requirement without providing the stated protection.

## Content Security Policy and unsafe-inline

A Content Security Policy header restricts which scripts a page can execute. When enforced, it
prevents injected JavaScript from running even if an XSS vulnerability exists. The mechanism works.

Two deployment patterns defeat it.

The first is `unsafe-inline`. Many frameworks and third-party analytics scripts require inline event
handlers or script blocks. When adding CSP breaks these, the path of least resistance is adding
`unsafe-inline` to the `script-src` directive. This re-permits inline script execution, which is what
CSP was deployed to prevent. A policy with `unsafe-inline` in `script-src` offers little protection
against injected scripts.

The second is report-only mode. `Content-Security-Policy-Report-Only` sends violation reports without
enforcing the policy. It is the correct starting point for understanding what a policy will break.
In practice, the reports are numerous, the collection endpoint goes unmonitored, and report-only mode
becomes the permanent deployment. The policy header is present; the protection is not.

What holds: CSP with `strict-dynamic` plus a per-request nonce. Each page load generates a new nonce
value included in the CSP header and in any script elements that are legitimately needed. A third-party
payload or injected script does not have the current nonce. `strict-dynamic` additionally permits scripts
loaded by trusted scripts to run without each being explicitly allowlisted, which resolves most framework
compatibility issues without falling back to `unsafe-inline`.

Deployed via HTTP response header from the server. A meta tag CSP does not cover scripts inserted by
the HTML parser before the tag is read.

```bash
# check deployed CSP for common bypass patterns
curl -s -I https://example.com | grep -i content-security-policy
# flags: unsafe-inline, unsafe-eval, a wildcard (*) source, or Report-Only
# absence of the header is also a finding
```

## CSRF token patterns and their gaps

CSRF protection binds a state-changing request to the authenticated session using a token the attacker
cannot obtain from a cross-origin context. The token works if it is unpredictable, bound to the session,
and validated server-side on every state-changing request.

Two common implementation patterns fail one or more of these conditions.

Session-fixed tokens: the token is generated once per session and reused for the lifetime of that
session. It is valid but static. An attacker who can observe a single request (for example, through a
compressed HTTPS channel) may recover it through BREACH-style compression oracle attacks. The correct
form is a per-request token: a new value generated on each form render, consumed on submission, and
invalidated after use.

Double-submit cookies where the cookie is JavaScript-accessible: the double-submit pattern sends the
CSRF value in both a cookie and a request parameter, and validates that they match. It works when the
cookie is HttpOnly (inaccessible to JavaScript) and the same-site cookie attribute limits cross-origin
reads. If the cookie is readable via `document.cookie`, an attacker with XSS can construct a valid CSRF
pair, and the CSRF protection depends entirely on having no XSS.

Automated scanners typically verify that a CSRF token field is present, not that the token changes
between requests or that the server rejects a replayed value. Manual verification is more reliable:

```python
import requests

def extract_csrf_token(html):
    # parse token from form field or meta tag
    ...

session = requests.Session()
r1 = session.get('https://example.com/form')
token1 = extract_csrf_token(r1.text)

r2 = session.get('https://example.com/form')
token2 = extract_csrf_token(r2.text)

# a per-request token changes on every load
print('Tokens differ between requests:', token1 != token2)
```

`SameSite=Strict` on the session cookie provides CSRF protection directly for modern browsers,
making the CSRF token partially redundant for the majority of users. Legacy browsers and some mobile
WebViews do not enforce SameSite. Both controls together cover the full range.

## Input validation by denylist

Denylist validation removes or escapes designated "dangerous" characters or patterns at the point of
input. The appeal is centralisation: one filter applied before input reaches any processing function.
The limitation is that "dangerous" is context-dependent, and the input context is not the output context.

A string that is harmless in one output context is dangerous in another. `<script>` stripped at input
becomes inert text; the same string URL-encoded as `%3Cscript%3E` passes the strip, and if it is
URL-decoded before HTML rendering downstream, the payload is intact. Context-specific encoding at
output is what provides protection; denylist filtering at input does not substitute for it.

Common variations that denylist approaches miss:

SQL via type coercion: a numeric parameter validated as "contains no SQL keywords" but accepted as a
string can still be injected if the database query concatenates it without parameterisation.

JavaScript via event attributes: filtering `<script>` while permitting `<img>` tags with `onerror`
attributes leaves a usable XSS vector. Blocking specific tags does not block all executable HTML contexts.

Redirect injection via protocol-relative URLs: filtering absolute URLs while permitting relative ones
allows `//attacker.example/path` as a redirect target, which browsers treat as a fully external
destination.

What holds: output encoding applied at the point of rendering, matched to the specific output context,
ORM parameterisation for database queries, and auto-escaping template engines for HTML. Redirect
targets validated against an explicit allowlist of permitted destinations. Input validation as a
defence-in-depth measure, not as the primary injection control.
Last updated: 26 May 2026
