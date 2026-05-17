# Web application scanning

Web application scanning tests a running application for vulnerabilities by sending crafted requests and analysing responses. It covers the application layer: what the server returns in response to various inputs, rather than the network or host configuration.

## Application attack surface

XSS: reflected and stored. Scanners inject payloads into query parameters, form fields, headers, and cookies, then check whether the payload appears unescaped in the response or in subsequent responses.

CSRF: whether state-changing requests can be made without a valid CSRF token, and whether the token validation is actually enforced.

SSRF: whether the application can be made to issue requests to internal addresses by supplying crafted URLs in parameters that the application fetches.

Authentication: login bruteforce protection, account lockout, session fixation, session token entropy, logout behaviour (whether the server-side session is actually invalidated).

Session management: session token exposure (in URLs, in referrer headers, in log files), cookie security flags (HttpOnly, Secure, SameSite), session timeout.

Business logic: these are harder for automated scanners to find because they require understanding the application's intended behaviour. Negative prices, skipping required steps in a workflow, accessing draft content as an anonymous user, and similar issues tend to surface in manual testing.

## Tools

OWASP ZAP: open-source; active and passive scanning modes; spider crawls the application before scanning; integrates with CI/CD via its API or Docker image; suitable for both automated and manual use.

Burp Suite Professional: the standard for professional web application penetration testing; active scanner, proxy, Repeater, Intruder, and Sequencer modules; the Community edition excludes the active scanner but supports manual testing.

Acunetix, Invicti (formerly Netsparker): commercial; targeted at teams running regular automated scans; generally lower false positive rates than open-source alternatives.

## Authenticated scanning

Scanning without logging in tests only the unauthenticated attack surface. Authenticated scanning (providing the scanner with credentials or a session token) covers the logged-in attack surface, which is often larger. Both OWASP ZAP and Burp Suite support authenticated scanning.

## Scope and authorisation

Web application scanning issues a large number of requests in a short time and can affect application stability. Running scans against production systems requires care; a staging environment that mirrors production is typically preferable for automated scanning, with targeted manual testing against production.
