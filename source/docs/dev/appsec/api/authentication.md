# API authentication

[API authentication patterns introduce specific failure modes](https://red.tymyrddin.dev/docs/in/api/notes/authentication.html)
that differ from traditional web application authentication. Mechanisms including JWTs, API keys, and OAuth tokens are
all in common use, and each has characteristic ways of being misconfigured.

## JWT security

JWTs carry a header, a payload, and a signature. The header specifies the algorithm used to sign the token. Accepting
the algorithm from the header rather than enforcing it server-side is the root cause of two well-known attack classes.

The `alg: none` attack submits a token with no signature and an algorithm claim of `none`. Implementations that do not
enforce a specific algorithm will accept it. Algorithm confusion attacks substitute a symmetric algorithm (HS256) for
an asymmetric one (RS256), signing with the public key which the server already trusts for RS256 verification.

PyJWT addresses both by requiring the caller to specify the accepted algorithms explicitly:

```python
import jwt

ACCEPTED_ALGORITHMS = ["RS256"]

def verify_token(token: str, public_key: str) -> dict:
    return jwt.decode(
        token,
        public_key,
        algorithms=ACCEPTED_ALGORITHMS,
        options={"require": ["exp", "iat", "sub"]},
    )
```

`algorithms=ACCEPTED_ALGORITHMS` causes PyJWT to reject tokens with any other algorithm value, including `none`. The
`options={"require": [...]}` enforces that the listed claims are present; a token without an `exp` does not expire.

Short expiry (15–60 minutes) with server-side refresh token storage limits the window in which a stolen token is
useful. Long-lived JWTs with no revocation mechanism mean a leaked token is valid until it expires, with no way to
invalidate it before then.

## API key management

API keys stored in plaintext in a database present a significant risk if the database is compromised. Storing a keyed
hash (HMAC-SHA256 of the key, or a standard one-way hash if the key has sufficient entropy) limits the damage: a
database dump does not yield usable keys.

The raw key is returned once, at creation. The caller is responsible for storing it:

```python
import hashlib
import hmac
import secrets

def create_api_key() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    stored = hashlib.sha256(raw.encode()).hexdigest()
    return raw, stored  # return raw to caller; persist stored

def verify_api_key(submitted: str, stored_hash: str) -> bool:
    return hmac.compare_digest(
        hashlib.sha256(submitted.encode()).hexdigest(),
        stored_hash,
    )
```

API keys embedded in URLs appear in server access logs, `Referer` headers, and browser history. Transmitting keys in
the `Authorization` header avoids most of these paths.

Scoped keys, carrying an explicit permission set, limit the blast radius when a key is compromised. A key scoped to
read operations cannot be used to write or delete. Key rotation without downtime is worth planning for: accepting
both an old and a new key for a brief overlap period allows rotation without service interruption.

## OAuth scopes and audience validation

A token issued for one service is not intended to be accepted by another. Validating the `aud` (audience) claim
prevents a token obtained from one endpoint being replayed against a different one:

```python
def verify_oauth_token(token: str, public_key: str, expected_audience: str) -> dict:
    return jwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        audience=expected_audience,
    )
```

Scope validation checks that the token carries the specific permission required by the endpoint, not just that it is
a valid token. An endpoint that checks only signature validity accepts any valid token from the issuer, regardless of
what the token was scoped to do.

## Service-to-service authentication

Internal services that trust each other based solely on network position (private subnet, VPC) are vulnerable when
any service in that network is compromised. [Mutual TLS](../protocols/mtls.md) (mTLS) or short-lived signed JWTs between services adds a
cryptographic verification step that network position alone does not provide.

Short-lived tokens (minutes rather than hours) for machine-to-machine calls reduce the window for replay. A service
that rotates credentials automatically via a secrets manager (Vault, AWS Secrets Manager) at short intervals is a
stronger position than one using long-lived static credentials shared across all callers.
