# DNS and domain recovery

## Trigger

A domain is not resolving. DNS records have changed unexpectedly. The domain registrar account is inaccessible. There is evidence of an unauthorised domain transfer.

## Severity

High to critical. A domain that has been taken over or is not resolving affects every service associated with it: web application, email, authentication flows, and TLS certificate validity. Recovery may take hours to days depending on the type of failure.

## Diagnosing the problem

Before taking action, confirm what is actually broken. The response differs depending on the failure type.

1. Run a DNS query from multiple sources:
   ```
   dig example.com
   nslookup example.com 8.8.8.8
   ```
   If the responses differ between sources, DNS propagation is still in progress. If both return wrong records, the records have been changed.

2. Check whether the registrar account is accessible. If login fails: use the registrar's account recovery process (typically email or phone verification).

3. Determine the failure type:
   - DNS records changed but registrar account is accessible: proceed to "Correcting DNS records."
   - Registrar account inaccessible: proceed to "Regaining registrar access."
   - Domain transferred to another registrar: proceed to "Domain transfer recovery."

## Correcting DNS records

4. Log into the registrar or DNS provider (Cloudflare, Route 53, Google Domains, or similar).
5. Compare current records against a documented known-good state. Screenshot the current (incorrect) records before changing them.
6. Restore the correct records. For each record type, the change typically propagates within minutes for short TTLs or up to 48 hours for long ones.
7. Verify propagation: `dig example.com` until the correct IP is returned from multiple resolvers.

## Regaining registrar access

8. Use the registrar's account recovery process. This typically requires access to the recovery email address or phone number on file. If those have also been changed: contact the registrar's abuse or support team directly.
9. Once access is restored: enable MFA immediately (see [MFA rollout](../../access/runbooks/mfa-rollout.md)).
10. Review account recovery contacts and remove any that were added without authorisation.

## Domain transfer recovery

11. Contact the original registrar's abuse team. Domain transfers under .com and .net can sometimes be reversed within a 60-day recovery window. Act immediately, as each day reduces the options.
12. File a dispute with ICANN if the registrar does not respond promptly.
13. Gather evidence: historical DNS records, registration history, any emails about the transfer. This evidence is needed for the dispute process.

## Securing the account after recovery

14. Enable MFA on the registrar account if not already active.
15. Enable registrar lock (transfer lock) on all domains to prevent future unauthorised transfers.
16. Review all DNS records against the documented known-good state and correct any that remain wrong.

## All clear when

Domain resolves to correct addresses from multiple resolvers. Registrar account is secured with MFA and transfer lock enabled. All DNS records verified.

## Communication

If the domain disruption affects customers: notify them through an out-of-band channel (status page on a separate domain, social media, direct contact) while the primary domain is unreachable.

## Evidence

Screenshot DNS records before and after changes. Preserve registrar access logs and any communications about the incident. This is needed for insurance, legal proceedings, or ICANN disputes.

## Follow-up

- Document all DNS records in a separate location (a shared document, version control) so that a known-good state exists outside the registrar.
- Confirm all domains have transfer lock enabled.
- Confirm the registrar account uses a non-personal, shared team email as the account address, so access does not depend on a single person's email being available.

## Related runbooks

- [MFA rollout](../../access/runbooks/mfa-rollout.md), the control that prevents most registrar-account takeovers in the first place.
- [Secret rotation](../../access/runbooks/secret-rotation.md) if the registrar credentials themselves were exposed.
