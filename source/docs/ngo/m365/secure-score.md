# Microsoft Secure Score

Secure Score is a reasonable tool for understanding where the Home's M365 tenant stands
and which configuration changes would have the most effect. It is not a security programme.
It is a prioritised to-do list with a number attached.

The number is not the point. A tenant with a high Secure Score and an unreviewed Global
Administrator account belonging to a former employee has a configuration problem that the
number does not capture. Use the score to find the configuration gaps, not to report on
security posture to people who will interpret a number as a measure of safety.

## How to use it

Find it in the Microsoft 365 Defender portal under Secure Score. The Recommended actions
tab shows everything that would improve the score if addressed, with an explanation of what
each action does and what the risk is of not doing it.

Filter by product (Identity, Devices, Apps, Data) to focus on one area at a time. At the
Home, the Identity category will reflect the state of the MFA rollout, the Conditional
Access policies, and the admin role remediation. As foundation work is completed, those
items should move from recommended to addressed, and the score should rise as a side effect
of work done for the right reasons.

Sort recommended actions by points and cross-reference against actual risk in the Home's
context. A change that improves the score significantly but requires re-enrolling all
mobile devices is a different kind of effort from one that requires a single policy toggle.
The scoring does not reflect the Home's specific threat model, only the generic model
Microsoft uses for all tenants.

## What to address in order

For a tenant at the Home's current state, the Secure Score recommendations will cluster
around three areas.

Identity: MFA coverage, Conditional Access policies, admin role assignments. These
correspond directly to the foundation work in this section. They are the highest-value
actions and should be addressed first regardless of what the score says about relative
points.

Email: SPF, DKIM, DMARC configuration, external forwarding rules, anti-phishing policy
tuning. The Home's DMARC is in monitoring mode. That alone is a score recommendation, and
the recommendation is correct: moving to quarantine is overdue. The external forwarding
rule feeding Great Ledger security advisories to a personal account will show up here too
if Secure Score is checking for unexpected forwarding configurations.

Sharing settings: external sharing defaults in SharePoint and OneDrive. If the tenant has
been running with permissive defaults since provisioning, this category will show several
recommendations. The webhook secret in the SharePoint photograph is not a Secure Score
finding because Secure Score does not read document contents, but the sharing settings that
allowed it to persist in a broadly accessible folder are something the sharing configuration
review will surface.

## What Secure Score does not tell you

Secure Score reflects tenant configuration. It does not reflect whether staff recognise
phishing emails, whether incidents are being detected, whether the SIRT structure has been
exercised, or whether the Home's sector-specific applications have their own security gaps.
Bestiary's local authentication, the Coven's unmanaged membership, and the Burrow's
absence of a DPA are invisible to Secure Score entirely.

A tenant with a high Secure Score and a functioning phishing programme is in a better
position than one with either alone. Use Secure Score for what it is good at: finding
configuration gaps in M365. Use the rest of this documentation for what Secure Score
cannot see.

## Related

- [Exchange security](exchange.md)
- [SharePoint and external sharing](sharepoint.md)
- [Defender for Office 365](defender.md)
- [Identity foundations](../foundation/entra-id.md)
