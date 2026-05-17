# Authentication

## Password hashing

Passwords are not stored. A hash derived from the password is stored, and on login the
same derivation is applied to the input and compared to the stored value. The [authentication vulnerability perspective](https://red.tymyrddin.dev/docs/in/app/techniques/auth.html) covers the attack patterns this page defends against.

The hash function is the critical choice. MD5, SHA-1, and SHA-256 are not password hashing functions:
they are fast, and fast hashing makes brute-force feasible. A password hashing function
is deliberately slow and includes a per-user salt to prevent rainbow table attacks.

Argon2id is the current recommendation (winner of the Password Hashing Competition, 2015;
endorsed by NIST SP 800-63B). Bcrypt is an acceptable fallback:

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()

# on registration
hashed = ph.hash(plain_password)

# on login
try:
    ph.verify(hashed, plain_password)
    if ph.check_needs_rehash(hashed):
        hashed = ph.hash(plain_password)
        # persist the updated hash
except VerifyMismatchError:
    raise AuthenticationError("invalid credentials")
```

`check_needs_rehash()` detects whether the stored hash was created with weaker parameters
and re-hashes on successful login, upgrading old hashes transparently.

The `argon2-cffi` library installs with `pip install argon2-cffi`.

## Session management

Server-side sessions are simpler than token-based approaches and easier to revoke.
The session ID is a random opaque value; the session data lives on the server. Django's
built-in session framework and Flask-Session both follow this model.

JWT tokens are signed bearer tokens, not sessions. They are appropriate for stateless API
authentication between services, or for short-lived single-use tokens (email verification,
password reset). Using JWTs as long-lived session tokens without a revocation mechanism
means a stolen token is valid until expiry with no way to invalidate it server-side. The [JWT attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/jwt.html) page covers the most common ways JWT implementations are exploited.

If JWTs are used, keep the expiry short (15–60 minutes), use refresh tokens via a
server-side store, and sign with RS256 (asymmetric) rather than HS256 (shared secret that
requires a shared secret consistent across all services).

## Credential exposure

Cookie flags prevent credential theft through common vectors:

```python
# Flask example
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,   # not accessible from JavaScript
    SESSION_COOKIE_SECURE=True,     # transmitted only over HTTPS
    SESSION_COOKIE_SAMESITE="Lax",  # limits cross-site sending
)
```

`HttpOnly` prevents a successful [XSS](xss.md) attack from extracting the session cookie via
`document.cookie`. `Secure` prevents transmission over plain HTTP. `SameSite=Lax` provides
CSRF protection for most cases without breaking normal navigation.

## Rate limiting

Authentication endpoints are targets for credential stuffing. Rate limiting by IP address
and by account slows automated attacks:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(get_remote_address, app=app)  # Flask-Limiter 3.x: key_func is first arg

@app.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    ...
```

Rate limiting by account (not just IP) catches distributed attacks that use many source
addresses.

## MFA

TOTP (Time-based One-Time Password) is the most widely supported second factor. The
`pyotp` library handles the generation and verification:

```python
import pyotp

# generate a secret for a new user
secret = pyotp.random_base32()

# generate the OTP URI for QR code display
uri = pyotp.totp.TOTP(secret).provisioning_uri(
    name=user.email,
    issuer_name="MyApp"
)

# verify a code supplied by the user
totp = pyotp.TOTP(secret)
if not totp.verify(user_supplied_code):
    raise AuthenticationError("invalid code")
```

FIDO2/passkeys (WebAuthn) are the stronger option and are now supported in all major
browsers and platforms. They bind the credential to the specific origin and are phishing-resistant
in a way that TOTP is not.
