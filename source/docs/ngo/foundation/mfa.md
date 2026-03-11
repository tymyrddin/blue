# MFA: the unglamorous foundation

Week two. You have done the audit. It is worse than expected.

Thirty-seven per cent of accounts have no MFA configured. Three global admin accounts are
protected only by passwords. The password reset flow sends a code to a shared mailbox that
four people can access. One account with Dynamics access belongs to a volunteer who left in 2022.

Nobody did this maliciously. The organisation grew. People got busy. The ICT servicedesk was
understaffed. MFA rollout started, stalled, started again. Someone wrote a policy document.
Nobody enforced it.

This is not unusual. This is Tuesday in a non-profit.

## What you are dealing with

The M365 tenant is almost certainly in the default configuration inherited from initial setup.
Security defaults may be on, which is good, or may have been disabled at some point for
compatibility reasons, which is less good. Per-user MFA settings may be a tangle of
individually toggled states if someone tried to roll this out manually. Legacy authentication
protocols (SMTP AUTH, IMAP, POP3) may still be enabled for some old system that needs it.
Conditional Access is either absent, has gaps, or has policies that nobody has reviewed since
they were created.

## The rollout problem

The standard objection to MFA enforcement in non-profits is the volunteer population. A retired
volunteer who helps one afternoon a week and uses a ten-year-old Android phone is a real person
with a real access requirement and a real risk of getting stuck.

This is not a reason to skip MFA. It is a reason to plan the rollout properly.

Segment your population. Employees with high-value access (financial systems, CRM, admin roles)
are non-negotiable. Full-time staff come next. Volunteers who only access a shared calendar or
a Teams channel are a different conversation.

Choose methods that work for your population. The Microsoft Authenticator app works for most
people and is free. For volunteers with limited smartphone access, consider FIDO2 security keys
or SMS as a fallback. SMS is weak but better than nothing for low-risk accounts.

Communicate before you enforce. A phased rollout with a deadline is better than a surprise.
People who feel respected comply better than people who feel ambushed. On this date, we are
requiring MFA for all accounts. Here is how to set it up. Here is who to call if you need help.

Build an exception process. There will be edge cases. Have a documented, time-limited exception
process so that individual cases do not become permanent holes.

## Disabling legacy authentication

Legacy authentication protocols bypass Conditional Access entirely. They are the route through
which credential-stuffing attacks succeed against organisations that think they have MFA covered.

Before disabling, audit what actually uses them. In Entra ID, go to Sign-in logs and filter on
Client app. Look for Exchange ActiveSync, IMAP, POP3, SMTP, Exchange Web Services, and Other
clients. If something is using legacy auth, find out what it is before you turn it off. Some
old integration that sends automated emails is a common answer. Work with the application owner
to migrate it to modern authentication before the cutoff date.

## After MFA: what comes next

MFA enforced and legacy authentication blocked gets you past the most common attack vector.
It is not the end of the identity story. Conditional Access, privileged access management, and
lifecycle management (joiners, movers, leavers) are next. But MFA alone makes credential
stuffing and password spray attacks largely ineffective, and that matters for an organisation
holding 200,000 people's data.

## Related

- [Conditional Access policies](conditional-access.md)
- [Privileged access management](privileged-access.md)
- [Offboarding and access lifecycle](offboarding.md)
