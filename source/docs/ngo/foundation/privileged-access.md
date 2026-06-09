# Privileged access

The number of Global Administrators in a mid-sized non-profit's M365 tenant is usually
inversely proportional to how much thought went into it.

At the Home, the Entra ID audit finds two. One belongs to the Head of IT, who is aware
of it, uses a dedicated admin account without a mailbox, and has hardware MFA configured.
The other belongs to a member of the previous IT team who left during a difficult
transition period. That account has been dormant for fourteen months. The password was set
by someone who is no longer in the building, and whether it was shared, written down, or
stored in a password manager that walked out the door with its owner is not known. The
account has Global Administrator access to the entire tenant.

These are not equivalent situations, but they are both the Home's problem.

## The principle

Administrative work should be done with accounts that are used only for administrative
work: no mailbox, no M365 licence, no exposure to phishing, no browser sessions left open
between tasks. Normal work, email, Teams, documents, happens with a normal user account.
The separation limits the blast radius of a compromised session. An adversary-in-the-middle
attack that captures the Head of IT's session token for their regular account cannot make
tenant-wide changes if administrative access requires a separate account with stronger
authentication requirements.

The Fabulist Incident is instructive in this context. Kevin had local administrator access
on the Bestiary server because the maintenance workflow required it. That access was used
for a legitimate operational purpose and assigned without a formal review of whether the
scope was the minimum necessary. When the attacker operated from Kevin's machine under
Kevin's credentials, that local admin access was available immediately. The principle
applies equally to Entra ID roles: no one should hold administrative access as a
background condition of their normal work.

## In practice

A full Privileged Access Workstation setup with dedicated hardware is not realistic for
most organisations at the Home's stage. What is realistic, and costs nothing if Entra ID
P2 licences are already in place:

Dedicated admin accounts with no Exchange licence, excluded from standard user Conditional
Access policies, subject to their own stricter policy, requiring phishing-resistant MFA.
For the Head of IT, this is already the case. For any other account that holds an
administrative role (SharePoint Administrator, Exchange Administrator, Dynamics 365
Administrator) the same standard should apply.

Least-privilege role assignment. The Covenant consultant who set up the Events module was
given Dynamics 365 Administrator during the onboarding engagement. Whether Dynamics 365
Administrator was actually required for that work, or whether a more limited role would
have been sufficient, is a question that was not asked at the time. Ask it now for every
administrative role the audit finds, and for every future role assignment.

Privileged Identity Management, if the licencing includes Entra ID P2, provides
just-in-time activation of administrative roles. Rather than holding Global Administrator
permanently, an admin activates the role for a specific task, performs the task, and the
elevation expires. The activation requires MFA confirmation and is logged. For an
organisation that is working toward better governance, this is the correct model for the
Global Administrator role specifically.

## The former Global Admin account

The immediate action for the dormant Global Administrator account is to disable it in
Entra ID and revoke all active sessions. This is not a decision that requires a committee:
the account belongs to someone who does not work here, it holds the highest level of
access in the tenant, and the circumstances of its continued existence are unclear. Disable
it. Confirm with legal and HR that this does not create any complication. Then address the
question of whether any role assignments it holds need to be transferred to the Head of IT's
account or distributed to more appropriately scoped accounts.

## The break-glass account

Every tenant should have one or two emergency access accounts that are not tied to any
specific individual. These accounts exist for the scenario where normal admin accounts are
inaccessible: a misconfigured Conditional Access policy, a lost hardware MFA device, a
situation where the Head of IT is unreachable and an urgent tenant action is required.

At the Home, the break-glass account credentials should be stored offline in a sealed
envelope in the Director's physical safe, with a second copy in a different physical
location. The account should be excluded from all Conditional Access policies, monitored
with an alert for any sign-in activity, because any use of the break-glass account is
either a genuine emergency or something that needs explaining, and tested quarterly to
confirm it works.

## Related

- [Entra ID audit](entra-id.md)
- [Conditional Access](conditional-access.md)
- [Offboarding](offboarding.md)
- [The Fabulist Incident](../data/breach-simulation.md)
- [Hunting identity persistence and OAuth consent abuse](../../counter/human/runbooks/identity-persistence-hunt.md)
