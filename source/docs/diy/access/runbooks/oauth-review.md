# Suspicious OAuth application review

## Trigger

A team member reports an OAuth application they do not recognise with access to a company account. An application appears in the connected apps list that nobody knowingly authorised. A security report or email notification mentions an OAuth token issued to an unknown application.

## Severity

High. An OAuth application with broad permission scopes can read email, access repositories, create commits, exfiltrate data, or modify account settings, depending on what was authorised. It operates silently with no further interaction required from the account holder.

## Revoke first

Do not investigate before revoking. The risk of leaving the application connected during investigation outweighs the risk of revoking something legitimate.

1. In the affected account's settings, navigate to connected applications, authorised apps, or third-party access (the label varies by platform).
2. Revoke the suspicious application.
3. Check whether other team members show the same application in their connected apps. If so, revoke it from those accounts as well.

To revoke specifically:

- GitHub: Settings, Applications, Authorised OAuth Apps
- Google: myaccount.google.com, Security, Third-party apps with account access
- Slack: workspace settings, Connected apps (admin console for organisation-level)
- Microsoft 365: myapplications.microsoft.com

## Assessing the scope

4. Check the access log for the account to understand what the application may have done since authorisation. Most platforms maintain an activity or audit log.
5. Review the permission scopes the application was granted. Read-only email access is a different exposure from repository write access or the ability to create webhooks.
6. Determine when the application was first authorised. Calculate the window of potential access.
7. If the authorisation followed a link in an email, message, or pop-up: that was a phishing or consent-phishing attempt. Check whether the same link was sent to other team members.

## All clear when

Application revoked from all affected accounts. Access log reviewed. Scope of potential access understood.

## Communication

If the application may have accessed sensitive data, source code, or credentials during the window it was active: treat this as a data exposure incident and notify affected parties accordingly.

## Evidence

Preserve the access log before revoking additional integrations. Some platforms reduce log visibility once a connected application is revoked.

## Follow-up

- Audit all OAuth applications across all company accounts. Remove any not in active use.
- Add OAuth application review to the quarterly [SaaS access review](saas-access-review.md).
- Consider enabling organisational restrictions on OAuth app authorisation: GitHub allows blocking all third-party apps except approved ones; Google Workspace has similar controls.

## Related runbooks

- [Phishing report triage](../../incidents/runbooks/phishing-triage.md), since an unexpected OAuth grant often arrives through consent phishing.

## Legal notes

OAuth application access to personal data may constitute a personal data breach under applicable data protection law. Seek legal advice if customer or employee data was within scope of the application's permissions.
