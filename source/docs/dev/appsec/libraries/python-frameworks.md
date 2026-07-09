# Python web framework security

Python web frameworks vary in how much security they provide by default. Django takes a batteries-included approach with many protections enabled out of the box; Flask provides a minimal core and relies on extensions for most security features; FastAPI and Pyramid sit between those poles in different ways.

## Django

Django's default project configuration enables several security middlewares:

- CSRF protection via `CsrfViewMiddleware`
- Clickjacking protection via `XFrameOptionsMiddleware`
- Template auto-escaping via Jinja2-compatible templates (values in `{{ }}` are HTML-escaped by default)
- ORM parameterisation prevents SQL injection in standard queries

Common Django-specific risks:

`DEBUG = True` in production exposes stack traces with local variable values and the full project structure. Django raises a runtime error if `DEBUG = True` and `ALLOWED_HOSTS` is not set to `['*']`; production environments with `ALLOWED_HOSTS` configured correctly can still expose stack traces via `DEBUG`.

`pickle` serialisation appears in Django's cache framework. When `django.core.cache.backends.memcached` or similar backends store session data using pickle, and an attacker can write to the cache, deserialization becomes a code execution vector. The database session backend avoids this.

`render_template_string()` and custom template loading from user-supplied strings bypass auto-escaping at the template level (the string is evaluated as a template, so injected template syntax executes before escaping).

## Flask

Flask's core is intentionally minimal. Auto-escaping is on by default for `.html`, `.htm`, `.xml`, and `.xhtml` templates via Jinja2; `.txt` templates are not escaped.

Flask provides no CSRF protection by default. `flask-wtf` and `flask-seasurf` both add CSRF token handling.

Common Flask-specific risks:

`app.secret_key` hardcoded in source code is a frequent pattern in tutorials that persists into production. The secret key is used to sign session cookies; anyone with the key can forge session cookies for any user.

`app.debug = True` activates Werkzeug's interactive debugger, which exposes a Python REPL in the browser. The debugger PIN is breakable.

`jsonify()` is safe for serialising Python dicts to JSON; the risk is serialising data structures that contain user-controlled keys without validation.

## FastAPI

FastAPI validates request bodies against Pydantic models by default, which provides type-checked, range-checked input validation at the API boundary. This is a meaningful security property: a handler that declares `user_id: int` receives an integer.

`fastapi.security` provides OAuth2 and JWT utilities. The JWT implementation delegates signature verification to the `python-jose` library; key management and algorithm selection (`RS256` over `HS256` for API-to-API tokens) are application-level choices.

OpenAPI documentation (`/docs`, `/redoc`) is enabled by default and exposes the full API schema. Disabling it in production is a simple configuration:

```python
app = FastAPI(docs_url=None, redoc_url=None)
```

## Pyramid

Pyramid's ACL-based permission system is more flexible than Django's group-based model and correspondingly more complex to configure correctly. Permission rules that are overly broad, or ACLs that fall through to a default `Allow`, can grant unintended access.

Pyramid uses Chameleon or Mako templates by default, which have different auto-escaping behaviour from Jinja2. Mako does not auto-escape by default; escaping is explicit.

## Framework comparison

| Framework | XSS default         | CSRF default       | Input validation    | Auth system        |
|-----------|---------------------|--------------------|---------------------|--------------------|
| Django    | Auto-escaping       | CsrfViewMiddleware | Forms/serialisers   | Built-in           |
| Flask     | Jinja2 auto-escape  | Extension required | Extension required  | Extension required |
| FastAPI   | Pydantic validation | Manual             | Pydantic (built-in) | OAuth2/JWT         |
| Pyramid   | Template-dependent  | Extension required | Colander/others     | ACL-based          |

## Common risks across frameworks

Static analysis with `bandit` identifies common patterns (hardcoded secrets, `eval()`, `subprocess.run(shell=True)`) in Python source:

```bash
bandit -r src/
```

Dependency scanning with `pip-audit` identifies known CVEs in installed packages:

```bash
pip-audit
```

WSGI servers (gunicorn, uWSGI) and ASGI servers (uvicorn) have their own configuration considerations: worker count, timeout settings, and whether the development server is exposed directly to the internet.
