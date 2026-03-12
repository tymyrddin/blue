# Data residency

Where data physically lives has legal, contractual, and reputational dimensions for a
non-profit. The question comes up most often in relation to Microsoft 365, but it applies to
every SaaS tool that holds personal data.

## The Microsoft 365 position

Microsoft's EU Data Boundary is a commitment to store and process data from EU and EEA
customers within the EU and EEA. This covers M365 core services including Exchange, SharePoint,
Teams, and OneDrive for tenants provisioned in EU regions.

The default tenant region for an organisation onboarding to M365 should be the EU, but
it is worth verifying. Check the Microsoft 365 Admin Centre under Settings, then Org settings,
then Organisation profile, then Data location.

The EU Data Boundary does not mean that no data ever crosses EU borders. Some support and
service operations may involve access from outside the EU. Microsoft publishes documentation
on what is and is not covered. For most purposes, a non-profit operating under a standard M365
agreement with an EU tenant and a current DPA with Microsoft is in a defensible position.

## The Azure question

If the organisation uses Azure services (beyond what is embedded in M365), the data residency
of each resource is determined by the region it is deployed in. Azure West Europe and North
Europe (Ireland) are both EU. If any Azure resources are deployed in US regions, that needs
to be reviewed against the data they process.

## SaaS applications

For each SaaS application in the landscape, the data residency question is: in which country
or countries does the vendor store and process the data?

This is not always easy to find out. Vendor documentation is sometimes vague. DPA templates
from smaller vendors sometimes list multiple countries without specifying which data goes where.
For high-risk applications (the CRM, the financial system, HR), the question is worth pressing.

EU-based vendors may offer a clear and straightforward data residency answer. US-based SaaS
vendors with EU data centre options offer a more complex answer that depends on configuration
and the specific service. Consumer AI tools without enterprise DPAs offer no acceptable answer
for personal data.

## What to do with the information

The output of the data residency audit is not necessarily a list of things to change. Some
data in US data centres may be acceptable under the circumstances (standard contractual
clauses, Schrems II compliant transfer mechanisms, low sensitivity of the data). Other cases
may require migration or renegotiation.

Document what you find. Classify each case: compliant, potentially compliant with caveats,
or a gap that needs addressing. Give the gaps to the data protection officer or legal counsel
to assess. Your role is to surface the technical picture, not to make the legal determination.

## Related

- [GDPR obligations](gdpr.md)
- [CRM and membership systems](../applications/crm.md)
- [Application landscape](../applications/landscape.md)
