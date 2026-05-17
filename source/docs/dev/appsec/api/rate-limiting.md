# Rate limiting

Rate limiting without careful implementation is easier to bypass than it appears.
[Common bypass techniques](https://red.tymyrddin.dev/docs/in/api/notes/rate-limit.html) include IP address spoofing
via request headers, path variation, and timing against predictable reset windows. The
[evasion techniques](https://red.tymyrddin.dev/docs/in/api/notes/evade.html) page covers these in more detail. The
defensive position is to design limits so that bypassing them requires the attacker to pay a cost similar to the
cost of the legitimate operation.

## Rate-limiting targets

Authentication endpoints, password reset flows, and OTP verification are the highest-value targets: unlimited
attempts allow automated credential stuffing and brute-force. Enumeration endpoints (anything that confirms whether
a username, email, or ID exists) are a second tier. Resource-creation endpoints (account registration, API key
generation) are a third.

A single global limit applied across all endpoints misses the point. Most endpoints do not need rate limiting, and
a uniform limit allows an attacker to exhaust a specific endpoint's reasonable budget without triggering the
global limit.

## Bypass-resistant implementation

IP-based rate limiting alone is bypassable. Common vectors:

- Spoofing `X-Forwarded-For` or `X-Real-IP`: if the application uses these headers to determine the client address,
  the attacker sets them to arbitrary values. Trust these headers only when the load balancer or proxy that sets them
  is within the trusted network boundary and the application accepts them only from that known upstream.
- Path variation: `/api/v1/login`, `/api/v1/login/`, and `/API/V1/LOGIN` may be treated as different paths by a
  naïve key function. Normalise the path before keying.
- Distributed requests: many source IPs, one target account. Per-account limits (keyed on the authenticated user or
  the submitted username) catch this where per-IP limits do not.

Flask-Limiter supports custom key functions. For authenticated endpoints, rate by user identity rather than IP:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import g

def authenticated_user_key():
    if hasattr(g, "current_user") and g.current_user:
        return f"user:{g.current_user.id}"
    return get_remote_address()

limiter = Limiter(authenticated_user_key, app=app)

@app.route("/api/settings", methods=["POST"])
@limiter.limit("20 per minute")
def update_settings():
    ...
```

For unauthenticated endpoints, nginx `limit_req` provides a layer before requests reach the application at all:

```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/auth/login {
    limit_req zone=login burst=3 nodelay;
}
```

`$binary_remote_addr` uses the connection address, not any forwarded header.

## Window semantics

Fixed-window limits (reset at clock boundaries) can be double-spent: an attacker sends the full budget at the end of
one window and the full budget at the start of the next, effectively doubling the allowed rate over a short period.
A sliding window, counting requests in the past N seconds from the moment of the current request, closes this gap.
Redis-backed token bucket or sliding log implementations are common for this.

## Lockout and account enumeration

Account lockout on repeated failed authentication is worth combining with rate limiting. Lockout without rate limiting
allows an attacker to lock out arbitrary accounts through a denial-of-service path. Rate limiting without lockout
allows slow brute-force that stays under the limit indefinitely. The combination, with gradual delays rather than hard
lockout, is more resistant to both paths.

Error responses on failed authentication do not distinguish between "username not found" and "password incorrect":
both return the same message and, ideally, the same response time. Response time variation on the "username not found"
path (a short-circuit return) versus the "password incorrect" path (a full hash comparison) is a timing oracle. A
dummy hash comparison on the not-found path normalises the timing.
