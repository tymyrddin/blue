# Caching security

Caching introduces a category of vulnerability that does not exist in purely stateless applications: content generated for one user can be stored and served to another. The mechanism is the same feature that makes caches efficient.

## Cache-Control semantics

Three directives appear frequently but are not equivalent:

`no-store` instructs every cache (browser, CDN, proxy) to discard the response and not store it. Subsequent requests fetch from origin. Use for responses that contain credentials, session data, or sensitive personal information.

`private` allows the browser's local cache to store the response but instructs shared caches (CDNs, reverse proxies) not to. Appropriate for personalised content that is safe to cache locally but not on a shared tier.

`no-cache` is frequently misunderstood. It does not prevent caching; it requires the cache to revalidate with the origin before serving a stored response. The response may still be stored.

```text
Cache-Control: no-store
```

is not the same as

```text
Cache-Control: no-cache
```

Sensitive responses that rely on `no-cache` for privacy are mis-configured.

## Vary and authenticated content leakage

A cache keyed only on the URL will serve the same cached response to all requests for that URL, regardless of which user made the request. A response to an authenticated user gets stored and then served to an unauthenticated one.

The `Vary` header tells the cache which request headers are part of the cache key:

```text
Cache-Control: private
Vary: Cookie, Authorization
```

Without `Vary: Cookie`, a shared cache that incorrectly handles `private` (or one that is deliberately configured as a caching proxy) can leak authenticated responses. CDN documentation on how each directive interacts with cache keys is worth reading before deploying personalised content behind a CDN.

## Cache poisoning

Cache poisoning works by tricking a cache into storing a malicious response and then serving it to subsequent users. The [web cache poisoning attack page](https://red.tymyrddin.dev/docs/in/app/techniques/cache.html) covers the exploitation patterns in detail. The typical path is a request that includes an unkeyed header (a header the application reads but the cache does not include in its cache key) and a crafted value for that header that alters the response:

```http
GET /page HTTP/1.1
Host: example.com
X-Forwarded-Host: attacker.com
```

If the application uses `X-Forwarded-Host` to construct absolute URLs in the response (for canonical links, redirects, or resource URLs), and the cache does not include `X-Forwarded-Host` in its key, the poisoned response is stored and served to users who did not send that header.

Mitigations:

- Configure the application to trust only a fixed set of upstream headers, not whatever arrives in the request
- Audit which headers are unkeyed at the CDN layer; CDN configurations often have an explicit list of headers excluded from cache keys by default
- Use cache-busting query parameters or ETags for dynamic content that varies by context

## Redis and Memcached exposure

Redis and Memcached bind to all interfaces by default in some distributions. A Redis instance exposed to the internet with no authentication has been the proximate cause of a number of significant breaches: the protocol is simple enough that an attacker with network access can read, write, or flush the entire cache without credentials.

Redis configuration (`redis.conf`):

```
bind 127.0.0.1
requirepass <strong-password>
```

For Redis 6 and later, ACL-based access control is available and provides finer-grained permission assignment than a single `requirepass` password.

Memcached has no authentication mechanism in its base protocol. It relies entirely on network-level access control: firewall rules, VPC placement, and binding to a private interface. Exposing Memcached to a public interface is not recoverable through application-level controls.

## CDN-level poisoning

CDNs can be poisoned through headers that the CDN uses for routing or caching decisions but does not normalise. Common vectors include:

- `Host` header injection (where the CDN forwards the host to origin without validation)
- Unkeyed query parameters (query parameters the CDN strips before caching, but the application reads)
- Fat GET requests (GET requests with a body that the CDN ignores but the application processes)

The practical test is to check what the CDN includes in its cache key for each endpoint, compare it with what the application uses to generate the response, and identify any inputs that affect the response but not the key.
