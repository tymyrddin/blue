# HTTP request smuggling

HTTP request smuggling occurs when a frontend server (load balancer, CDN, reverse proxy) and a backend application server disagree about where one HTTP request ends and the next begins. The disagreement arises from differences in how each server interprets the `Content-Length` and `Transfer-Encoding` headers when both are present in the same request. HTTP/1.1 specifies that `Transfer-Encoding: chunked` takes precedence, but implementations vary. The [HTTP request smuggling attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/smuggling.html) page covers how a desynchronised connection is exploited: request prefix injection, session hijacking, cache poisoning, and access control bypass.

## End-to-end HTTP/2

HTTP/2 does not use `Content-Length` and `Transfer-Encoding` in the same way as HTTP/1.1, and the ambiguity that causes smuggling does not exist within a single HTTP/2 connection. Using HTTP/2 throughout the entire stack, from client to frontend to backend, removes the CL/TE conflict.

The risk returns when an HTTP/2 frontend downgrades to HTTP/1.1 for backend communication (HTTP/2 to HTTP/1.1 downgrade). In this case the frontend translates HTTP/2 frames into HTTP/1.1 requests, and the translation introduces the CL/TE surface. An `h2c` (HTTP/2 cleartext) connection between frontend and backend, or maintaining HTTP/2 for the internal leg, avoids the downgrade.

## Consistent header interpretation

When HTTP/2 end-to-end is not an option, the practical mitigation is to ensure that frontend and backend parse headers consistently. The frontend normalises requests before forwarding: stripping duplicate headers, rejecting requests with both `Content-Length` and `Transfer-Encoding` present, and canonicalising chunked encoding.

nginx as a reverse proxy rejects requests with both headers by default in recent versions. Apache httpd rejects them in `2.4.53+`. Checking that the proxy layer is current is part of the mitigation.

## Application-layer controls

At the application level, a few practices reduce the blast radius when a smuggling vulnerability exists in the infrastructure:

Connection isolation: using a unique backend connection per request (disabling connection pooling between frontend and backend) prevents one request's smuggled prefix from contaminating the next request's connection. The performance cost is real; it is a tradeoff.

Request ID propagation: adding a unique identifier to each request at the frontend and verifying it at the backend makes it possible to detect when a request arrives without the identifier, which indicates a smuggled origin. This is a detection measure.

## Infrastructure auditing

Smuggling vulnerabilities are primarily identified through differential response testing: sending a request that would produce different responses depending on how the servers interpret its boundaries. Tools like Burp Suite's HTTP Request Smuggler extension and `smuggler.py` automate this. Running these against staging environments before deployment identifies the vulnerability at the infrastructure layer where the fix applies.
Last updated: 10 July 2026
