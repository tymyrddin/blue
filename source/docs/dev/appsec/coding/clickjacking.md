# Clickjacking

[Clickjacking](https://red.tymyrddin.dev/docs/in/app/techniques/clickjacking.html) works by framing a target page inside a transparent or invisible iframe on an attacker-controlled page. The victim sees the attacker's page but interacts with the framed application underneath. State-changing actions that require only a click (like approvals, password changes, or settings toggles) are the primary targets; multi-step flows with text input are harder to exploit.

The defence is to prevent the application from being framed by pages other than those it explicitly allows.

## Content Security Policy: frame-ancestors

The `frame-ancestors` CSP directive is the current standard for preventing framing:

```text
Content-Security-Policy: frame-ancestors 'none'
```

`'none'` prevents the page from being framed by any origin, including the same origin. For applications that legitimately embed their own pages in iframes:

```text
Content-Security-Policy: frame-ancestors 'self'
```

When a specific external partner needs to embed the application:

```text
Content-Security-Policy: frame-ancestors 'self' https://partner.example.com
```

`frame-ancestors` takes precedence over `X-Frame-Options` in browsers that support CSP. For browsers that do not, `X-Frame-Options` provides equivalent protection.

## X-Frame-Options

`X-Frame-Options` is an older header with equivalent semantics for framing:

```text
X-Frame-Options: DENY
```

`DENY` prevents any framing. `SAMEORIGIN` allows framing by pages on the same origin. The header lacks `ALLOW-FROM` support in most modern browsers (it was never consistently implemented), so for selective allowlisting of external origins, CSP `frame-ancestors` is the only reliable option.

Setting both headers covers older browsers:

```python
# Flask example
@app.after_request
def set_frame_options(response):
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "frame-ancestors 'none'"
    return response
```

## SameSite cookies

`SameSite=Strict` or `SameSite=Lax` cookies mean that even if a page is successfully framed, the session cookie is not included in the cross-site request. This limits the damage when framing restrictions are absent: the attacker can load the page in an iframe, but the victim's authenticated session is not active inside it.

[SameSite cookies](csrf.md) complement `frame-ancestors` but do not substitute for it. The combination addresses both the framing vector and the session attachment vector.

## Frame-busting scripts

Frame-busting scripts (JavaScript that detects when the page is inside an iframe and redirects to the top window) are unreliable. Techniques to bypass them include loading the iframe with the `sandbox` attribute (which can disable JavaScript in the iframe) and variations of the double-iframe trick. Frame-busting scripts have been superseded by `X-Frame-Options` and CSP.
Last updated: 17 May 2026
