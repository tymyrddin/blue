# Single sign-on security

SSO concentrates authentication into a single identity provider that multiple applications trust. A well-implemented identity provider is more carefully maintained than a dozen individual login systems. The risk is that misconfiguration in the SSO layer affects every application that depends on it, and the integration surface between each application and the identity provider introduces attack surface that each application team needs to handle correctly. The [SSO attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/sso.html) page covers OAuth, SAML, and the cross-account patterns.

## OAuth 2.0 and OpenID Connect

### Redirect URI validation

The authorisation code is delivered to the redirect URI registered by the application. The identity provider validates this URI before issuing the code. The validation is exact match against a list of registered URIs, not a prefix or substring check:

- Substring matching accepts `https://example.com.attacker.com` as a match for `example.com`
- Prefix matching accepts `https://example.com/../../../attacker.com` after path normalisation
- Wildcard subdomains (`*.example.com`) are exploitable if any subdomain is attacker-controlled

Each redirect URI is registered as a complete, literal value. Wildcards expand the attack surface; the convenience is rarely worth it.

### State parameter

The `state` parameter is CSRF protection for the OAuth flow. The client generates a cryptographically random value, includes it in the authorisation request, and validates it when the identity provider returns the user to the callback URL:

```python
import secrets
from flask import session, redirect, request, abort

@app.route("/auth/start")
def start_oauth():
    state = secrets.token_urlsafe(32)
    session["oauth_state"] = state
    return redirect(build_auth_url(state=state))

@app.route("/auth/callback")
def oauth_callback():
    returned_state = request.args.get("state", "")
    expected_state = session.pop("oauth_state", None)

    if not expected_state or not secrets.compare_digest(expected_state, returned_state):
        abort(400)

    # proceed to exchange code for tokens
```

A missing or unchecked state parameter allows an attacker to cause a victim to authenticate with the attacker's identity in the application (login CSRF).

### PKCE

PKCE (Proof Key for Code Exchange) is required for public clients (browser-based and mobile applications that cannot keep a client secret). It prevents authorisation code interception by binding the code exchange to the original authorisation request. Libraries that implement the OAuth flow typically handle PKCE; the check is that it is enabled and not bypassed.

### Token scope and storage

Requesting broader OAuth scope than the application needs means that a stolen token permits more than the application intended. Token scope is specified at the level of what each flow actually needs.

Access tokens stored in `localStorage` or `sessionStorage` are readable by JavaScript and exfiltrated by XSS. Tokens stored in `HttpOnly` cookies are not accessible to JavaScript. For browser-based applications, the backend-for-frontend pattern keeps tokens on the server and issues a session cookie to the browser.

## SAML

SAML assertions are XML documents signed by the identity provider. The service provider validates the signature before acting on the assertion's contents. The critical questions for any SAML integration:

- Is the signature validated on every authentication, or only on the first?
- Does the signature cover the entire assertion, or only part of it?
- Are assertions checked for a one-time use ID to prevent replay?
- Are the audience and recipient restrictions validated?

Signature wrapping attacks exploit XML parsers that validate the signature over one element but act on a different element. Libraries that handle SAML assertions correctly by default include `python-saml` (via `OneLogin_Saml2_Auth`) and `onelogin/ruby-saml`. Custom XML parsing of SAML assertions, especially using generic XML libraries, is a consistent source of signature bypass vulnerabilities.

## Tenant isolation

In multi-tenant SSO deployments, tokens issued for one tenant are not accepted by resources belonging to another. The OIDC `aud` (audience) claim identifies which application or tenant the token was issued for. A service provider that validates the signature but not the audience accepts tokens across tenant boundaries.

The audience is validated as part of token verification:

```python
import jwt

decoded = jwt.decode(
    token,
    public_key,
    algorithms=["RS256"],
    audience=["https://myapp.example.com"],  # validated, not optional
    issuer="https://idp.example.com",
)
```

A token whose `aud` does not include the expected application identifier is rejected regardless of signature validity.
