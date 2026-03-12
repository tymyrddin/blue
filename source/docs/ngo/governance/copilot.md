# Microsoft Copilot

If the organisation is considering [Microsoft 365 Copilot](https://learn.microsoft.com/nl-nl/copilot/), or if licences have been acquired
and rollout is being planned, the security and governance work that needs to happen first
is not primarily about Copilot. It is about the M365 environment that Copilot will operate in.

Copilot is a large language model integrated into the M365 productivity tools. It can
summarise documents, draft emails, answer questions about content in the tenant, and
generate reports from data it has access to. The critical phrase is:
"Copilot respects the permissions of the user running it. It will surface content that
the user can reach, and only that content."

The real risk sentence usually lurking behind that marketing line is: “If your internal access controls 
are messy, Copilot will enthusiastically expose the mess.”

This is correct behaviour. It is also the reason why overly permissive SharePoint settings,
broadly shared OneDrive files, and Teams channels with wider membership than the content
warrants, all become visible problems the moment Copilot is enabled.

## The permissions prerequisite

Before enabling Copilot for any meaningful number of users, check:

- SharePoint sharing defaults and whether Any organisation member links are used widely.
If a document library is accessible to everyone in the organisation, Copilot will be able
to surface its contents for everyone in the organisation. That may be fine. Or it may mean
that the list of salaries that HR stored in a broadly shared SharePoint site is now findable
via a natural language query.
- Teams channel membership and whether any sensitive discussion has been happening in channels
with broader membership than the sensitivity warrants.
- OneDrive default sharing and whether users have been sharing files broadly without realising.

This is not new risk created by Copilot. It is existing permissions risk that Copilot makes
more visible and more accessible. Fix the permissions. Then enable Copilot.

## Data classification as a foundation

Microsoft Purview sensitivity labels can be applied to documents, emails, and sites. Documents
labelled as Confidential or Highly Confidential can have access controls applied that restrict
who can open them, regardless of where they are stored. If the organisation is planning a
Copilot rollout, a basic sensitivity labelling scheme is a sensible precursor.

For a non-profit, a four-label scheme is usually sufficient: Public (what can be shared
externally without restriction), Internal (general internal use), Confidential (restricted
to relevant teams, such as HR documents, financial records, case files), and Highly
Confidential (donor payment data, sensitive case information, anything that triggers GDPR
obligations).

## The rollout conversation

Copilot licences are not cheap. Whether to purchase them for the whole
organisation or a specific subset of users is a business and budget decision. The security
input to that decision is: the environment is only ready for Copilot when the permissions
and data classification work is done. Rolling out Copilot into an ungoverned SharePoint
environment with broad external sharing defaults and no sensitivity labels is not responsible
use of the technology.

## Related

- [AI policy](ai-policy.md)
- [SharePoint and external sharing](../m365/sharepoint.md)
- [Data protection and GDPR](../data/gdpr.md)
