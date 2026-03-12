# Privileged access

The number of global admins in a mid-sized non-profit M365 tenant is usually inversely
proportional to how much the organisation has thought about it.

Four global admins: probably deliberate. Eight: someone was being cautious. Fourteen: nobody
was really thinking about it, and now nobody remembers who needs it.

## The principle

Administrators should use normal user accounts for normal work: email, Teams, SharePoint. When
they need to perform administrative tasks, they should use a separate, dedicated admin account
that has no mailbox, no licence, and no exposure to phishing or malware through normal
productivity use.

This separation limits the blast radius of a compromised account. A phishing email that captures
a user's session token for their regular account cannot be used to make tenant-wide changes if
administrative access requires a separate account with stronger authentication requirements.

## In practice for a non-profit

You almost certainly cannot implement a full Privileged Access Workstation setup with dedicated
hardware. That is fine. What you can implement costs nothing extra if you already have Entra
ID P2 licences.

Create dedicated admin accounts that have no Exchange licence, are excluded from all normal user Conditional Access policies,
are subject to their own stricter Conditional Access policy, and require phishing-resistant MFA
such as a FIDO2 security key or certificate-based authentication.

Review the actual tasks people perform and assign the minimum required role. Someone who manages
user accounts needs User Administrator, not Global Administrator. Exchange settings need Exchange
Administrator. Teams needs Teams Administrator. Dynamics needs Dynamics 365 Administrator. The
principle is the same throughout: just enough, no more.

If your licencing includes Entra ID P2 (included in E5, Microsoft 365 E3 with the add-on, or
Business Premium), Privileged Identity Management allows just-in-time activation of
administrative roles. An admin who needs Global Administrator access for a specific task
activates the role, performs the task, and the elevation expires. This is worth implementing
even with a small team.

## The break-glass account

Every tenant should have one or two emergency access accounts that are not tied to any specific
individual, protected by a very strong password stored offline in a sealed envelope in a
physical safe, permanently excluded from all Conditional Access policies, monitored with an
alert for any sign-in activity, and tested quarterly.

This account exists for the scenario where your normal admin accounts are inaccessible: a
misconfigured Conditional Access policy, a lost FIDO2 key, an identity provider outage.
Without it, you can be locked out of your own tenant.

## Related

- [Entra ID audit](entra-id.md)
- [Conditional Access](conditional-access.md)
- [Offboarding](offboarding.md)
