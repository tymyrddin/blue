# Conditional Access: policies with teeth

MFA is a requirement. Conditional Access is the enforcement mechanism.

The difference matters. A per-user MFA setting can be bypassed by legacy authentication
protocols, by misconfigured exceptions, or simply by an admin who clicks skip for now one too
many times. Conditional Access policies are evaluated for every sign-in. They are the right
place to enforce MFA, because they are also where you can require compliant devices, block
legacy auth, and apply different rules to different risk levels.

## Starting with the Microsoft baseline

Microsoft publishes Conditional Access templates that cover the most important scenarios. For a
resource-constrained organisation, these are the right starting point, not because they are
perfect for your situation, but because they are documented, maintained, and cover the threat
model that affects most organisations.

Start with three policies.

Require MFA for all users is the anchor policy. Broad, covers everything that Conditional
Access can reach. Deploy in report-only mode first and watch the sign-in logs for two weeks
before enforcing.

Require MFA for administrators is the safety net for admin accounts, particularly useful if
you have not yet eliminated the legacy per-user MFA states.

Block legacy authentication works in conjunction with MFA enforcement. Legacy auth bypass is
the most common route attackers use to get around MFA requirements. Block it after you have
confirmed nothing critical depends on it.

## Report-only mode

Before enforcing any policy, deploy it in report-only mode. Report-only evaluates the policy
and logs what would have happened, without blocking anything. After two weeks in report-only,
check the sign-in logs filtered by the policy name. Look for users who would have been blocked.
Investigate legacy authentication hits. Identify the old system that sends automated reports
via SMTP AUTH before you turn it off.

This step prevents the 7:30 AM call about a broken integration on a Monday.

## The volunteer exception problem

Volunteers who access a Teams channel once a month from personal devices present a genuine
challenge. A Conditional Access policy requiring compliant devices would lock them out.

Options, in order of preference.

Require MFA only, with no device compliance requirement, for volunteer accounts with limited
access scope.

Named locations can reduce friction if volunteers always work from the same physical site.
You can configure that network as a trusted named location.

Separate guest accounts may be appropriate for volunteers with very limited access. B2B guests
with appropriately scoped access create less overhead to manage than full tenant members.

## What not to do

Do not create permanent exclusions for specific users or service accounts without a documented
review date. Exclusions accumulate. In two years you will have a list of twenty accounts
excluded from your MFA policy and no record of why.

If something legitimately cannot use Conditional Access, document it, set a review date, and
add it to your risk register. Known exceptions are manageable. Unknown exceptions are how
breaches happen.

## Related

- [MFA rollout](mfa.md)
- [Privileged access](privileged-access.md)
