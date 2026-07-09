# Server-side request forgery (SSRF)

Server-side request forgery occurs when an application fetches a URL supplied by the user
without validating where that URL points. The [SSRF attack perspective](https://red.tymyrddin.dev/docs/in/app/techniques/ssrf.html) covers what an attacker does with this access. The request originates from the server, which may
have access to internal services, cloud metadata endpoints, and infrastructure that is not
reachable from the internet.

In cloud environments the risk is particularly direct. AWS EC2 and ECS instances expose
instance metadata at `http://169.254.169.254/latest/meta-data/`, including IAM credentials.
GCP exposes equivalent data at `http://metadata.google.internal/`. An SSRF vulnerability
in a cloud-hosted application can be enough to retrieve credentials and escalate to full
account compromise.

## Blocklist bypass patterns

The instinct is to block known bad destinations: private IP ranges, the link-local block
(`169.254.0.0/16`), localhost. Blocklists fail because:

* DNS rebinding: the validation check resolves the hostname to a safe IP; a subsequent
  request resolves to an internal address.
* IPv6 equivalents of blocked IPv4 ranges are often not covered.
* HTTP redirects: the initial URL passes validation; the redirect target does not.
* URL parser inconsistencies between the validation code and the HTTP library.

## Allowlisting

The safe pattern is an explicit allowlist of permitted schemes and hosts, checked after
parsing the URL but before following any redirects:

```python
from urllib.parse import urlparse
import httpx

ALLOWED_HOSTS = {"api.example.com", "cdn.example.com"}
ALLOWED_SCHEMES = {"https"}

def fetch_allowed(url: str, timeout: float = 5.0) -> bytes:
    parsed = urlparse(url)

    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError(f"scheme not permitted: {parsed.scheme}")

    if parsed.hostname not in ALLOWED_HOSTS:
        raise ValueError(f"host not permitted: {parsed.hostname}")

    # follow_redirects=False prevents redirect-based bypasses
    response = httpx.get(url, follow_redirects=False, timeout=timeout)
    response.raise_for_status()
    return response.content
```

The `httpx` library is preferred over `requests` for new code because it makes timeout and
redirect behaviour explicit in the constructor rather than as per-call options.

## Node.js

```javascript
const https = require("https");
const { URL } = require("url");

const ALLOWED_HOSTS = new Set(["api.example.com", "cdn.example.com"]);

function fetchAllowed(rawUrl) {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== "https:") {
        throw new Error(`scheme not permitted: ${parsed.protocol}`);
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
        throw new Error(`host not permitted: ${parsed.hostname}`);
    }

    return new Promise((resolve, reject) => {
        // built-in https does not follow redirects; a 3xx response is returned as-is
        https.get(rawUrl, (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
        }).on("error", reject);
    });
}
```

## Alternatives to allowlisting

Some applications genuinely need to fetch arbitrary user-supplied URLs (URL preview, webhook
delivery, link unfurling). Options:

* Route outbound requests through a dedicated egress proxy that enforces network-level
  restrictions on what can be reached.
* Run the fetching in an isolated environment (container with no access to internal
  networks, a separate cloud function with a restricted VPC).
* For cloud environments: enforce IMDSv2 on AWS (requires a session token, which SSRF
  cannot easily obtain) and equivalent mitigations on other platforms.

Disabling instance metadata endpoints entirely is an option if the application does not
use them.
Last updated: 17 May 2026
