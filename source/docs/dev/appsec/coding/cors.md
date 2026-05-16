# CORS and same-origin policy

The same-origin policy (SOP) is a browser security model that prevents a script on one origin from reading responses
from another. Two URLs share an origin when their scheme, host, and port all match. The policy stops a malicious page
from using the victim's browser as a proxy to read authenticated content from other sites.

Cross-Origin Resource Sharing (CORS) is a controlled relaxation of the SOP. A server adds response headers that tell the
browser which other origins may read its responses. Misconfigured CORS undoes the protection SOP provides.
The [SOP and CORS attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/sop.html) page covers how these
misconfigurations are exploited.

## The CORS response headers

The critical header is `Access-Control-Allow-Origin`. It specifies which origin the browser will allow to read the
response:

```text
Access-Control-Allow-Origin: https://app.example.com
```

The wildcard `*` allows any origin to read the response. It is appropriate for genuinely public resources (a public CDN,
an open API with no authenticated content); it is not appropriate for any endpoint that returns session-specific or
user-specific data.

`Access-Control-Allow-Credentials: true` allows the browser to include cookies and other credentials in a cross-origin
request. The combination of `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Credentials: true` is rejected by
browsers: a server that wants credentialed cross-origin requests only accepts an explicit origin, not a wildcard.

## Allowlisting origins

The correct pattern for multi-origin CORS is an explicit server-side allowlist, not a reflection of whatever `Origin`
header the request sends:

```python
ALLOWED_ORIGINS = {
    "https://app.example.com",
    "https://admin.example.com",
}


def set_cors_headers(response, request_origin: str):
    if request_origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = request_origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response
```

The `Vary: Origin` header is important. Without it, a caching layer may serve a response with one origin's CORS headers
to a request from a different origin.

The unsafe pattern for comparison:

```python
# unsafe: reflects any origin the client sends
origin = request.headers.get("Origin", "")
response.headers["Access-Control-Allow-Origin"] = origin
response.headers["Access-Control-Allow-Credentials"] = "true"
```

An attacker controlled page can send any `Origin` header. Reflecting it back grants that page access to authenticated
content.

## The null origin

`Access-Control-Allow-Origin: null` is not safe for authenticated endpoints. The `null` origin is sent by sandboxed
iframes, `data:` URLs, and file:// pages. An attacker can trigger a `null` origin from a sandboxed iframe:

```html

<iframe sandbox="allow-scripts allow-forms" src="data:text/html,..."></iframe>
```

A server that trusts `null` can be targeted from any page that can embed an iframe.

## postMessage

Applications that use `postMessage` for cross-frame or cross-window communication validate the `event.origin` before
processing the message:

```javascript
window.addEventListener("message", (event) => {
    if (event.origin !== "https://trusted.example.com") {
        return; // ignore messages from untrusted origins
    }
    // process event.data
});
```

An event listener that does not check the origin accepts messages from any window, including attacker-controlled pages
that have opened the application as a popup or embedded it in an iframe.

## JSONP

JSONP (JSON with Padding) is a legacy pattern for cross-origin data loading that predates CORS. It works by returning a
JavaScript function call wrapping JSON data. The caller's domain can read the response because it arrives via a
`<script>` tag, which is not subject to SOP.

JSONP is not appropriate for authenticated or sensitive data. Modern applications on supported browsers use CORS
instead.
