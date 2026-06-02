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

## File upload hardening

Check file extensions against an allowlist of permitted types rather than a blocklist of
prohibited ones. The set of extensions a feature legitimately needs is small and enumerable;
the set an attacker might try is not. Rename uploaded files on write to prevent filename
collisions and to strip attacker-chosen names before any downstream processing touches them.

Serve uploaded files from storage that does not execute code. A file stored outside the web
root or in a bucket with no execution permissions cannot become a web shell regardless of its
content. Where files are downloadable, include `Content-Disposition: attachment` and
`X-Content-Type-Options: nosniff` to prevent browsers from sniffing and executing the content.
Enforce a size limit and reject archive formats such as ZIP that unpack into multiple files.

Validate file content independently of the declared MIME type. A file claiming to be
`image/png` with PHP code in its body passes a content-type check and fails an actual image
parse. Libraries such as Pillow (Python) or ImageMagick can re-encode images to a known-safe
format, stripping any embedded payload in the process.

## Path traversal prevention

Resolve the canonical path of any file the application constructs from user input, and
confirm that the resolved path begins with the allowed root before opening it. In most
languages:

```python
import os
ALLOWED_ROOT = "/var/www/uploads"
requested = os.path.realpath(os.path.join(ALLOWED_ROOT, user_input))
if not requested.startswith(ALLOWED_ROOT + os.sep):
    raise ValueError("path traversal detected")
```

This check catches encoded sequences, double-dot chains, and absolute path injection,
because `realpath` resolves all of them before the comparison. Avoid user input in filesystem
calls entirely where the feature permits it; framework static-serving (nginx `alias`,
Whitenoise) handles this without application code touching filenames.

## Insecure deserialisation

Avoid deserialising data from untrusted sources. The safest position is not to deserialise
at all: replace serialised objects in session cookies, tokens, or parameters with opaque
identifiers that map to server-side state.

Where deserialisation is unavoidable, use a type-safe format (JSON or MessagePack rather than
Java's native serialisation, Python `pickle`, or Ruby `Marshal`). If native serialisation is
in use, apply a deserialization filter that allowlists the permitted types before any object
is instantiated. Java's serialisation filter API (available natively since Java 17, and via
`ObjectInputFilter` from Java 9) is the relevant mechanism:

```java
ObjectInputStream ois = new ObjectInputStream(inputStream);
ois.setObjectInputFilter(info -> {
    if (info.serialClass() == null) return ObjectInputFilter.Status.UNDECIDED;
    if (ALLOWED_CLASSES.contains(info.serialClass().getName()))
        return ObjectInputFilter.Status.ALLOWED;
    return ObjectInputFilter.Status.REJECTED;
});
```

Avoid `pickle.loads()` and `yaml.load()` on untrusted data; use `yaml.safe_load()` instead.

## Prototype pollution

In JavaScript applications, freeze the Object prototype to prevent attacker-controlled keys
from poisoning inherited properties:

```javascript
Object.freeze(Object.prototype);
```

The `nopp` npm package applies this to all common object prototypes automatically. Where
freezing is not feasible, validate JSON input against a schema before merging it into
application objects: schema validation removes `__proto__` and `constructor` keys before
they reach any merge or clone operation. For collections that accept arbitrary string keys,
prefer `Map` over plain objects; `Map` instances do not inherit from `Object.prototype` and
are not affected by prototype pollution. Audit recursive-merge and deep-clone libraries,
which are the most common pollution sources.

## CORS controls

Configure `Access-Control-Allow-Origin` from an explicit allowlist rather than reflecting
the request `Origin` unconditionally. A reflected origin means any site can make credentialed
cross-origin requests to the application and read the response:

```nginx
# nginx: allow only known origins
map $http_origin $cors_origin {
    "https://app.example.com"     $http_origin;
    "https://partner.example.com" $http_origin;
    default                       "";
}
add_header Access-Control-Allow-Origin $cors_origin;
```

Never set `Access-Control-Allow-Origin: null`; sandboxed frames and local files send a `null`
origin, so this effectively allows any embedded context. Do not combine a wildcard origin
(`*`) with `Access-Control-Allow-Credentials: true`; browsers reject this combination, but
some frameworks fall back to reflecting the origin instead, which is exploitable. Restrict
the `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` values to those
actually needed.

## OAuth and SSO hardening

Compare `redirect_uri` values using exact string matching against a registered allowlist.
Prefix matching (accepting any URI that starts with the registered domain) and substring
matching (accepting any URI that contains the domain) both permit redirect to attacker
subdomains or paths. Path traversal in the URI (`/callback/../../../attacker`) also bypasses
prefix matching.

Require a cryptographically random `state` parameter per authorisation request, bound to the
user's session, and validate it on return before exchanging the code. An absent or static
`state` parameter enables CSRF against the OAuth flow. For public clients, enforce PKCE
(`code_challenge_method=S256`) and reject code exchanges that arrive without a valid
`code_verifier`. Restrict dynamic client registration to authenticated and authorised callers;
an open registration endpoint exposes JWK Set fetching and logo URL processing as SSRF
vectors.

## HTTP Host header controls

Configure the web server with an explicit server name and reject requests whose `Host` header
does not match. In nginx, a catch-all server block that returns 444 (no response) for
unrecognised hosts handles this:

```nginx
server {
    listen 80 default_server;
    return 444;
}
server {
    listen 80;
    server_name app.example.com;
    # ... application config
}
```

Build absolute URLs from a configured constant rather than from the request `Host` header.
Password reset links, email confirmation URLs, and redirect targets constructed from the Host
header are all vulnerable to header poisoning. Disable `X-Forwarded-Host` and similar
override headers unless a specific trusted reverse proxy requires them; if a proxy sets these
headers, validate them at the application layer against the same allowlist as the Host header.

## HTTP request smuggling

The primary mitigation is HTTP/2 end-to-end between the front-end and back-end. HTTP/2 uses
binary framing and has no `Content-Length` / `Transfer-Encoding` ambiguity at the protocol
level; the smuggling surface appears only in HTTP/1.1 downgrades.

Where HTTP/1.1 is unavoidable on the back-end path, normalise ambiguous headers at the
front-end: reject requests that contain both `Content-Length` and `Transfer-Encoding`, or
that contain a `Transfer-Encoding` value other than `chunked`. Disable connection reuse
between the front-end proxy and back-end servers if the performance trade-off is acceptable;
smuggling requires persistent connections to hold state across request boundaries.

## Web cache poisoning

Include in the cache key every input that affects the response. A header or parameter that
changes what the application returns but is excluded from the key allows a poisoned response
to be served to callers who did not send that header. Param Miner and the `Vary` response
header are useful tools for auditing what a cache is keying on.

Strip or ignore headers that are not needed to generate the correct response: `X-Forwarded-Host`,
`X-Forwarded-Scheme`, and similar override headers are frequent unkeyed inputs in misconfigured
caches. Reject GET requests that carry a body (fat GET requests); these are non-standard and
their body is typically unkeyed. Disable caching for authenticated responses unless the cache
key includes the full session identity.

## WebSocket security

Authenticate the WebSocket handshake using the existing session mechanism. The `Upgrade`
handshake is an HTTP request and carries the session cookie; a server that validates the
session cookie on the handshake request prevents connection hijacking in the same way it
prevents HTTP session hijacking. Validate the `Origin` header on the handshake server-side,
restricting connections to known origins, since the WebSocket protocol does not enforce
same-origin policy on its own.

Apply the same input validation to WebSocket message content as to HTTP request parameters.
Messages arriving over an authenticated connection are not implicitly trusted: they may
contain injection payloads, oversized data, or out-of-sequence commands. Rate-limit message
frequency and size at the server, not the client.

## OS command injection

Avoid passing user-controlled input to any shell execution function (`os.system`,
`subprocess.call(shell=True)`, `exec`, `passthru`). Where OS interaction is unavoidable,
use an API that accepts the program and its arguments as a list, never as a shell string:

```python
# avoid: concatenates input into a shell string
subprocess.call(f"convert {user_file}", shell=True)

# use: program and arguments are separate; no shell is invoked
subprocess.run(["convert", user_file], check=True)
```

Allowlist permitted argument values where the set is finite (for example, permitted output
formats or permitted target hostnames). An argument that passes through without validation
is an injection vector even when the shell is not invoked directly, because some programs
(`ffmpeg`, `ImageMagick`) interpret certain argument values as URIs or file paths and perform
their own fetches.
