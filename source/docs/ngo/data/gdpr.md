# GDPR obligations in practice

The GDPR is not primarily a security regulation. It is a data protection regulation that
includes security as one of its requirements. For the Home, that distinction matters
because the obligations extend well beyond what the security architect controls: lawful
basis, consent records, data minimisation, data subject rights, and a register of
processing activities are all legal and governance questions that need the DPO, legal
counsel, and senior management. The security architect's specific contribution is to the
technical and organisational measures: knowing where the data lives, ensuring appropriate
access controls and encryption, making breach detection and notification feasible, and
surfacing the gaps that the legal and compliance functions need to address.

## What the Home is obliged to do

Personal data must be processed on a lawful basis. For the 200,000 members and donors in
Covenant, the lawful basis is typically the membership or donation relationship, or
legitimate interests. For marketing communications, consent management matters: can the
Home demonstrate that it holds consent records, honours opt-outs, and does not use data
for purposes beyond what was agreed? The technical question is whether Covenant's
preference management is configured correctly and whether it is synchronised with Brevo,
where high-volume email campaigns are sent. The previous incident in which suppressed
addresses received communications suggests the synchronisation deserves attention.

Data minimisation asks whether the Home holds only the data it needs. Covenant holds
fields collected since the system was onboarded, some of which may reflect data collection
practices from earlier periods. The volunteer notes field in Covenant and in the Burrow
accumulated content that was never intended as a permanent record. Bestiary holds records
for all residents since the system was installed eleven years ago, including those who
have been rehomed or have died, which the mythological heritage protection framework
requires but which still warrants periodic review of what is held and why.

Data subject rights give members, donors, volunteers, and residents the right to access
their data, correct it, and request deletion. Responding to a subject access request
requires knowing where all data about a given person lives. For a member who is also a
volunteer and who attended a sponsored event, that data may be in Covenant, in the Burrow,
in the email marketing platform, in the finance system, and possibly in Sendstone transfers
that are now deleted from the service but may still exist in recipients' downloads. The
register of processing activities, described below, is the map that makes these requests
answerable in a reasonable time.

Security appropriate to the risk is the obligation most directly within the security
architect's scope. For the volume and sensitivity of data the Home holds, including
resident medical records in Bestiary and 200,000 supporter records in Covenant, appropriate
security includes encryption at rest and in transit, MFA enforced on accounts with access
to sensitive systems, audit logging that supports breach detection and post-incident
investigation, and a documented breach notification process. The Fabulist Incident
simulation is designed precisely to test whether that process works before it needs to.

## The DPO

An organisation of this size processing this volume of personal data is required under the
GDPR to appoint a Data Protection Officer. The DPO is not a member of the IT function and
does not report to the Head of IT. Their independence is a legal requirement. The security
architect coordinates with the DPO: the DPO
advises on obligations, the architect implements the technical measures that support
compliance. When those two perspectives conflict, the conflict is worth surfacing explicitly.

The DPO's involvement in incident response is immediate and non-optional from the moment
personal data is at risk. The SIRT structure reflects this.

## Data Processing Agreements

Every vendor or service provider that processes personal data on behalf of the Home needs
a Data Processing Agreement. The agreement establishes what data the processor handles,
under what instructions, in what locations, and with what security obligations. Without
a DPA, the processing is unlawful regardless of whether the vendor is reputable.

The current DPA landscape at the Home has gaps. Covenant has a DPA, signed at onboarding,
which may not reflect the scope added when Covenant Events was enabled. Fabulist Systems
has a DPA for Bestiary, though the version in force should be confirmed given that the
support contract has been renewed with price increases but no documented DPA review. The
Consortium's data sharing agreement for the Great Ledger covers the member organisations'
obligations but the two amendments issued since the Home signed the current version require
formal acceptance that has not been confirmed.

Brevo has a DPA available under its EU terms. The payment processor has a DPA. Microsoft
has a DPA covering M365 under the Microsoft Products and Services Data Protection Addendum.
For M365 tenants provisioned in EU regions, Microsoft's EU Data Boundary commitment covers
the storage and processing of data from core services including Exchange, SharePoint, Teams,
and OneDrive within the EU and EEA. Verify the Home's tenant region in the Microsoft 365
admin centre under Settings, then Organisation profile, then Data location.

The Burrow has no DPA because it is a personal Notion account. Sendstone has no DPA
because it requires no account and the Home has no contractual relationship with the
service. The Coven has no DPA because it is a consumer messaging application used on
personal devices. These are not acceptable arrangements for processing the personal data
they currently hold. The DPO has been informed of the Burrow. The Sendstone and Coven
situations require the same conversation.

## The register of processing activities

The GDPR requires the Home to maintain a register of processing activities documenting
what personal data is processed, for what purpose, on what lawful basis, in what systems,
with what retention period, and with what security measures. If a register exists, its
accuracy is worth testing against the application landscape as it is now. If it does not exist, creating it is a project
involving legal, HR, fundraising, and IT, with the security architect contributing the
technical picture: where does the data live, how is it protected, who has access.

The register is also the document that makes subject access requests and deletion requests
answerable, that informs the DPA audit, and that the supervisory authority will ask for
in the event of an investigation. Keeping it current is maintenance, not a project.
Treating it as a project that will be done once and then exist is the reason most registers
are out of date within a year of being created.

## Related

- [SIRT structure and roles](sirt.md)
- [Breach simulation](breach-simulation.md)
- [GDPR notification runbook](runbooks/gdpr-notification.md)
- [Covenant](../applications/covenant.md)
- [Bestiary](../applications/bestiary.md)
- [The Great Ledger](../applications/great-ledger.md)
- [The Burrow](../applications/the-burrow.md)
Last updated: 09 July 2026
