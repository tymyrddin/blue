# Check HTTP security headers

Validation runbook. Confirms which security headers a site actually sends, so that hardening changes can be verified and missing headers caught. The check answers one question: does the live site send what the configuration is supposed to set?

## When to use

After any change to security headers ([HSTS](hsts.md), [CSP](csp.md), [X-Frame-Options](xframe.md), [cookies](cookie.md)). As a periodic check. After a deployment, since a config change that was not reloaded, or a reverse proxy stripping headers, shows up here.

## From the command line

```
curl -sI https://example.com
```

This returns the response headers. Check for the ones that should be present:

- `Strict-Transport-Security` (HTTPS enforcement)
- `Content-Security-Policy` (script and content restriction)
- `X-Content-Type-Options: nosniff` (MIME-type enforcement)
- `X-Frame-Options` or CSP `frame-ancestors` (clickjacking protection)

Each absent header is a gap corresponding to its runbook. Confirm the values match what the config sets: a `Content-Security-Policy` containing `unsafe-inline`, for instance, is present but weak.

## With an online grader

[securityheaders.com](https://securityheaders.com/) grades a site A+ to F based on the headers present and gives a per-header breakdown. [KeyCDN's HTTP header checker](https://tools.keycdn.com/curl) shows the raw headers without a grade. Useful for a quick external read, and for sharing a result. Note that a high grade reflects header presence, not correctness of the policy values, so read the breakdown.

## Verify

The check is itself the verification step for the header runbooks. A header that the config sets but `curl -sI` does not show points to one of: the config was not reloaded, the directive is in the wrong server block, or a reverse proxy or CDN in front is stripping or overriding it.

## Done

Each intended security header is present in the live response with the expected value. Any absent header is either added (via its runbook) or noted as a deliberate exception.

## Follow-up

- For a header that is configured but not appearing, check the reload happened and that nothing in front of the server is rewriting responses.
- Re-run after each deployment; header configuration drifts as the stack changes.
Last updated: 10 July 2026
