# Configure CORS safely

Hardening runbook. Sets the cross-origin resource sharing policy so that only trusted origins can read responses from the server, without falling into the common misconfigurations that make CORS worse than useless. The aim is a restrictive, explicit allow-list, not a permissive reflection.

## When to run

On an API or web service that serves cross-origin requests. When reviewing an existing service whose CORS policy is unknown, uses a wildcard, or reflects the request origin.

## What CORS does and does not do

CORS is enforced by the browser. A strict policy stops a malicious page on another domain from reading responses using a logged-in user's credentials. It does nothing against a direct server-to-server request: an attacker forging requests outside a browser ignores CORS entirely. So CORS protects against one specific browser-based attack and is not a substitute for server-side authentication and authorisation.

## The configuration

Restrict `Access-Control-Allow-Origin` to an explicit list of trusted origins. The safe shape is a server-side check of the incoming origin against an allow-list, returning that origin only if it matches.

## The misconfigurations to avoid

Three patterns turn CORS into an exposure:

Reflecting the origin without validation. Reading the request's `Origin` header and echoing it straight back into `Access-Control-Allow-Origin`, combined with `Access-Control-Allow-Credentials: true`, lets any site read credentialed responses. A wildcard would have made the browser refuse the credentialed request; reflecting the origin achieves the same access while slipping past that safeguard. This is the most damaging CORS mistake.

`Access-Control-Allow-Origin: null`. Sandboxed and internal-document requests can present a `null` origin, so allowing `null` opens access to those. Avoid it.

Wildcards on internal services. `*` on an internal network trusts that no browser can reach the service from an untrusted page. Internal browsers regularly can reach untrusted external sites, so the network boundary is not the protection it appears to be.

## Risk

Tightening CORS can break legitimate cross-origin clients (a separate frontend domain, a partner integration) that were relying on the loose policy. Identify the real cross-origin consumers and add them to the allow-list before removing a wildcard, rather than discovering them through breakage.

## Verify

Send a cross-origin request with an allowed and a disallowed origin and compare:

```
curl -sI -H "Origin: https://trusted.example.com" https://api.example.com/ | grep -i access-control-allow-origin
curl -sI -H "Origin: https://evil.example.com"   https://api.example.com/ | grep -i access-control-allow-origin
```

The allowed origin should be reflected back; the disallowed one should not appear. Confirm the policy is not echoing whatever origin is sent, and that `null` is not accepted.

## Done

`Access-Control-Allow-Origin` returns only origins on the allow-list. No unvalidated reflection of the request origin. No `null` origin allowed. No wildcard on anything credentialed or internal. Legitimate cross-origin clients still work.

## Rollback

Add a newly discovered legitimate origin to the allow-list rather than reverting to a wildcard. If a tightening broke a client, the fix is the specific origin, not reopening the policy.

## Follow-up

- CORS is browser-enforced only. Confirm the service also has server-side authentication and authorisation for anything sensitive; see the [webserver stack](../stack.md).
