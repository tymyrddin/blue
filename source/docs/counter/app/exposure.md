# Reducing web application attack surface

Defence starts with reducing what is exploitable. Every control below addresses a class of
vulnerability that appears consistently in web application testing. None of them is
sufficient alone; together they raise the cost of exploitation significantly.

## Input handling

Parameterised queries (prepared statements) eliminate SQL injection for database calls.
This is not an input validation approach: it separates the query structure from the data
at the driver level, so no input value can change the query's meaning regardless of its
content.

Auto-escaping engines are the safer choice for server-side template rendering. Passing user
input directly into `render()`, `eval()`, or template string construction bypasses the engine's
protections and is the common path to SSTI. Where a feature genuinely requires dynamic
template content, constraining what is dynamic is more reliable than sanitising the input.

File and URL inputs fed to outbound HTTP clients (image loaders, webhook handlers,
document importers) are worth validating against an explicit allowlist of permitted schemes,
hosts, and ports. Loopback addresses and link-local ranges (169.254.0.0/16, ::1) belong
in the blocked set at the validation layer.

The safe XML parser configuration disables external entity processing and DTD loading
explicitly. This is not the default in most libraries:

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

Detailed error messages and stack traces in production responses are reconnaissance material:
an error page that reveals the ORM type, database schema, or framework version gives an
attacker information they would otherwise need to infer. A generic message with a correlation
ID that maps to the full detail in server-side logs is the appropriate response.

Security headers worth including on every response:

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

Session cookies with `HttpOnly`, `Secure`, and `SameSite=Strict` (or at minimum
`SameSite=Lax`) limit the impact of XSS and CSRF. `HttpOnly` prevents JavaScript from reading
the cookie. `Secure` prevents transmission over HTTP. `SameSite=Strict` prevents the cookie
from being sent with cross-origin requests, eliminating most CSRF attack scenarios.

JWT implementations restricted to an explicit algorithm allowlist prevent the class of
attacks where the token controls its own verification method. The `none` algorithm warrants unconditional rejection. Asymmetric
algorithms (RS256, ES256) are preferable to symmetric ones (HS256) for tokens validated
across multiple services. Key rotation belongs in the production runbook.

Short expiry times on password reset tokens and one-time codes (fifteen minutes is a common
ceiling), binding to the issuing email address, and invalidation after first use are the
relevant controls.

## Access control

Access control enforced server-side on every request closes the common pattern of an
endpoint that was "internal" during development and
accidentally left open. A deny-by-default approach, where every endpoint requires
authentication unless explicitly marked public, is the reliable form of this.

Mass assignment is prevented by explicit allowlists at the model or serialiser layer, not
by stripping fields from user input. A field with no business reason for client modification
is not assignable regardless of what the client sends.

Admin functionality on a separate subdomain or path prefix, accessible only from specific
network sources, is harder to test and harder to abuse than admin functionality on the same
surface as the main application.

## Business logic

Atomic database transactions or application-level locks are the right control for shared-state
operations. A check-and-write that reads a value and then updates it without holding a lock is
exploitable with concurrent requests. Idempotency keys on financial operations prevent
double-spend from race conditions and duplicate submissions.

Workflow state transitions validated server-side at every step close the step-skipping
attack surface. If a refund is only valid when an order is in
"delivered" status, that status check goes at the refund endpoint.

## File upload hardening

An allowlist of permitted extension types is more reliable than a blocklist of prohibited
ones. The set of extensions a feature legitimately needs is small and enumerable; the set an
attacker might try is not. Renaming uploaded files on write prevents filename collisions and
removes attacker-chosen names before any downstream processing touches them.

Storage that does not execute code is the appropriate destination for uploaded files. A file
stored outside the web root or in a bucket with no execution permissions cannot become a web
shell regardless of its content. Where files are downloadable, `Content-Disposition: attachment`
and `X-Content-Type-Options: nosniff` prevent browsers from sniffing and executing the content.
A size limit and rejection of archive formats such as ZIP, which unpack into multiple files,
belong in the upload validation.

File content validated independently of the declared MIME type catches the common bypass where
a file claims to be `image/png` but carries PHP code in its body: it passes a content-type
check and fails an actual image parse. Libraries such as Pillow (Python) or ImageMagick can
re-encode images to a known-safe format, stripping any embedded payload in the process.

## Path traversal prevention

The canonical path of any file the application constructs from user input, resolved and
confirmed to begin with the allowed root before the file is opened, catches all standard
traversal patterns. In most languages:

```python
import os
ALLOWED_ROOT = "/var/www/uploads"
requested = os.path.realpath(os.path.join(ALLOWED_ROOT, user_input))
if not requested.startswith(ALLOWED_ROOT + os.sep):
    raise ValueError("path traversal detected")
```

This check catches encoded sequences, double-dot chains, and absolute path injection,
because `realpath` resolves all of them before the comparison. Avoiding user input in
filesystem calls entirely is the stronger position; framework static-serving (nginx `alias`,
Whitenoise) handles this without application code touching filenames.

## Insecure deserialisation

Deserialising data from untrusted sources is the root of most deserialisation exploitation.
The safest position is not to deserialise at all: replacing serialised objects in session
cookies, tokens, or parameters with opaque identifiers that map to server-side state removes
the attack surface entirely.

Where deserialisation is unavoidable, a type-safe format (JSON or MessagePack) reduces the attack surface.
Native serialisation in use warrants a deserialisation filter that allowlists the permitted
types before any object is instantiated. Java's serialisation filter API (available natively
since Java 17, and via `ObjectInputFilter` from Java 9) is the relevant mechanism:

```java
ObjectInputStream ois = new ObjectInputStream(inputStream);
ois.setObjectInputFilter(info -> {
    if (info.serialClass() == null) return ObjectInputFilter.Status.UNDECIDED;
    if (ALLOWED_CLASSES.contains(info.serialClass().getName()))
        return ObjectInputFilter.Status.ALLOWED;
    return ObjectInputFilter.Status.REJECTED;
});
```

`pickle.loads()` and `yaml.load()` on untrusted data are unsafe; `yaml.safe_load()` is the
appropriate alternative.

## Prototype pollution

In JavaScript applications, freezing the Object prototype prevents attacker-controlled keys
from poisoning inherited properties:

```javascript
Object.freeze(Object.prototype);
```

The `nopp` npm package applies this to all common object prototypes automatically. Where
freezing is not feasible, JSON schema validation before merging input into application objects
removes `__proto__` and `constructor` keys before they reach any merge or clone operation.
`Map` is preferable to plain objects for collections that accept arbitrary string keys; `Map`
instances do not inherit from `Object.prototype` and are not affected by prototype pollution.
Recursive-merge and deep-clone libraries are the most common pollution sources and worth
auditing.

## CORS controls

`Access-Control-Allow-Origin` configured from an explicit allowlist closes the primary CORS
misconfiguration. A reflected origin means any site can make credentialed cross-origin
requests to the application and read the response:

```nginx
# nginx: allow only known origins
map $http_origin $cors_origin {
    "https://app.example.com"     $http_origin;
    "https://partner.example.com" $http_origin;
    default                       "";
}
add_header Access-Control-Allow-Origin $cors_origin;
```

`Access-Control-Allow-Origin: null` is not a safe value; sandboxed frames and local files
send a `null` origin, so this effectively permits any embedded context. A wildcard origin
(`*`) combined with `Access-Control-Allow-Credentials: true` is rejected by browsers, but
some frameworks fall back to reflecting the origin instead, which is exploitable.
`Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` values restricted to those
actually needed reduce the cross-origin surface.

## OAuth and SSO hardening

Exact string matching against a registered allowlist for `redirect_uri` values closes the
redirect hijacking surface. Prefix matching (accepting any URI that starts with the registered
domain) and substring matching (accepting any URI that contains the domain) both permit
redirect to attacker subdomains or paths. Path traversal in the URI
(`/callback/../../../attacker`) also bypasses prefix matching.

A cryptographically random `state` parameter per authorisation request, bound to the user's
session and validated on return before exchanging the code, prevents CSRF against the OAuth
flow. An absent or static `state` parameter is exploitable. For public clients, PKCE
(`code_challenge_method=S256`) with rejection of code exchanges that arrive without a valid
`code_verifier` prevents authorisation code interception. Dynamic client registration
restricted to authenticated and authorised callers removes an open registration endpoint that
would otherwise expose JWK Set fetching and logo URL processing as SSRF vectors.

## HTTP Host header controls

A web server with an explicit server name configured, rejecting requests whose `Host` header
does not match, is the baseline. In nginx, a catch-all server block that returns 444 (no
response) for unrecognised hosts handles this:

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

Absolute URLs built from a configured constant prevent header poisoning in password reset
links, email confirmation URLs, and redirect targets constructed from the Host header. `X-Forwarded-Host` and similar override headers
are best disabled unless a specific trusted reverse proxy requires them; where a proxy sets
these headers, validation at the application layer against the same allowlist as the Host
header applies.

## HTTP request smuggling

The primary mitigation is HTTP/2 end-to-end between the front-end and back-end. HTTP/2 uses
binary framing and has no `Content-Length` / `Transfer-Encoding` ambiguity at the protocol
level; the smuggling surface appears only in HTTP/1.1 downgrades.

Where HTTP/1.1 is unavoidable on the back-end path, normalising ambiguous headers at the
front-end closes the most common smuggling vectors: requests that contain both
`Content-Length` and `Transfer-Encoding`, or a `Transfer-Encoding` value other than `chunked`,
are candidates for rejection. Disabling connection reuse between the front-end proxy and
back-end servers removes the state-sharing that smuggling requires, if the performance
trade-off is acceptable.

## Web cache poisoning

A cache key covering every input that affects the response prevents a header or parameter
from being excluded while still influencing what the application returns. A header or
parameter that changes the response but is excluded from the key allows a poisoned response
to reach callers who did not send that header. Param Miner and the `Vary` response header
are useful tools for auditing what a cache is keying on.

Headers not needed to generate the correct response are worth stripping or ignoring:
`X-Forwarded-Host`, `X-Forwarded-Scheme`, and similar override headers are frequent unkeyed
inputs in misconfigured caches. GET requests carrying a body (fat GET requests) are
non-standard and their body is typically unkeyed, making rejection the safer default.
Authenticated responses cached without the full session identity in the cache key are a
poisoning risk.

## WebSocket security

The WebSocket handshake authenticated via the existing session mechanism prevents connection
hijacking in the same way session validation prevents HTTP session hijacking. The `Upgrade`
handshake is an HTTP request and carries the session cookie; a server that validates it on
the handshake request benefits from the same protection. The `Origin` header validated
server-side on the handshake, restricting connections to known origins, compensates for the
WebSocket protocol not enforcing same-origin policy on its own.

WebSocket message content warrants the same input validation as HTTP request parameters.
Messages arriving over an authenticated connection are not implicitly trusted: they may
contain injection payloads, oversized data, or out-of-sequence commands. Message frequency
and size limited at the server is the reliable control.

## OS command injection

Passing user-controlled input to shell execution functions (`os.system`,
`subprocess.call(shell=True)`, `exec`, `passthru`) is the class of mistake this section
addresses. Where OS interaction is unavoidable, an API that accepts the program and its
arguments as a list, never as a shell string, is the correct form:

```python
# avoid: concatenates input into a shell string
subprocess.call(f"convert {user_file}", shell=True)

# use: program and arguments are separate; no shell is invoked
subprocess.run(["convert", user_file], check=True)
```

An allowlist of permitted argument values where the set is finite (for example, permitted
output formats or permitted target hostnames) further reduces the surface. An argument that
passes through without validation is an injection vector even when the shell is not invoked
directly, because some programs (`ffmpeg`, `ImageMagick`) interpret certain argument values
as URIs or file paths and perform their own fetches.
Last updated: 10 July 2026
