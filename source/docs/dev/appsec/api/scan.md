# Proactive vulnerability scanning

Scanning an API in isolation — sending known payloads at documented endpoints — finds a subset of what is there.
[Reconnaissance from the attacker's side](https://red.tymyrddin.dev/docs/in/api/notes/recon.html) begins earlier
and covers more ground: JavaScript bundle analysis, historical endpoint discovery, and framework fingerprinting
often surface endpoints that do not appear in the documentation at all.

## What to scan for

**Shadow and deprecated endpoints.** Older API versions (`/v1/`, `/v2/`) may still be reachable even when the
documentation covers only the current version. These endpoints frequently receive less testing and fewer security
updates. Scanning involves replaying traffic through a proxy to surface paths that appear in JavaScript bundles or
mobile app binaries, not only those in the OpenAPI spec.

**Excessive data exposure.** Responses that return more fields than the documented schema suggests — including
internal identifiers, timestamps, or fields relevant to other users — are worth flagging. Comparing the documented
response schema against actual responses from a test account identifies undocumented fields.

**Fuzzing parameter values and names.** [Fuzzing](https://red.tymyrddin.dev/docs/in/api/notes/fuzzing.html) goes
beyond documented parameters: sending unexpected parameter names, content types, and HTTP methods against each
endpoint reveals validation gaps, error messages that disclose internal structure, and occasionally unguarded
functionality. Automated tools like OWASP ZAP and Burp Suite support this; the OpenAPI spec (if available) provides
a baseline, and deviations from it are interesting targets.

**Authentication bypass paths.** Unprotected routes adjacent to protected ones are a recurring pattern: an
authentication check applied at the route level may not cover sub-paths or HTTP methods that were added later.
Scanning without authentication credentials and comparing the response against an authenticated request confirms
whether the check is effective.

**Misconfigured CORS and HTTP methods.** CORS policies that reflect arbitrary origins or trust `null` are common
misconfigurations. Endpoints that accept HTTP methods beyond those the API uses (OPTIONS, TRACE, or unused verbs)
are worth documenting.

## Tools

OWASP ZAP and Burp Suite both support automated scanning against OpenAPI specifications and manual interception for
targeted probing. Postman with Newman runs collections of security-specific requests as part of a CI pipeline.
`ffuf` and similar tools are useful for parameter and path fuzzing when a more targeted approach is needed than a
full scanner provides.

Automated scanners find known patterns reliably. Business logic vulnerabilities, authorisation failures, and
workflow-level issues require manual testing with multiple accounts at different privilege levels.
