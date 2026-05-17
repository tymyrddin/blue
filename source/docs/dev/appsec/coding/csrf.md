# Cross-site request forgery

[CSRF](https://red.tymyrddin.dev/docs/in/app/techniques/csrf.html) exploits the browser's automatic inclusion of cookies
in every request to a site. A page on `attacker.com` posts a form to `bank.com`, and the victim's session cookie goes
along for the ride. The server sees a valid authenticated request; it has no way to distinguish it from one the user
initiated.

## SameSite cookies

The most effective general mitigation is the `SameSite` cookie attribute. It instructs browsers not to attach the cookie
to cross-site requests:

```text
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
```

`Strict` prevents the cookie from being sent on any cross-origin request, including navigations. `Lax` (the current
browser default) allows the cookie on top-level navigations (clicking a link) but not on form submissions or embedded
requests. `Lax` is sufficient for most CSRF protection; `Strict` breaks some legitimate workflows (e.g., users arriving
at a page via email link and expecting to be logged in).

## Synchroniser tokens

For environments where `SameSite` cannot be relied on (older browsers, APIs accessed by non-browser clients), a
per-session token added to every state-changing form provides a second layer:

```python
import secrets
from flask import session


def generate_csrf_token() -> str:
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_hex(32)
    return session["csrf_token"]


def validate_csrf_token(submitted_token: str) -> None:
    expected = session.get("csrf_token")
    if not expected or not secrets.compare_digest(expected, submitted_token):
        raise ValueError("CSRF token invalid")
```

`secrets.compare_digest()` avoids timing attacks; a simple `==` comparison on strings reveals timing information that
can be used to brute-force the token one character at a time.

The token appears as a hidden field in every form:

```html

<form method="POST" action="/settings/email">
    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
    ...
</form>
```

The server extracts the submitted token, compares it to the session value, and rejects the request if they do not match.

## Framework-provided CSRF protection

Django includes CSRF middleware that handles token generation and validation automatically. It is enabled by default;
disabling it (`@csrf_exempt`) is intentional and removes the protection entirely. Flask-WTF provides equivalent
protection for Flask applications via the `CSRFProtect` extension.

For JSON APIs where the client is a single-page application on the same origin, CSRF is substantially mitigated by
requiring a custom request header (`X-Requested-With`, `X-CSRFToken`). Custom headers cannot be set by cross-origin
forms, only by `XMLHttpRequest` or `fetch` calls from the same origin or an [explicitly allowed origin](cors.md).

## Controls that fall short

The `Referer` header is inconsistently present (some proxies strip it, some users configure their browsers to suppress
it) and can sometimes be manipulated. Checking only for `Referer` is insufficient as a sole protection.

Checking the request method (accepting only `POST`) does not prevent CSRF; a cross-origin form can submit a POST
request. It makes exploitation marginally harder but is not a control.

HTTPS alone does not prevent CSRF. The browser still attaches cookies to HTTPS requests from other origins.
