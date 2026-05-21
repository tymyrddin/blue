# Essential API testing tools

These four tools cover the interactive side of API security work: sending and replaying requests, managing authentication flows, and intercepting traffic from clients that do not expose their behaviour through standard devtools. Automated scanners (OWASP ZAP, Burp Suite, ffuf) are covered in [Proactive vulnerability scanning](scan.md).

## Postman

An HTTP client that organises requests into collections with environment variables for switching cleanly between development, staging, and production contexts. Test scripts written in JavaScript execute after each response and can assert status codes, response bodies, headers, and timing, making it practical to attach security checks to functional test suites rather than running them separately. Newman, the CLI companion, runs collections in CI.

Useful for building a reusable library of security-relevant requests, exploring undocumented endpoints, and verifying that individual endpoints behave as expected across different auth states and privilege levels.

## Insomnia

A REST and GraphQL client with good native support for OAuth2 token flows. Token acquisition, refresh, and injection into subsequent requests are handled without manual copy-paste, which matters when the authentication layer itself is what is being tested rather than the endpoints behind it. Less ecosystem overhead than Postman; a reasonable choice when collection management is not the priority.

## K6

A load testing tool scripted in JavaScript. In a security context it is mainly useful for verifying that rate limiting and resource exhaustion controls hold under realistic traffic. A throttle that behaves correctly at low volume may not do so when several threads hit the same endpoint simultaneously; K6 surfaces this without requiring a separate load testing setup.

Fits naturally into CI/CD: thresholds can be set on request duration, error rate, or custom metrics, and the run fails the pipeline when they are exceeded.

## Telerik Fiddler

An HTTP proxy that captures and replays traffic from any HTTP client on the machine. Most useful when the request source is not a browser: thick clients, mobile apps, or desktop applications that do not expose their network behaviour through devtools. Captured requests can be modified before forwarding, making it practical for quick parameter manipulation without configuring a full intercepting proxy.

Fiddler Classic runs on Windows only. Fiddler Everywhere is cross-platform but requires a paid licence. For browser-based API testing, Burp Suite or OWASP ZAP offer more capability for the same kind of work.
