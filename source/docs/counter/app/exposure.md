# Reducing web application attack surface

Defence starts with reducing what is exploitable. Every control below addresses a class of
vulnerability that appears consistently in web application testing. None of them is
sufficient alone; together they raise the cost of exploitation significantly.

## Input handling

Parameterised queries (prepared statements) eliminate SQL injection for database calls.
This is not an input validation approach: it separates the query structure from the data
at the driver level, so no input value can change the query's meaning regardless of its
content.

Auto-escaping engines are the safer choice for server-side template rendering; avoid passing
user input directly into `render()`, `eval()`, or template string construction. If a
feature genuinely requires dynamic template content, constrain what is dynamic rather than
sanitising the input.

Validate file and URL inputs fed to outbound HTTP clients (image loaders, webhook handlers,
document importers) against an explicit allowlist of permitted schemes, hosts, and
ports. Block loopback addresses and link-local ranges (169.254.0.0/16, ::1) at the
validation layer, not as an afterthought.

Configure XML parsers to disable external entity processing and DTD loading
explicitly. The safe configuration is not the default in most libraries:

```python
# Python lxml: disable external entities
from lxml import etree
parser = etree.XMLParser(resolve_entities=False, no_network=True)
```

```java
// Java SAXParser
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

## Output and response handling

Keep stack traces and detailed error messages from the client in production. A generic
message with a correlation ID that maps to the full detail in server-side logs is the
appropriate response. An error page that reveals the ORM type, database schema, or
framework version is a discovery aid.

Include these security headers on every response:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

The Content-Security-Policy is the most impactful XSS mitigation. A policy that disallows
inline scripts and external script sources forces XSS payloads to find a script source
the policy permits, which is significantly harder.

## Authentication and session hardening

Setting session cookies with `HttpOnly`, `Secure`, and `SameSite=Strict` (or at minimum
`SameSite=Lax`) limits the impact of XSS and CSRF. `HttpOnly` prevents JavaScript from reading
the cookie. `Secure` prevents transmission over HTTP. `SameSite=Strict` prevents the cookie
from being sent with cross-origin requests, eliminating most CSRF attack scenarios.

Restrict JWT implementations to an explicit algorithm allowlist rather than accepting whatever
the token header declares. Reject the `none` algorithm unconditionally. Asymmetric
algorithms (RS256, ES256) are preferable to symmetric ones (HS256) for tokens validated
across multiple services. Key rotation belongs in the production runbook, not the backlog.

Short expiry times on password reset tokens and one-time codes (fifteen minutes is a common
ceiling), binding to the issuing email address, and invalidation after first use are the
relevant controls.

## Access control

Enforce access control server-side on every request, not assumed from the UI flow.
A deny-by-default approach, where every endpoint requires authentication unless explicitly
marked public, prevents the common pattern of an endpoint that was "internal" during
development and accidentally left open.

Prevent mass assignment with explicit allowlists at the model or serialiser layer,
not by stripping fields from user input. A field with no business reason for client
modification is not assignable regardless of what the client sends.

Separate privileged operations from the main application surface. Admin functionality
served from a separate subdomain or path prefix that is only accessible from specific
network sources is harder to test and harder to abuse.

## Business logic

Atomic database transactions or application-level locks are the right control for shared-state
operations. A check-and-write that reads a value and then updates it without holding a lock is
exploitable with concurrent requests. Idempotency keys on financial operations prevent
double-spend from race conditions and duplicate submissions.

Validate workflow state transitions server-side at every step, not only at the start and end.
If a refund is only valid when an order is in "delivered" status, that status check goes at
the refund endpoint, not implied by the UI flow that precedes it.
