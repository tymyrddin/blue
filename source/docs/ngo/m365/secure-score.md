# Microsoft Secure Score

Secure Score is a reasonable starting point for understanding where the M365 tenant stands and
what the highest-value configuration changes are. It is not a security programme. It is a
prioritised to-do list with a number attached.

The number is not the point. The point is the list of recommended actions, each with an
explanation of what it does, what it affects, and what the risk is of not doing it.

## How to use it

Find it in the Microsoft 365 Defender portal under Secure Score. The Recommended actions tab
shows everything that would improve the score if addressed, along with the points on offer and
the difficulty of implementation.

Filter by product (Identity, Devices, Apps, Data) to focus on one area at a time. Sort by
points and then cross-reference against what actually reduces risk in your context. A
configuration change that improves the score by forty points but requires re-enrolling all
mobile devices is a different kind of work from one that improves it by twenty points and
requires a single policy toggle.

## What to address first

For a non-profit starting from a typical organic M365 configuration, the highest-value actions
tend to cluster around identity (MFA, Conditional Access, admin roles), email (anti-phishing
policies, SPF, DKIM, DMARC), and sharing settings (external sharing defaults in SharePoint
and OneDrive).

The identity items should largely be covered by the foundation work. The email items are next.
The sharing settings are frequently overlooked and frequently the source of data exposure
incidents in non-profit organisations.

## What Secure Score does not tell you

Secure Score reflects configuration. It does not reflect whether people are trained, whether
processes exist, whether incidents are being detected, or whether your sector-specific
applications are secure. A perfect Secure Score on a tenant where staff are clicking phishing
links because nobody has run awareness training is still a problem.

Use it as a configuration audit tool, not as a measure of overall security posture.

## Related

- [Exchange security](exchange.md)
- [SharePoint and external sharing](sharepoint.md)
- [Defender for Office 365](defender.md)
