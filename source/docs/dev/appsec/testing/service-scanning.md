# Web service scanning

Web services and APIs have a different attack surface from web applications: less HTML rendering, more structured data
exchange, and often less scrutiny applied during testing because the interface is not visible in a browser.

## What to test

Authentication: whether endpoints that require authentication actually enforce it, and whether authentication can be
bypassed by omitting or manipulating tokens. JWT implementations sometimes accept tokens signed with `none` as the
algorithm, or accept tokens signed with a symmetric key when the server expected an asymmetric one. Horizontal privilege
escalation (accessing another user's resources by changing an ID in the request) is a common finding.

Authorisation: whether authenticated users can access resources beyond their permitted scope. Testing with different
user roles (standard user accessing admin endpoints, one tenant accessing another tenant's data) catches authorisation
gaps that authentication testing does not.

Input validation: whether the API validates input types, ranges, and formats, or passes them through to a backend that
may be less tolerant. Over-posting (sending additional fields in a request body that the API binds to a model without
filtering) can set fields that the application assumes are server-controlled.

Rate limiting: whether authentication endpoints, password reset flows, and API endpoints with high cost (search, export)
are rate-limited. Most frameworks do not apply rate limiting by default.

Data exposure: API responses that include more fields than the client needs (internal IDs, timestamps, status flags,
other users' data) create unnecessary exposure even without a direct injection vulnerability.

## Tools

Postman with Newman: API testing and automation; useful for building a test collection that covers the above cases and
running it as part of CI.

OWASP ZAP: active scanner with an API mode; can intercept and fuzz API requests.

Burp Suite: the standard tool for manual web service testing; the Repeater and Intruder modules support iterative
testing.

`httpie`, `curl`: for simple, targeted tests against specific endpoints.

## OWASP API Security Top 10

OWASP maintains a separate Top 10 for APIs (distinct from the web application Top 10). The categories include Broken
Object Level Authorisation, Broken Authentication, Broken Object Property Level Authorisation, Unrestricted Resource
Consumption, and others. It is a useful reference for structuring a testing plan.
