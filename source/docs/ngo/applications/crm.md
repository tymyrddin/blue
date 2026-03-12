# CRM and membership administration

The CRM is the crown jewels. Handle accordingly.

200,000 names, addresses, email addresses, donation histories, bank account numbers for SEPA
direct debit mandates, communication preferences, and perhaps medical or dietary information for
event attendees. All of it regulated under GDPR. All of it attractive to data brokers, fraud
actors, or anyone who wants a warm mailing list of committed donors.

## What you need to find out

Before you can assess or improve the security posture of the CRM, you need answers to a handful
of questions.

Where does the data live? The options are an on-premise database server on your own hardware,
a SaaS platform where the data lives with the vendor, or a hybrid arrangement. The GDPR
requires a Data Processing Agreement with any vendor who processes personal data on your behalf.
Check whether one exists and whether it is current.

Who has access, and is it current? Map the access levels across fundraising and donor relations
staff, finance, management, application administrators, and former staff who may still be active
in the system.

How is it authenticated? Local accounts with passwords managed in the CRM itself is common and
problematic. SAML or SSO integrated with Entra ID is better because account lifecycle is then
managed centrally. API keys or integration accounts with broad access need to be inventoried.

What integrates with it? The CRM does not stand alone. It probably receives data from donation
forms on the website, sends data to the financial system, exports to the email marketing tool,
and has at least one integration built for a campaign three years ago that is still quietly
running. Map these before you touch anything.

## Common CRM scenarios

Salesforce NPSP has strong non-profit features and is widely adopted internationally. Data is
hosted in Salesforce infrastructure. Check which region your org is in because EU orgs can be
provisioned in EU data centres, but this is not automatic. Entra ID SSO via SAML is well
supported and should be configured if it is not. The Salesforce permission model is complex
and a permission audit is worthwhile.

Other CRM platforms with non-profit tiers or sector focus exist; the questions are the same
regardless of platform: where is the data, how is authentication handled, what integrates with
it, and does a current DPA exist with the vendor?

Sector-specific or custom systems built for specialist membership administration may have
limited SSO support, legacy authentication requirements, and minimal audit logging. Document
these limitations and factor them into your risk assessment.

## The questions to answer in the first month

Where is the data, including the country, the vendor, and the data centre if known? Does a
valid Data Processing Agreement exist with the vendor? Who has admin access and is it current?
Is the CRM integrated with Entra ID for SSO? What integrations exist, documented or otherwise?
When was it last backed up and has the backup ever been tested?

These answers do not need to lead to immediate changes. They need to lead to a risk assessment
and a prioritised list of what to address first.

## Related

- [Application landscape](landscape.md)
- [Data protection and GDPR](../data/gdpr.md)
- [Integration mapping](integration-map.md)
