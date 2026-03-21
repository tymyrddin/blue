# What the departments have in mind

The IT manager and business analyst spent a morning doing discovery conversations.
The framing was: we are trying to understand what is useful so we can support it, not
looking for rule violations. By lunchtime, the IT manager had filled most of a notepad
and had the expression of someone who has opened a door they cannot now close.

## The proposals

Five departments. Five proposals. Each one representing a genuine operational need,
and each one in a state that ranged from "concerning" to "already in production and
actively going wrong."

The fundraising team had found a consultancy offering a donor propensity model trained
on a full Covenant export. 200,000 records leaving the building with no Data Processing
Agreement and a delivery format that the IT coordinator would later install on the
fundraising server without knowing what a pickle file was. The full story is in
[Project Oracle](oracle.md).

The communications team had already been using an AI image generation tool for three
months. The terms allowed inputs to be used for model training. The communications
team had been uploading donor event photographs to improve the output's relevance to
the Home's aesthetic. The people in those photographs had not consented to their images
being used this way.

The Head of Programmes and Priya had a no-code ML platform, a plan to train a volunteer
matching engine on the Burrow's five-year scheduling history, and no knowledge of GDPR
Article 22 or of what the coordinator notes in the Burrow actually said about certain
groups of volunteers. The full story is in [Project Merlin](merlin.md).

The finance team had already signed up for a gift aid processing startup whose privacy
policy permitted use of "anonymised" data for model improvement, and whose anonymisation
of linked gift aid records with names, addresses, and HMRC references was an optimistic
interpretation of that word. The startup was subsequently acquired by a donor intelligence
company. The full story is in [the ClaimCraft incident](claimcraft.md).

HR had been running volunteer applications through a CV scoring tool for five months.
The tool's model card, which HR had not read, documented a statistically significant bias
against names associated with certain ethnic backgrounds. Three rejected applicants
submitted subject access requests. The full story is in [TalentScore](talentscore.md).

## What the AI policy needs to answer

An AI policy for the Home does not need to be long. It needs to answer, specifically and
unambiguously, the questions these five situations expose.

What AI tools can be used, and who approves new ones? The current answer is effectively
whoever decides to start using one, including on conference Wi-Fi. That needs to change.

What data can go into AI tools? Personal data belonging to members, donors, volunteers,
residents, and employees requires explicit approval before it enters any external AI
service, and a documented lawful basis for the processing. A trial account is still
live processing. A free tier is still a third party.

When is a data protection impact assessment required? For any AI system involving
profiling, automated decision-making, or large-scale processing of personal data, a
DPIA is not optional. The vendor's cheerful onboarding flow does not mention this
because it is not the vendor's obligation.

What technical documentation must be reviewed before deployment? Any AI system used
for decisions about individuals must have its model card, bias assessment, and data
handling documentation reviewed by the IT function and the DPO before the first
application is run. Not the first paid application. The first application.

What happens when something goes wrong? The breach notification process exists. The
AI incident process does not yet, but it needs to, because several of these situations
have already reached the threshold where it would have been used.

## The vendor side

The departments' proposals are not the only source of AI entering the Home's systems.
Fabulist Systems, Covenant, and the Great Ledger Consortium have all added AI features
to existing applications, some of which were enabled by default and none of which
triggered a DPA review. That story is in [AI in vendor applications](application-governance.md).

## Related

- [Project Oracle](oracle.md)
- [Project Merlin](merlin.md)
- [The ClaimCraft Incident](claimcraft.md)
- [TalentScore](talentscore.md)
- [Microsoft Copilot](copilot.md)
- [AI in vendor applications](application-governance.md)
- [The attack surface](ml-risks.md)
