# The Entra ID audit

Before you can fix anything, you need to know what you have.

The identity audit is not a one-afternoon job. At the Home, with 380 employees, years of
organic growth, at least two IT handovers, and a Microsoft 365 tenant provisioned under a
nonprofit grant that predates current governance practices, a realistic estimate is two to
three weeks to reach a trustworthy picture. The documentation is sparse. Some of what was
configured is not documented at all.

## What you are looking for

Pull the full user list from Entra ID and cross-reference it against the current HR record.
The discrepancy is what you are looking for. At the Home, the audit will surface:

Accounts that belong to former employees whose departures were not followed by a timely
disable in Entra ID. Some of these will have M365 licences still assigned. One of them
has a Global Administrator role. That account belongs to a member of the previous IT team
who left during a difficult period and whose offboarding was handled by someone who was
also managing the migration to Microsoft 365 at the same time. The account has not been
used to sign in for fourteen months, which is either reassuring or simply a sign that
whoever holds the credentials has not needed them yet.

Guest accounts with no clear record of who invited them or why. Guest invitations in M365
do not expire and are not governed by the same lifecycle as employee accounts. Some of
these will be from collaboration on specific projects; others will be legacy invitations
from years ago. Each requires a decision: is this person supposed to have access to the
tenant, and if so, to what?

Generic or shared accounts. The Home has a reception@ address and a volunteering@ address
that function as shared mailboxes. These are not inherently problematic, but shared
accounts that have interactive login enabled and are not governed by a formal owner are
worth noting. If someone has the password to reception@, you may not know who.

Service accounts. Any account configured to run automated processes, send email from
integrations, or connect to the Covenant API should be reviewed. The Covenant webhook
that handles event registration confirmation creates an account in Entra ID that the
original implementation consultant set up and that the Home's IT team did not create and
has not reviewed. It is still active.

## Admin roles

In Entra ID, go to Roles and administrators, then Global administrator. At the Home, this
will show two accounts. One is the Head of IT's dedicated admin account. The other is the
former IT team member's account described above. Both have the same level of access. One of
those people works here. The other does not.

Check beyond Global Administrator. SharePoint Administrator, Exchange Administrator, Teams
Administrator, and Dynamics 365 Administrator are all separate roles that may have been
assigned during configuration phases and never reviewed. Role creep is common in
under-staffed IT teams. Someone who needed elevated access to configure a new Teams
integration three years ago may still hold it. The principle of least privilege applies to
admin roles exactly as it does to everything else.

The Covenant consultant who set up the Events module also created an account in Entra ID
for themselves during the onboarding engagement. That account has Dynamics 365 Administrator
assigned. It does not appear in the HR record because it was never an HR matter.

## What the audit tells you next

The admin role situation leads directly to the privileged access review. The ghost accounts
lead to the offboarding process. The guest accounts and service accounts lead to a
conversation with the DPO about what external parties have access to and under what legal
basis. The Covenant consultant account leads to a conversation about what a DPA covers when
a contractor's Entra ID account persists beyond the engagement.

These are not separate problems. They are the same problem seen from different angles: the
Home's identity governance has not kept pace with the Home's growth. The audit makes the
problem visible and specific. Visible and specific is the starting point for fixing it.

## Documenting what you find

The audit output is not just for you. It is the baseline for everything that follows: the
MFA rollout, the Conditional Access policies, the offboarding process, the quarterly access
reviews. Document it in a format that the Head of IT, the DPO, and your future self after
six months of other work can actually use.

A spreadsheet per category, accounts, roles, licences, guest access, with a reviewed
date and an action required column is more useful than a polished report that nobody
updates. The action required column is the most important part. The audit has no value if
it produces a picture of the problem and no movement toward addressing it.

## Related

- [MFA rollout](mfa.md)
- [Conditional Access](conditional-access.md)
- [Privileged access](privileged-access.md)
- [Offboarding and access lifecycle](offboarding.md)
- [Covenant](../applications/covenant.md)
- [The Great Ledger](../applications/great-ledger.md)
