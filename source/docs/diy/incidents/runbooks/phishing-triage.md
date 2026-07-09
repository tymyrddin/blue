# Phishing report triage

## Trigger

A team member reports receiving a suspicious email. Also triggered when someone reports having clicked a link or opened an attachment in an email they now suspect was malicious.

## First: was it interacted with?

Two different situations. The response differs significantly.

- Received only: low urgency. Proceed to "Received only" steps.
- Link clicked or attachment opened: high urgency. Proceed directly to "Link clicked or attachment opened" steps.

## Received only

1. Ask the recipient to forward the email (as an attachment if possible, to preserve headers). Do not click any links during review.
2. Check the From header and reply-to address. A display name showing a trusted contact with an unrecognised email address is the most common indicator.
3. Hover over any links (do not click): confirm whether the URL matches the claimed destination.
4. Check whether the same email reached other team members. If so, warn them before they open it.
5. Report to the email provider as phishing.

No further action required if nobody interacted with it.

## Link clicked or attachment opened

Assume credentials may be compromised. Start with the most privileged accounts.

6. Change the password for the account the recipient was logged into at the time of the click.
7. Revoke all active sessions for that account. Most providers offer "sign out all other devices" in account security settings.
8. Enable MFA on that account if not already active (see [MFA rollout](../../access/runbooks/mfa-rollout.md)).
9. Check the browser for newly installed extensions. Some phishing sites install a credential-stealing extension silently.
10. Review the authentication log for the affected account for unusual logins in the hours following the click.
11. If the link prompted the recipient to enter credentials and they did: [rotate](../../access/runbooks/secret-rotation.md) all accounts where that same password was used. Credential reuse is common and attackers test for it.
12. If an attachment was opened: assume the device may be compromised. Consider whether it should be isolated from the network pending a full review.

## All clear when

For received-only: email reported, team warned if the same email was in circulation.

For clicked: credentials rotated, sessions revoked, MFA active, authentication log reviewed, browser extensions checked, device assessed.

## Communication

If the phishing appears targeted (references the organisation, a team member by name, or a specific project): record the content for awareness, and consider whether customers or partners may have received similar emails.

## Follow-up

- Note the phishing technique in a shared team document. Patterns from real examples build better awareness than hypothetical training scenarios.
- If multiple team members received the same email, the team's email addresses may have been harvested. Check how those addresses are publicly exposed.

## Related runbooks

- [Suspicious OAuth application review](../../access/runbooks/oauth-review.md) if the link sought an app authorisation rather than a password (consent phishing).
- [MFA rollout](../../access/runbooks/mfa-rollout.md) and [secret rotation](../../access/runbooks/secret-rotation.md) for the credential side of the response.
Last updated: 10 July 2026
