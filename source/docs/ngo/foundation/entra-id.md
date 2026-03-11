# The Entra ID audit

Before you can fix anything, you need to know what you have.

The identity audit is not a one-afternoon job. In an organisation of 380 employees with years
of organic growth, a reasonable estimate is two to three weeks to get a trustworthy picture,
longer if the documentation is sparse, which it usually is.

## What you are looking for

Pull the full user list and cross-reference it with HR. You are looking for accounts that should
not exist: former employees whose accounts were never disabled, generic or shared accounts with
no named owner (servicedesk@, reception@, vrijwilligers@), guest accounts in the tenant with no
record of who invited them or why, and service accounts with interactive login enabled.

What licences are assigned, and to whom, also tells you something. An E3 or E5 licence means
SharePoint, Teams, Exchange, Defender, and a set of security features you may or may not be
using. A mixture of licence types suggests procurement happened in waves, which is normal for
an organisation that has been around long enough to have had several IT handovers.

## Admin roles

Check Entra ID under Roles and administrators, then Global administrator. How many global admins
are there? Anything above three or four without a clear justification is too many. If you find
eight, someone was being cautious. If you find fourteen, write it down carefully because you
will be telling this story later. Are any of them personal accounts
(naam.achternaam@organisatie.nl) rather than dedicated admin accounts?
Global admins should use dedicated cloud-only accounts with no mailbox, no licence, and
hardware MFA.

Then check beyond Global Administrator: SharePoint admin, Exchange admin, Teams admin, Dynamics
admin, Power Platform admin. Role creep is common in under-staffed IT teams. Someone who needed
temporary elevated access three years ago may still have it.

## The data residency question

Dutch non-profits in M365 are almost certainly storing data in Microsoft datacentres. The EU
Data Boundary rollout means your data may be processed in EU datacentres, but the default
depends on your tenant region and the specific workload.

You can check your tenant's data location in the Microsoft 365 Admin Centre under Settings,
then Org settings, then Organisation profile, then Data location.

For an organisation holding member and donor data, the data residency question has AVG
implications. Microsoft processes data under a Data Processing Agreement, but knowing where
your data lives, and being able to answer the question when asked, is part of being a
responsible data steward. Worth a conversation with your data protection officer before it
becomes a question from a journalist or a member of the board.

## Documenting what you find

The audit output is not just for you. It is the baseline for everything that follows: access
reviews, offboarding processes, Conditional Access policies, future audits. Document it in a
format that your successor, or your future self after six months of stakeholder meetings, can
actually use.

A spreadsheet per category (accounts, roles, licences, guest access) with a reviewed date and
an action required column is more useful than a polished report that nobody updates.

## Related

- [MFA rollout](mfa.md)
- [Conditional Access](conditional-access.md)
- [Offboarding and access lifecycle](offboarding.md)
