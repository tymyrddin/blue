# Integration mapping

The integrations between systems are where the surprises live.

An integration that nobody documented, built by someone who has since left, connecting a
system that appears to be unused to another system that cannot be touched, transferring data
on a schedule that nobody remembers setting up. This is a real thing that you will find.
Possibly more than once.

## Why integrations matter for security

Every integration is a data flow. Every data flow is a potential exposure point. An integration
that passes donor bank details from the CRM to the financial system is doing something
important and sensitive. An integration that was set up for a one-off campaign in 2021 and
never disabled is doing something too, and you may not know what.

Integrations also create authentication complexity. They typically run as service accounts or
API keys with credentials that were set at creation and never rotated. Rotating them is on
a list somewhere. Those credentials may have broader permissions than the integration
actually requires. They may be stored in ways
that are not secure. They may not be subject to your MFA policies.

## Finding integrations

Entra ID under App registrations and Enterprise applications shows you what has been granted
OAuth permissions in the tenant. Some of these will be integrations. Some will be applications
that a user once clicked Allow on and never used again.

Power Automate flows are a common integration mechanism in M365 organisations and are
frequently created by end users rather than IT. They run as the account that created them,
which means they may be running as accounts of people who have since left, or with permissions
that have changed. Find them under the Power Platform Admin Centre.

The CRM, financial system, and HR system will each have their own integration configuration
showing what they are connected to. Talk to the application administrators for each.

Network firewall or proxy logs can reveal connections to external services that nobody
mentioned in the conversations.

## Documenting what you find

For each integration, record: the source system, the destination system, the data being
transferred, the frequency, the authentication mechanism (API key, service account, OAuth),
where the credentials are stored, who is the named owner, and when it was last reviewed.

This does not need to be elaborate. A spreadsheet is fine. The goal is to have a record that
means the next person does not have to rediscover everything from scratch, and that means you
can make an informed decision if you need to change or decommission one of the connected systems.

## Undocumented integrations: the risk register

Any integration you discover that cannot be clearly attributed to a current business need and
a named owner goes on the risk register. Not because it is necessarily a problem, but because
unknown things that move data between systems are exactly the kind of thing that causes
incidents that take a long time to diagnose.

## Related

- [Application landscape](landscape.md)
- [CRM and membership systems](crm.md)
- [Shadow IT](shadow-it.md)
