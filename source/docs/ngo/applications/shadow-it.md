# Shadow IT

Shadow IT in a non-profit is rarely malicious. It is almost always the result of someone
having a problem, finding a free tool that solved it, and not thinking too hard about what
happened to the data they put into it.

The fundraising team that coordinates campaigns in a shared Trello board because the internal
project tool is cumbersome. The communications team that uses WeTransfer to send large files
to external partners because SharePoint sharing is confusing. The volunteer coordinator whose
entire operation runs through a WhatsApp group because that is where the volunteers are.
This last one is simultaneously a data governance problem and completely understandable,
which is the most common kind of problem in this sector.

These are the conversations you will have. They are not about bad intentions. They are about
tools that filled a gap that the official landscape left open.

## Finding it

The Microsoft 365 Admin Centre under Cloud App Security or Defender for Cloud Apps (depending
on your licencing) can show you what cloud services your users are accessing. If you have
Defender for Endpoint deployed on managed devices, this is more complete. If not, network
firewall or proxy logs will give you a partial picture.

The more reliable method is talking to people. Ask teams what tools they actually use. Ask the
servicedesk what people call about. Ask the finance team what subscriptions show up on the
credit card statements. You will learn more in a week of conversations than in a month of log
analysis.

## What to do with it

Not everything you find needs to be shut down. The question for each shadow IT instance is
whether the data involved justifies the friction of migration, and whether there is a supported
alternative that people will actually use.

A team using Notion for internal documentation with no personal data involved is a different
risk from a team using a free online survey tool to collect member contact details. Calibrate
your response accordingly.

For anything that touches personal data of members, donors, volunteers, or employees, the
calculus changes. A free tool with no Data Processing Agreement is not compliant with GDPR
regardless of how convenient it is. That is not a negotiation: it is a legal obligation.

## Making the official alternatives usable

The most effective long-term remedy for shadow IT is making the official alternatives less
terrible. If people are using WeTransfer because SharePoint external sharing requires twelve
steps and a phone call to IT, fix the SharePoint external sharing process. If people are using
WhatsApp because Teams notifications are unreliable, fix the Teams notification configuration.

You will not eliminate shadow IT by policy alone. You will reduce it by closing the gaps
that made people reach for something else in the first place.

## Related

- [Application landscape](landscape.md)
- [Integration map](integration-map.md)
- [Data protection and GDPR](../data/gdpr.md)
