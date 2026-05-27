# The Home, established

By the time an organisation has reached enterprise scale, it has stopped worrying about some
things and started worrying about others. The question is no longer whether there is an IT
department, but whether it has enough people. The question is no longer whether a policy
exists, but whether anyone is checking that it is followed. The thing in the basement now
has a ticket in the asset register and a quarterly review. It is still not entirely clear
what it is, but it is documented. This is progress.

The Home at enterprise scale has multiple sites, a dedicated IT team, a data protection
officer with opinions, and a Microsoft 365 E5 licence obtained through a negotiation that
took long enough that two of the people involved in it have since retired. The infrastructure
is mature in the way that old buildings are mature: it has been patched and extended and
rebuilt in sections until it is not entirely clear which parts are original and which parts
were added when the east wing opened, but it stands.

## What the infrastructure looks like

The Entra ID tenant is governed. There are naming conventions for accounts, and they are
enforced. Guest accounts are reviewed quarterly by a person whose calendar includes a
reminder and who follows through on it. Privileged roles are assigned through Privileged
Identity Management, which means admins request elevation, the request is time-limited, and
there is an audit log. Global Administrator has two holders, both active, both named, and
neither of whom has used it since the last time there was a genuine emergency.

Conditional Access is comprehensive. There are policies for staff, policies for volunteers,
policies for partners, and a set of emergency exclusions that exist for documented reasons
and are reviewed every six months. Legacy authentication is blocked. The volunteer exceptions
are the most complicated part, because they always are, and they are documented in a way
that would survive the departure of whoever wrote the documentation, which is the real test
of documentation.

Microsoft Defender for Office 365 Plan 2 is configured and monitored. Alerts route to a
SIEM, which is not Microsoft Sentinel but is close enough to prompt a collegial disagreement
in the infrastructure committee every quarter. The SOC function is shared with a sector
partner, because a full internal SOC would require budget better spent on the creatures. The
arrangement works because the partner understands the sector and because the Home's internal
team is good at triage and good at explaining what they need.

The CRM is now integrated with Entra ID via SAML, after a project that took longer than
estimated and cost more than budgeted and is nonetheless considered a success by everyone who
uses it. The integration means joiners, movers, and leavers are handled through a single
process, which has reduced the number of ghost accounts from dozens to a number that can be
counted on one hand. The head of IT counts them during the quarterly access review with the
expression of someone who has learned to find satisfaction in small numbers.

## What this means for security

Enterprise scale does not mean enterprise immunity. The attack surface is larger, the data
is more valuable, the regulatory obligations are more complex, and the number of people who
need to be kept informed now includes lawyers, trustees, and occasionally journalists. The
security programme is no longer about building foundations. It is about maintaining something
that is already running and occasionally discovering that a wall you assumed was decorative
is in fact load-bearing.

The governance is formal. There are policies for acceptable use, AI adoption, data handling,
vendor assessment, and incident response. They are reviewed annually by people who have read
them. The incident response plan has been tested, not just written. The breach notification
process is understood by the people who would need to execute it at two in the morning,
because they have rehearsed it in conditions calm enough to learn from.

There is a DPO. The DPO has opinions. The opinions are correct approximately eighty percent
of the time and are always worth hearing. The register of processing activities is maintained
and not embarrassing. Data Processing Agreements are in place for all third-party processors.
The transfer impact assessments have been completed for the vendors that warranted them, and
the ones that did not warrant them have been documented as such, which is also a form of
governance.

## What this means for the people

The unwritten rules that sustained the Home through its early years are now written down,
most of them. Not all of them benefit from the transition. Mrs. Clodpull's two intake
questions remain unofficial policy, because some things should not be codified. The
spreadsheet has been formally retired but continues to exist, maintained by two members of
staff who do not discuss it with IT, kept available in case the CRM has a bad day.

The volunteers still confuse the helpdesk. The helpdesk has developed a patient tone and a
FAQ that addresses the twelve questions accounting for seventy percent of tickets. Kevin's
personal Gmail is no longer used for anything organisational, though the account itself
persists because Kevin never got around to deleting it and nobody is quite sure whose
responsibility that would be.

Gerald the troll no longer has access to the shared email. He did not notice, and has not
been in touch since, which is either reassuring or slightly concerning depending on how you
look at it.

The thing in the basement still gets the first bucket. Some things are not an IT problem,
and wisdom lies in knowing which.

## Where the work continues

Enterprise scale does not mean the work is done. It means the work has changed shape.

The quarterly access review cycle runs continuously. Every quarter: guest accounts
confirmed or removed, volunteer access checked against current roles, privileged identity
management activations audited, and the Bestiary account list cross-referenced against the
HR record. The first review of each year tends to surface something the previous three
missed. This is expected, and the point is to be unsurprised by it.

Annual policy review covers the acceptable use policy, AI adoption policy, data handling
policy, and the incident response plan. Review means someone with authority reads the
document, tests whether it reflects current practice, and signs off that it does or
schedules the update. Review does not mean the date on the front page changes. The
register of processing activities is updated at the same time.

DPIAs attached to ongoing processing activities have their own review cycle, determined
at the time of each assessment. The DPO tracks these. The IT function provides the
current technical picture when they come up: what the system does now, who has access,
what has changed since the last review.

The simulation programme runs monthly. The phishing simulation technique rotates. The
threat intelligence review happens before each cycle. At least once per year, the SIRT
runs a tabletop exercise, not necessarily the Fabulist Incident scenario, updated to
reflect what has changed in the environment and what has been learned from real incidents.
The post-incident review loop feeds back into both.

Vendor DPAs are reviewed when a vendor adds a materially new feature, changes their
infrastructure, or is acquired. The DPA register is not a filing cabinet. It is a living
document that reflects current processing.

The thing in the basement's quarterly review continues to produce the same result: species
unknown, arrangement ongoing, no action required. The IT manager has stopped writing
comments in the action required column. Some things document themselves.