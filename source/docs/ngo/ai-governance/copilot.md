# Microsoft Copilot: the relatively safe option, done right

Of all the AI proposals currently circulating at the Home, Microsoft 365 Copilot is the
one the IT manager and business analyst are least alarmed by. This is not because Copilot
is risk-free. It is because its risks are known, bounded, and addressable through work
that needs to happen regardless of Copilot.

[Microsoft 365 Copilot](https://learn.microsoft.com/nl-nl/copilot/) is a large language
model integrated into the M365 productivity tools. It can summarise documents, draft
emails, answer questions about content in the tenant, and generate reports from data it
has access to. Unlike the consultancy's donor propensity model or the no-code ML platform
Priya found, Copilot operates within the M365 compliance boundary. It does not train on
customer data. Data does not leave the tenant.

The critical phrase is: Copilot respects the permissions of the user running it. It will
surface content that the user can reach, and only that content. The sentence that follows
that one in most marketing materials is left unspoken: if your internal access controls
are messy, Copilot will enthusiastically expose the mess.

## What Copilot will find at the Home

The SharePoint environment at the Home is, by any reasonable assessment, messy. A
photograph from the Covenant onboarding session is stored in a folder with broad internal
access. That photograph contains the webhook secret for the Covenant event registration
integration, readable if you look for it. A staff member running Copilot and asking about
Covenant integrations will not necessarily find that photograph. But they might. And a
staff member asking Copilot to summarise everything in the IT documentation site might.

The salary information for staff is somewhere in SharePoint. The level of access on the
folder it lives in has not been audited recently. A Copilot query from a line manager
asking about team budget information could surface it, depending on the permissions state
at the time the query runs.

The case notes and shift records for the night shift team are discussed in Teams channels
whose membership was set up informally and has not been reviewed. Copilot surfaces Teams
content. The membership of those channels determines who can find what.

None of this is Copilot's fault. These are existing permissions problems. Copilot makes
them more visible and more accessible, which is why enabling Copilot without addressing
permissions first is not a responsible rollout.

## The permissions prerequisite

Before enabling Copilot for any meaningful number of users, the SharePoint sharing
defaults need to be reviewed and tightened, the sensitive sites (HR, finance, IT security
documentation) need explicit access controls verified rather than assumed, and the Teams
channel membership for anything containing resident or volunteer data needs to be audited.

The [SharePoint sharing work](../m365/sharepoint.md) is the specific prerequisite. It is
also work that needs to happen regardless of Copilot, for the same reasons it matters for
the Fabulist Incident postmortem, for GDPR compliance, and for the basic principle that
sensitive data should be accessible to people who need it rather than people who happen
to have been given access at some point and never had it reviewed.

## Data classification

Microsoft Purview sensitivity labels, applied to documents and sites, give Copilot
additional context about what it is handling. A document labelled Confidential can be
configured so that Copilot will not include its contents in responses to users who do not
have explicit access to that classification. For the Home, a four-label scheme is
sufficient: Public, Internal, Confidential (HR records, financial data, case files), and
Highly Confidential (anything that triggers GDPR obligations, including Covenant exports
and Bestiary records).

This does not need to be implemented for the whole tenant before Copilot is enabled for
anyone. A phased approach, starting with the highest-sensitivity sites and working
outward, is realistic.

## What Copilot is not

Copilot is not the donor propensity model. It does not profile individuals, make
predictions about behaviour, or train on data that leaves the tenant. The IT manager's
concerns about the fundraising proposal are different in kind from the concerns about
Copilot. The policy conversation about Copilot is about permissions and data
classification. The policy conversation about the donor propensity model is about lawful
basis, data minimisation, DPIA obligations, and whether the consultancy has a DPA that
covers what they are being asked to do.

These are different conversations. Treating them as the same problem produces a policy
that is too restrictive for Copilot and not restrictive enough for the consultancy.

## Related

- [What the departments have in mind](ai-policy.md)
- [AI in vendor applications](application-governance.md)
- [SharePoint and external sharing](../m365/sharepoint.md)
- [Data protection and GDPR](../data/gdpr.md)
