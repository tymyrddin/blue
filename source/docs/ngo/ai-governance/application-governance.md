# AI in vendor applications

While the Home's departments were proposing new AI tools, the vendors of the Home's
existing applications were adding AI features to products already in use. Some of these
additions were announced. Some appeared in release notes. One was enabled by default
and was processing resident medical records for three days before anyone noticed.

None of them triggered a DPA review.

## Bestiary Intelligence

The full account of what happened when Fabulist Systems delivered their AI care module,
what it did to resident records during the three days it ran before the IT coordinator
noticed the default setting, and what the care worker's test session revealed about
prompt injection and an undocumented fine-tuning endpoint, is in
[Bestiary Intelligence](bestiary-intelligence.md).

The short version: cloud-based inference sending resident psychiatric and medication
records to a data centre on the Counterweight Continent, under a DPA written for on-premises processing,
discovered via a system prompt leak from a note that a locum care worker had apparently
used to test something they had read about in a professional development resource.

The DPA amendment is in negotiation. The module remains disabled.

## Covenant Donor Intelligence

Covenant's February release introduced Donor Intelligence in the release notes as an
analytics feature that "helps you understand your donors better and reach them at the
right moment." It was enabled by default on upgrade. The Home upgraded in March.

Donor Intelligence analyses donor behaviour patterns using Covenant data and generates
outreach timing recommendations. The analysis runs on Golem Trust Computing's infrastructure
in Ankh-Morpork. Whether this constitutes new processing under the existing DPA depends on
whether the DPA's definition of permitted purposes is broad enough to cover behavioural
modelling for marketing optimisation. Golem Trust Computing's legal team's position, provided
in an email that took three weeks to arrive, is that it does. The DPO's position is
that this is an interesting interpretation that she would like to discuss in more detail.

Donor Intelligence has been set to read-only mode pending the DPA review. The
fundraising team has noted that they found the recommendations useful and has asked
when it will be re-enabled. The IT manager has said he will let them know.

## The Great Ledger AI pilot

The Circle Sea Creature Welfare Consortium is piloting a species welfare scoring system
that uses AI to compare welfare outcomes across member organisations and generate
comparative assessments for use in sector reporting and policy advocacy.

The pilot is described as opt-in in the Consortium's communications. The Home was opted
in by default when the Consortium processed amendment two to the current data sharing
agreement, which the Home has not formally accepted. Amendment two includes the AI pilot
participation terms. The Home's welfare records, submitted through the Great Ledger
since the amendment was processed, have been included in the pilot dataset.

The DPO has submitted a formal opt-out request. Whether the data already processed under
the pilot can be removed from the training dataset is a question she has put in writing
to the Consortium's data protection contact. The Consortium has acknowledged the request.
Acknowledgement is not the same as completion.

The IT manager has added "formally accept or reject Great Ledger amendments before the
next renewal" to the list of actions arising from the AI governance review. It is
item seven. Items one through six are also from the AI governance review.

## The DPA register

The DPA register documents what personal data each vendor processes, under what
instructions, and on what legal basis. A register accurate at the time of creation
but not updated to reflect new processing activities (Covenant Events, Bestiary
Intelligence, Donor Intelligence, the Great Ledger AI pilot) is not a compliance
document. It is a historical record that creates the appearance of governance without
providing it.

Every AI feature added to an existing vendor application is a change to the processing
scope. The current position at the Home is that several AI processing activities are
running, or have run, under DPAs that were not written to cover them. The DPO is aware
of all of them. She is working through them in order of urgency, which is a longer list
than she expected to have at this point in the year.

## Related

- [Bestiary Intelligence](bestiary-intelligence.md)
- [What the departments have in mind](ai-policy.md)
- [The attack surface](ml-risks.md)
- [GDPR obligations](../data/gdpr.md)
- [Bestiary](../applications/bestiary.md)
- [Covenant](../applications/covenant.md)
- [The Great Ledger](../applications/great-ledger.md)
