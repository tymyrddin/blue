# Open redirects

An open redirect occurs when an application accepts a URL as user input and redirects the browser to that URL without
validating that it is an intended destination. The common form is a post-login redirect parameter:

```
https://example.com/login?next=https://attacker.com/phishing-page
```

The [open redirect attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/redirects.html) page covers how
attackers exploit this for phishing, OAuth token theft, and SSRF bypass. The mechanism is always the same: the
application's domain appears in the URL, lending it credibility, while the destination is controlled by the attacker.

## Avoid external redirect parameters

The safest path is to not accept external URLs as redirect targets at all. Post-login redirects within the application
can use path-only values:

```python
from urllib.parse import urlparse
from flask import url_for


def safe_redirect(next_path: str | None) -> str:
    """Return a safe redirect URL within the application."""
    if not next_path:
        return url_for("index")

    # reject anything with a scheme or host; path-only is fine
    parsed = urlparse(next_path)
    if parsed.scheme or parsed.netloc:
        return url_for("index")

    return next_path
```

A path like `/dashboard` passes the check; `https://attacker.com` does not.

## Allowlisting known destinations

When redirecting to external domains is a product requirement (OAuth callbacks, partner integrations), a server-side
allowlist is more reliable than any string-matching heuristic:

```python
ALLOWED_REDIRECT_HOSTS = {
    "app.example.com",
    "partner.example.org",
}


def validate_redirect_url(url: str) -> str:
    from urllib.parse import urlparse
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        raise ValueError("redirect URL scheme not permitted")
    if parsed.netloc not in ALLOWED_REDIRECT_HOSTS:
        raise ValueError(f"redirect host not permitted: {parsed.netloc}")

    return url
```

Allowlisting on the hostname closes most bypass routes. URL validation on string
content (checking whether the string starts with `https://example.com`) fails against payloads like
`https://example.com.attacker.com` or `https://example.com@attacker.com`.

## String-matching bypass patterns

URL validators that check whether the target starts with or contains the application's domain are consistently bypassed:

- `https://example.com.attacker.com` passes a startswith check on `example.com`
- `https://attacker.com/example.com` passes a contains check on `example.com`
- `https://example.com@attacker.com` uses the `@` syntax: `example.com` is a username, `attacker.com` is the host
- `https://attacker.com%2f@example.com` double-encodes the slash; the browser decodes it after validation

Parsing the URL and comparing the `netloc` component against an exact allowlist sidesteps these cases.

## Informing users of external redirects

For applications that redirect to external sites after user action, an interstitial page that shows the destination and
asks for confirmation reduces phishing risk. The interstitial is not a security control on its own (an attacker can
bypass it by crafting the redirect to skip the page), but it trains users to notice unexpected destinations.
