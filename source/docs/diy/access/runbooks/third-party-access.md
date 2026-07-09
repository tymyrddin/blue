# Third-party and vendor access

## When access is requested

When a vendor, contractor, auditor, or external integration needs access to systems, repositories, data, or
infrastructure. Also run periodically to review access that was previously granted.

## The quiet accumulation

Access granted to an external party is outside the organisation's direct control once established. Vendor systems get
breached. Contractors move on. Integrations outlive the projects they were created for. The access remains valid until
someone explicitly removes it, and nobody removes what nobody remembers granting.

## Before saying yes

Before granting any external access:

1. Define the minimum access actually required. "Read-only access to the staging logs" is different from "access to the
   AWS console." Be specific.
2. Set an expiry date at the time of granting. Do not rely on a manual reminder to revoke it later. If the platform
   supports time-limited tokens or access expiry, use it.
3. Document the grant: who, what, why, when it expires.

For access to sensitive data, it is worth asking: does this vendor have their own security practices adequate to the
risk level of what they will touch? A vendor receiving access to production customer data warrants more scrutiny than
one reviewing a staging environment.

## Granting access

4. Create a dedicated account or API key for the external party. Do not share an existing account or a personal token.
5. Scope strictly: one repository, not all; one specific IAM role, not admin; read-only where read-only is sufficient.
6. Log the grant in the access inventory: vendor name, what was granted, date granted, expiry date.

## Preventing drift

7. At the end of each engagement: revoke access immediately. Do not wait for a handover, a debrief, or a final invoice
   to be paid.
8. For ongoing integrations: include them in the quarterly SaaS access review. The question at each review is whether
   the integration is still in active use and whether its permission scope still matches its purpose.

## Ending access

9. Revoke the account or API key in the relevant platform.
10. If the vendor had access to credentials they may have stored locally (API keys, database passwords): rotate those
    credentials.
11. Update the access inventory to note the removal date.

## Follow-up

Vendor security incidents can expose organisation data even when the access was appropriately scoped and properly
revoked. Monitoring vendor security notices for services with access to sensitive data is worth the effort for the
most critical integrations.

## Related runbooks

- [SaaS access review](saas-access-review.md), where ongoing integrations are revisited.
- [Secret rotation](secret-rotation.md) for credentials a vendor held when access ends.
- [Suspicious OAuth application review](oauth-review.md) for vendor integrations connected via OAuth.
Last updated: 29 May 2026
