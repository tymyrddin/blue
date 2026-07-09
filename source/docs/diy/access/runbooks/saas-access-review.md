# SaaS access review

## Cadence

Quarterly, or when a team member leaves, or when a security incident raises questions about who can reach what. A first-time review on a company older than six months almost always finds accounts that should no longer exist.

## The accumulation problem

SaaS accounts are easy to create and rarely self-expire. Contractors finish an engagement and their accounts remain. Employees leave and accounts persist until someone notices. Integration accounts are created for a specific project and quietly accumulate permissions. Dormant accounts with valid credentials are a quiet attack surface, and they require no active maintenance on the attacker's part.

## Starting point

List every SaaS tool in active use. Useful sources: recurring charges on the company card, browser bookmarks across the team, and a five-minute survey asking each team member what tools they log into. The result is usually longer than expected.

## Reviewing each service

For each tool:

1. Export or view the list of active users from the admin console.
2. Compare against the current team list. Flag any account without a current team member or documented operational reason behind it.
3. For flagged accounts:
   - Former employees or contractors: deactivate immediately.
   - Integration or bot accounts: confirm the integration is still in use and that its permissions are still appropriate.
   - Test accounts: remove unless actively needed.
4. Review permission levels for remaining accounts. Admin access to any service carries risk proportional to what that service can reach. Revoke admin where it is no longer needed.

Specific areas worth extra attention:

- Cloud consoles (AWS, GCP, Azure): IAM users without recent activity, service accounts with broad permissions, accounts without MFA.
- Code repositories: outside collaborators who have not contributed recently.
- Email platform: shared inboxes, aliases, and forwarding rules. Forwarding rules added by former team members sometimes persist for years.
- Password managers: former members who still have access to the team vault.

## All clear when

No active accounts belong to former team members. Integration accounts are scoped to what they currently need. All admin access is held by current team members with a documented reason.

## Recording the results

File the outcome: date, which services were reviewed, accounts removed or downscoped, and anything not resolved. This record is the baseline for the next review.

## Follow-up

- Note any tools where user management is difficult or opaque. These accumulate access drift the fastest and are worth replacing or auditing more frequently.
- Schedule the next review.

## Related runbooks

- [Offboarding](offboarding.md), the one-off departure this review catches when it is missed.
- [Suspicious OAuth application review](oauth-review.md) for connected apps rather than user accounts.
- [Third-party and vendor access](third-party-access.md) for the external grants this review revisits.
- [MFA rollout](mfa-rollout.md) for accounts the review finds without it.
Last updated: 29 May 2026
