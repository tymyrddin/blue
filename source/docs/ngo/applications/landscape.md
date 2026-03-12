# Mapping the application landscape

The first thing you need is a list. Not a perfect list. Not a complete list. A working list that
you can refine over time, that becomes more accurate with every conversation you have and every
incident you investigate.

You will not get this from a single document. You will get it from the ICT servicedesk ticket
history (what do people call for help with?), the finance department's purchase orders (what are
we paying for?), the application administrators (what do they manage day to day?), the Microsoft
365 Admin Centre (what OAuth consent grants exist, what apps have delegated permissions?), and
the network firewall logs (what are our systems actually talking to?).

## The categories you are mapping

Core productivity is M365: Exchange Online, SharePoint Online, Teams, OneDrive. Known.
Understood, mostly. The configuration may not be what you would choose, but the perimeter is clear.

The CRM or membership administration is the highest-value data store in the organisation.
200,000 records: names, addresses, donation histories, contact preferences, bank details for
direct debit mandates. Who has access to it? How is it backed up? Is it on-premise, SaaS, or
a hybrid? Who is the vendor, and where is the data hosted?

Possible candidates in the non-profit landscape include Salesforce NPSP, integrated ERP
platforms with CRM and HR modules, or a custom or legacy system that was built in 2009 and
works, so.

Financial systems may be integrated with the CRM or separate. The data flows between donation
records and financial bookings are worth mapping early because they are often undocumented and
fragile.

HR and planning needs 380 employees' worth of payroll, leave management, and scheduling
running somewhere. Are these systems integrated with Entra ID for provisioning? If not, every
joiner and leaver requires a manual action in each system.

Sector-specific software for organisations of this type covers requirements that generic ERP
does not. See the sector-specific page.

Collaboration and document management nominally lives in SharePoint, but rarely exclusively.
Look for shared drives on on-premise file servers, Dropbox or Google Drive used by specific
teams, Notion or Confluence wikis, and WhatsApp groups being used for operational coordination.
The last one is common. It is also a data governance issue.

## The output

A spreadsheet, per application, covering: application name, category, vendor, hosting location,
approximate number of users, data classification, whether Entra SSO is configured, the named
owner, and the date it was last reviewed.

This is not permanent documentation. It is a living baseline. Update it when things change.
Review it annually at minimum. Use it to answer the question where does donor data live before
someone external asks.

## Related

- [CRM and membership systems](crm.md)
- [Sector-specific applications](sector-specific.md)
- [Shadow IT](shadow-it.md)
- [Integration map](integration-map.md)
