# Project Oracle: the donor propensity model

The Head of Fundraising came back from the Sector Digital Summit in a state of barely
contained excitement. Every session she had attended mentioned AI. Two of them specifically
mentioned donor propensity modelling. A consultant had stood on a stage in front of a
slide that read "STOP GUESSING, START KNOWING" and had explained that organisations
exactly like the Home were sitting on goldmines of behavioural data that a simple machine
learning model could turn into a list of exactly the right people to ask for exactly the
right amount at exactly the right time.

She emailed the IT manager from the train home. The subject line was: "Exciting
opportunity, would love your thoughts."

The IT manager had several thoughts. He did not share all of them in his reply.

## The consultancy

DataProphet Solutions described themselves as specialists in "AI-driven fundraising
intelligence for mission-driven organisations." Their website had a lot of photographs
of graphs pointing upward and a testimonials page featuring charities whose logos
the Head of Fundraising recognised. The proposal they sent was professional, detailed,
and entirely silent on data protection.

The project would proceed in three phases. Phase one: data extraction. The Home would
provide a full export of the Covenant database, including giving history, event
attendance, communication engagement scores, demographic indicators, and relationship
manager notes. Phase two: model training. DataProphet would build and validate the
propensity model on their infrastructure. Phase three: deployment. The trained model
would be delivered back to the Home as a deployable artefact for the fundraising team
to query.

The proposal did not specify which country DataProphet's infrastructure was located in.
The proposal did not include a Data Processing Agreement. The proposal did not mention
the words "data protection impact assessment" at any point in its fourteen pages. It did
include a very attractive graph showing projected major gift conversion uplift.

The Head of Fundraising forwarded the proposal to the IT manager with the message:
"What do you think? I think we should do this."

## Data extraction

The Covenant export took the IT coordinator forty minutes to configure and run. It
produced a CSV file containing 200,000 rows and 47 columns, including full names,
email addresses, giving histories going back eleven years, home addresses, postcode-based
wealth indicators, event attendance records, and the free-text notes field where
relationship managers had written observations about donors over the years.

The notes field had not been reviewed before the export. Some of the notes were
professional assessments. Some of them were the kind of informal observations that people
write when they do not expect them to leave the building. One note, written in 2019 by
a relationship manager who had since moved on, described a major donor's personal
circumstances in considerable detail, including information the donor had shared in
confidence during a difficult period. The note was not flagged for removal before the
export. Nobody thought to check.

The CSV left the building in an encrypted zip file attached to an email. The password
was in a separate email. Both emails went to accounts@dataprophet.co.uk. The DPO found
out when she asked the IT manager, three weeks into the project, whether a DPIA had been
done. The IT manager said he had raised concerns. The Head of Fundraising said she had
understood the concerns had been addressed. The DPO asked to see the DPA. There was
not one.

## Model training and the pickle file

DataProphet delivered the trained model six weeks later. The delivery email was cheerful.
The model had performed well in validation, with an [AUC of 0.81](https://towardsdatascience.com/roc-auc-explained-a-beginners-guide-to-evaluating-classification-models/) and strong lift in the
top two deciles. The email included a PDF of results charts and a zip file containing
the deployment package.

The deployment package contained, among other things, a Python script and a model file
in a format that the IT coordinator had not encountered before. The format was pickle.
Pickle files are a Python serialisation format that executes code on load. A pickle file
from an untrusted source is, in the technical literature, described as a known arbitrary
code execution vector. DataProphet was a trusted partner in the sense that the Home had
paid them. They were not a trusted source in the sense that anyone had audited their
build pipeline, reviewed their development practices, or verified that the file had
not been tampered with in transit.

The IT coordinator ran the deployment script on the fundraising reporting server because
that was where the Head of Fundraising wanted it, and because the instructions said to.
The script ran without errors. The model loaded without errors. The fundraising team
was delighted.

## In production

The model was operational for eight months before anything visibly went wrong. During
those eight months it was used exactly as intended, generating propensity scores for
the fundraising team's major gifts pipeline and improving the targeting of high-value
asks. The Head of Fundraising presented results at a board meeting. The graph was
very similar to the one on DataProphet's website.

The model's query interface had no authentication beyond a password shared across the
fundraising team, and no rate limiting, because those were not in the original
specification and adding them after the fact had not come up as a priority.

The business analyst noticed the anomaly in the fundraising server's access logs during
a routine review six months in. Something had been querying the model's API endpoint
approximately eight hundred times per day for the past three weeks, submitting slightly
varied versions of the same donor record. The queries were coming from an IP address in
the Netherlands registered to a cloud hosting provider. The queries had no result because
the IP was not authenticated. But the response times were different for queries that
matched training records and queries that did not, by a consistent margin of several
milliseconds.

This is membership inference. The model was leaking information about who was in the
training data through the timing of its responses. Someone had noticed this property and
was systematically querying it. Whether they wanted to know if a specific public figure
was a donor, whether they were building a list of the Home's supporters for a commercial
purpose, or whether they were simply a researcher who had found an unprotected endpoint
and was satisfying their curiosity, was not immediately clear.

The fundraising server was also, the business analyst discovered during the same review,
running a process that had been introduced by the deployment script and that had nothing
to do with the propensity model. The process was small and quiet. It ran at intervals.
The business analyst showed it to the IT manager. The IT manager looked at it for a
long time without saying anything. Then he picked up the phone and called the DPO.

## The reckoning

DataProphet's contract did not include an incident response clause. DataProphet's response
to the IT manager's email was that the file had been generated from their standard
deployment pipeline and that to their knowledge it was clean. They offered to send an
updated version. The IT manager declined.

The process was removed. The server was rebuilt from a clean image. The propensity model
was taken offline. The Head of Fundraising asked when it would be back. The IT manager
said he would let her know.

The DPO opened two files: one for the data transfer to DataProphet without a DPA, and
one for the potential personal data compromise arising from the anomalous process. The
[GDPR notification runbook](../data/runbooks/gdpr-notification.md) was opened for the first 
time outside a simulation.

The business analyst updated the AI policy proposal with a new section on model
provenance and serialisation format requirements. It was the most specific and most
unwelcome addition to the document.

## Related

- [What the departments have in mind](ai-policy.md)
- [The attack surface](ml-risks.md)
- [GDPR notification runbook](../data/runbooks/gdpr-notification.md)
- [Covenant](../applications/covenant.md)
