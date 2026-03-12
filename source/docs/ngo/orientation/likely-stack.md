# The likely shape of the infrastructure

You are reasoning from limited evidence. That is fine. A working hypothesis is more useful
than paralysis, as long as you hold it loosely and update it when facts arrive.

## Microsoft 365 as the core assumption

References to an ICT servicedesk, application administrators, and the general vocabulary of
the job posting strongly suggest a Microsoft 365 environment: Exchange Online, SharePoint
Online, Teams, OneDrive, and Entra ID as the identity plane. This is standard for non-profits
of this scale. Microsoft's non-profit programme makes M365 accessible at reduced cost, and
the resulting gravity means that once an organisation is inside the Microsoft ecosystem, most
subsequent decisions tend to follow.

The question is not whether M365 is there, as it almost certainly is. The question is what
state the tenant is in: how it was provisioned, whether the defaults have ever been reviewed,
and how consistently it has been configured across the years since it was first set up.

## Cloud, on-premise, or hybrid

M365 means cloud-hosted productivity. But it does not tell you whether servers exist
on-premise. An organisation with years of infrastructure history likely has at least some
on-premise systems: a file server, a legacy application, a network device that predates the
cloud migration, or a print server that nobody has touched because it still works.

The data residency question follows from the cloud assumption. M365 data is hosted in
Microsoft datacentres. The EU Data Boundary programme means EU-provisioned tenants can
have data processed within the EU, but this depends on when the tenant was created and which
workloads are in use. The answer requires a specific check, not an assumption. It matters
because 200,000 people's personal data is involved.

## The membership and CRM system

200,000 member and donor records have to live somewhere. An organisation of this scale
has almost certainly been managing these relationships for years: direct debit mandates,
donation histories, communication preferences, event attendance. This is not a spreadsheet
operation.

The likely candidates are Salesforce NPSP (widely adopted in the non-profit sector),
a Microsoft Dynamics implementation (plausible given an M365 environment and an easier
integration story), or a sector-specific membership administration tool of the kind built
for associations and membership bodies, with deep functionality for membership tiers
and contribution tracking and sometimes limited attention to modern authentication standards.
The job posting gave no specifics. The financial module question is also open: bookkeeping
may be in the same system or in a separate one.

## HR and payroll

380 employees require payroll processing, leave management, scheduling, and HR record-keeping.
A dedicated HR system is almost certainly in use. These systems are rarely integrated with
Entra ID for automated provisioning. If they are not, then every new employee and every leaver
requires a manual action in each separate system, and manual actions get missed. That is a
lifecycle risk and an ongoing operational overhead. It is worth establishing early whether
this integration exists, and if not, whether any compensating process does.

## Sector-specific software

The Home's operational work, intake records, care histories, case management, volunteer
coordination, placement tracking, is unlikely to be fully served by generic tools.
A niche vendor probably covers this: strong domain functionality, limited SSO support,
audit logging that is thinner than you would prefer, and a vendor who may not have thought
deeply about security. That is not unusual for specialist software in this category. It is a
risk to document and factor into the identity and access work, not a reason to panic.

## AI tools and Copilot

The explicit mention of responsible AI in the job posting places this organisation on the
early adoption curve: tools are being used informally, without a policy framework. Whether
that is Microsoft Copilot (which operates within the M365 compliance boundary and does not
send data to external models), consumer AI tools like ChatGPT (which do not carry the same
guarantees), or both, is unknown until you ask. The risk is specific: donor data, member
contact details, or sensitive case records entering a tool with opaque data handling and no
Data Processing Agreement.

## Related

- [Application landscape](../applications/landscape.md)
- [CRM and membership systems](../applications/crm.md)
- [The Entra ID audit](../foundation/entra-id.md)
- [Data residency](../data/data-residency.md)
