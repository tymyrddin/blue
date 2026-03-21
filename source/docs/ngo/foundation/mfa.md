# MFA: the unglamorous foundation

Week two. The audit is done. It is worse than expected.

Thirty-seven per cent of accounts have no MFA configured. Three accounts with administrative
roles are protected only by passwords. The password reset flow for the volunteering@ shared
mailbox sends a verification code to that same shared mailbox, which four people can access.
The Covenant consultant's Entra ID account has never had MFA enabled because it was set up
quickly during an onboarding week and the question was never revisited.

Nobody did this maliciously. The organisation grew. People got busy. The IT coordinator was
understaffed. The MFA rollout started, stalled, restarted. Someone wrote a policy document.
Nobody enforced it.

This is not unusual. This is Tuesday in a non-profit.

## What the Fabulist Incident showed

The connection between MFA and the [breach scenario](../data/breach-simulation.md) is worth stating
directly here. The attacker who accessed Kevin's Bestiary session then moved laterally to
Covenant using Kevin's Covenant password, which happened to be the same password Kevin had
set for Bestiary when both systems were onboarded in the same week. Bestiary uses local
authentication and is not federated to Entra ID, so MFA in the M365 tenant would not have
protected Kevin's Bestiary access. But Covenant is an M365-integrated application where MFA
is optional and Kevin had not enabled it. Covenant's own statistics show that 40 per cent
of users have MFA configured. Kevin was in the other 60 per cent.

Had MFA been enforced for Covenant access, the attacker with Kevin's password would have
needed a second factor that Kevin's machine could not provide. The Covenant export, 340
volunteer records including home addresses, personal email addresses, and DBS reference
numbers, would not have happened.

This is not a criticism of Kevin. Kevin was not responsible for the policy decision that
made MFA optional. The responsibility for that decision, and for not revisiting it, belongs
to the IT function.

## The rollout

Segment the population before you start. Staff with access to financial systems, Covenant,
Bestiary, or any administrative role are not negotiable. Full-time staff on standard M365
licences come next. Volunteers who access only a shared Teams channel or a read-only
calendar are a different conversation, but they are still part of the conversation.

For most staff at the Home, the Microsoft Authenticator app is the right default. It is
free, it works on any smartphone, and it provides push notifications rather than requiring
a code to be typed. For the night shift team and other volunteers who may be using personal
devices that are older or limited, consider whether FIDO2 security keys are warranted for
high-risk roles, and whether SMS fallback is acceptable for lower-risk accounts. SMS is weak
authentication, but it is substantially better than no second factor.

Communicate before you enforce. The Home has volunteers who have been helping for years and
do not think of themselves as technology users. A phased rollout with a clear deadline and
a named person to call when things go wrong is more likely to succeed than a policy change
that appears in someone's inbox on the day it takes effect. People who feel respected comply
better than people who feel ambushed.

Build an exception process. There will be edge cases. Document them, set a review date,
and put them on the risk register. Known exceptions are manageable. Unknown exceptions are
how credential-stuffing attacks succeed against organisations that believe they have MFA
covered.

## Disabling legacy authentication

Legacy authentication protocols (SMTP AUTH, IMAP, POP3, Exchange ActiveSync without
modern auth) bypass Conditional Access entirely. They are the reason MFA enforcement
sometimes feels less effective than expected: the MFA policy applies to modern
authentication sign-ins, but an attacker who has valid credentials can use legacy auth to
skip the second factor.

Before disabling legacy auth at the Home, check the sign-in logs in Entra ID and filter by
client application. Look specifically for Exchange ActiveSync, IMAP, POP3, SMTP, and
Other clients. The Home has at least one integration, the automated donor acknowledgement
emails sent from Covenant via SMTP, that will need to be migrated to an OAuth-based
sending method before the cutoff. Find these before you turn off legacy auth, not after.

## After MFA

MFA enforced and legacy authentication blocked removes the most common attack vector for
credential-based breaches. It does not remove all of them. A sophisticated attacker using
an adversary-in-the-middle proxy can intercept session tokens even after MFA completes,
which is one of the techniques covered in the security awareness programme and the reason
phishing-resistant MFA methods such as FIDO2 and certificate-based authentication provide
stronger protection than authenticator app push notifications for high-privilege accounts.

For the Home's 200,000 supporter records in Covenant and the resident medical histories in
Bestiary, MFA enforcement is the most consequential single action the IT function can take
this quarter. Conditional Access, privileged access management, and lifecycle governance
follow from it.

## Related

- [Conditional Access policies](conditional-access.md)
- [Privileged access management](privileged-access.md)
- [Offboarding and access lifecycle](offboarding.md)
- [GDPR obligations](../data/gdpr.md)
- [The Fabulist Incident](../data/breach-simulation.md)
