# Conditional Access: policies with teeth

MFA is a requirement. Conditional Access is the enforcement mechanism.

The difference matters practically. Per-user MFA settings can be bypassed by legacy
authentication protocols, misconfigured service accounts, or an admin who clicks the
"skip for now" prompt one time too many. Conditional Access policies evaluate every
sign-in. They are the correct place to enforce MFA because they are also where you can
require compliant devices, block legacy auth, apply different rules based on risk level,
and create a log that tells you what would have been blocked and why.

## Starting with the Microsoft baseline

Microsoft publishes Conditional Access templates covering the most important scenarios.
For a resource-constrained organisation, these are the right starting point: not because
they are perfect for every situation, but because they are documented, maintained, and
address the threat model that applies to most M365 tenants.

Start with three policies.

Require MFA for all users is the anchor policy. It is broad and covers everything
Conditional Access can reach. Deploy it in report-only mode first. Leave it there for
two weeks and watch the sign-in logs before you enforce.

Require MFA for administrators is the safety net for admin accounts, particularly
important at the Home where one Global Administrator account belongs to a former employee
and a second belongs to a Dynamics 365 consultant whose engagement ended without a formal
offboarding. Both accounts will be excluded from the standard user policy and need to be
caught explicitly.

Block legacy authentication works alongside MFA enforcement. Legacy auth bypass is the
most common route around MFA requirements. Block it after you have confirmed nothing
depends on it, which at the Home means resolving the Covenant SMTP dependency first.

## Report-only mode

Before enforcing any policy, run it in report-only mode. Report-only evaluates the policy
against each sign-in and logs what would have happened, without blocking anything. After
two weeks, review the sign-in logs filtered by the policy name.

At the Home, this review will identify the Covenant SMTP integration sending donor
acknowledgements via legacy SMTP AUTH. It will show any Bestiary connections that use
Exchange ActiveSync. It will show the night shift team accessing Teams from personal
devices at 03:00 on shift changeover. These are not all the same kind of finding, and
they do not all have the same answer.

This step prevents the 07:30 call on a Monday morning about a broken integration that
nobody knew depended on legacy auth.

## The volunteer exception

The Home's volunteer population creates a genuine policy challenge. The night shift team,
which includes Nikolaj and the other staff and volunteers who manage resident welfare
between 22:00 and 06:00, access Teams and Bestiary shift records from personal devices
that are not enrolled in the Home's mobile device management. A policy requiring compliant
devices would lock them out at the hours when continuity of care is most critical.

The right answer is not to exempt the night shift from Conditional Access entirely. The
options, in order of preference:

Require MFA only, with no device compliance requirement, for volunteer accounts whose
access is scoped appropriately. This provides second-factor protection without requiring
device enrolment.

Named locations reduce friction for volunteers who always work from the same physical
site. The Home's main site can be configured as a trusted named location, so that
sign-ins from that network face reduced friction. Sign-ins from unexpected locations still
trigger a second factor.

Guest accounts with appropriate access scope are worth considering for volunteers with very
limited access requirements, such as those who only need a single shared Teams channel.
B2B guest access creates less overhead per person than a full tenant membership for
someone who contributes four hours a week.

## What not to do

Do not create permanent named exclusions for specific user accounts without a documented
review date. Exclusions accumulate silently. The Covenant consultant's Entra ID account
is presumably still excluded from nothing, because it was never included in any Conditional
Access policy in the first place. That is the version of this problem where nobody notices
until they look.

If something genuinely cannot use Conditional Access, a legacy integration, a system with
no modern auth support, document it explicitly, set a review date, and add it to the risk
register. Known exceptions are manageable. Unknown exceptions are how breaches happen at
exactly the moment when they would be most damaging.

## Related

- [MFA rollout](mfa.md)
- [Privileged access](privileged-access.md)
- [The Coven](../applications/the-coven.md)
- [Reducing phishing exposure](../../counter/human/phishing-resistant.md)
Last updated: 09 June 2026
