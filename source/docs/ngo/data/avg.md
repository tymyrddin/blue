# AVG obligations in practice

The AVG is not primarily a security regulation. It is a data protection regulation that
includes security as one of its requirements. The security architect's role in AVG compliance
is to ensure that the technical and organisational measures (technische en organisatorische
maatregelen) are appropriate for the data being held and the risks involved.

For a non-profit holding member, donor, and beneficiary data, the relevant obligations include:

Processing data on a lawful basis: for member data, this is usually the membership agreement
or legitimate interest. For marketing and fundraising communications, consent management
matters. This is primarily a legal and governance question, but the technical architecture
needs to support it: can the organisation demonstrate that it has consent records, that
it honours opt-outs, that data is not used for purposes beyond what was agreed?

Data minimisation: does the organisation hold only the data it needs? A membership database
that holds fields collected ten years ago for a purpose that no longer exists, or that holds
data about members' household members that was never necessary, creates AVG exposure.

Data subject rights: members and donors have the right to access their data, correct it,
and request deletion. Can the organisation respond to these requests? This requires knowing
where all the data about a given person lives, which is harder than it sounds when data is
spread across a CRM, an email marketing tool, a financial system, and possibly sector-specific
applications.

Security appropriate to the risk: for this volume and type of data, appropriate security
includes encryption at rest and in transit, access controls and MFA, audit logging, and
a breach notification process.

## The data protection officer

An organisation of this size processing this volume of personal data is likely required under
the AVG to appoint a Functionaris voor Gegevensbescherming (FG), a data protection officer.
If one is in place, your work as a security architect should be coordinated with them.
If one is not in place and should be, that is worth raising.

## Data Processing Agreements

Every vendor or service provider that processes personal data on behalf of the organisation
needs a Data Processing Agreement. This includes Microsoft (for M365 and Azure), the CRM
vendor, the email marketing platform, the HR system, the payment processor, any cloud service
that handles member or donor data.

Audit whether DPAs exist for each. A vendor without a DPA is a compliance gap. A DPA that
refers to data centre locations outside the EU for a system holding member data needs to be
understood and documented.

## The register of processing activities

The AVG requires a register of processing activities (verwerkingsregister). If one exists,
it should inform your application landscape work. If it does not exist, creating it is a
project that involves legal, HR, fundraising, and IT. The security architect's input is
on the technical side: where does the data live, how is it protected, who has access.

## Related

- [Data residency](data-residency.md)
- [CRM and membership systems](../applications/crm.md)
- [Incident response](incident-response.md)
