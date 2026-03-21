# The attack surface

The IT manager's concerns about the AI proposals are not only about GDPR and data
protection. The business analyst's reading on adversarial machine learning covers a
separate category of risk: not what the model does with data by design, but what an
attacker can do with a deployed model that nobody has thought about as an attack surface.

For a fuller treatment of the ML attack taxonomy, see the
[ML attack surface reference](https://indigo.tymyrddin.dev/docs/ml/attack.html). What
follows maps those attack categories to the specific systems the Home is considering or
has already acquired.

## Membership inference against the donor model

The fundraising consultancy's donor propensity model is trained on 200,000 Covenant
records. Once deployed, the fundraising team queries it: enter a donor's details, receive
a propensity score. This is the intended use.

A membership inference attack works differently. An attacker who can query the model
submits carefully crafted inputs and observes the confidence of the outputs. Models tend
to return higher-confidence responses for individuals whose data was in the training set
than for those who were not. Through repeated queries, an attacker can determine whether a
specific individual is in the Home's donor database, without ever having direct access to
Covenant.

The model will be deployed with a web interface. That interface will almost certainly have
no rate limiting in its initial version, because nobody designing the fundraising tool
thought to ask about query volume as a security concern. A determined attacker making
thousands of queries will not trigger any alert.

The consequence: the donor database becomes queryable, indirectly, by anyone who can reach
the model's endpoint. For a celebrity, a politician, or a safeguarding case who is also a
donor and whose giving is confidential, this is a direct privacy breach.

## Data poisoning in the volunteer matching engine

The volunteer matching model will be trained on historical assignment data from the Burrow.
That historical data reflects the decisions of past coordinators about which volunteers
were assigned to which roles. Some of those decisions may have reflected the unconscious
preferences or biases of the people who made them: volunteers who got on well with a
particular coordinator assigned more often to visible roles, volunteers from certain
backgrounds assigned less often to positions of responsibility.

A model trained on that history learns from it. It does not learn that good matches are
good. It learns that the matches that were made in the past are good. The biases of the
previous coordinators become the model's logic, and the model reproduces them at scale
and with the appearance of objective scoring.

This is not an attack from an external adversary. It is the model behaving exactly as
intended, on data that was never audited for the patterns it encodes. The Burrow's
contents have never been reviewed for accuracy or for the accumulated assumptions of the
people who contributed to it over several years.

## Prompt injection into Bestiary Intelligence

Bestiary Intelligence processes resident case notes in natural language. Care staff write
notes. The module reads them. This creates a prompt injection surface.

Prompt injection works by embedding instructions in text that the model processes as part
of its input. A care note that contains, alongside legitimate clinical content, text
designed to be read as an instruction by the model can cause the model to behave
differently: returning information it should not, ignoring its safety constraints, or
generating outputs that serve the attacker's purpose rather than the carer's.

Resident case notes at the Home are written by care staff and volunteers. The notes are
not validated for content beyond basic length checks. An attacker who can contribute to
a resident's case notes, either through compromising a care worker's account or through
a more involved social engineering approach, can include injected instructions that the
Bestiary Intelligence module will process as legitimate input.

The surface is not hypothetical. It exists in any system that passes user-generated text
directly into a language model without sanitising it. Bestiary Intelligence, as described
in Fabulist Systems' announcement, does exactly this.

## Supply chain risk in the consultancy's model

The donor propensity model will be built by a consultancy using, in all likelihood, a
pre-trained foundation model from one of the major model repositories as a base. The
consultancy will fine-tune it on the Home's Covenant export and deliver the result as a
deployable artefact.

The delivered artefact will almost certainly be a serialised model file. Serialised model
files in common formats can execute arbitrary code when loaded, depending on the
serialisation library used. A model delivered in a format that exploits this property
would compromise the system running it the moment it is loaded. The IT coordinator will
be asked to deploy it. The IT coordinator will not know to ask about serialisation format
as a security property.

The risk compounds if the consultancy itself uses third-party models or libraries from
sources that have not been audited. The charity AI tooling ecosystem contains a number of
sector-specific pre-trained models whose provenance is unclear. A model that looks
legitimate, performs as advertised, and contains a backdoor activated by a specific
trigger input is indistinguishable from a clean model until the trigger is used.

## Model inversion and the communications archive

The AI image generation tool has been processing donor event photographs for three months.
The tool's terms allow inputs to be used for training. The photographs may already be
incorporated into the model's weights.

Model inversion attacks extract approximations of training data from deployed models
through repeated queries. The fidelity of what can be recovered varies, but for models
trained on identifiable photographs, the technique can recover images that are
recognisably similar to the source material. The people in those photographs did not
consent to their images being used this way, and the consent question under GDPR does not
become less relevant because the extraction requires technical expertise.

This is not a risk the Home can fully address retroactively. The photographs have already
been submitted. What the Home can do is stop submitting additional personal data to tools
whose terms allow input use for training, and inform the DPO of what has already happened.

## The common thread

The business analyst summarised it for the IT manager in a single observation: every one
of these risks exists because someone made a decision about an AI tool without asking what
happens to the data after the model is built, deployed, or queried. The GDPR questions and
the adversarial ML questions are the same question from two different angles. In both
cases, the answer requires thinking about the data as the attack surface, not just the
system that holds it.

The AI proposals are not going away. The departments have identified real operational
"needs". The IT manager and business analyst's job is not to stop them. It is to ensure that
when these systems are built or procured, the questions that nobody asked are answered
before the data leaves the building.

## Related

- [What the departments have in mind](ai-policy.md)
- [AI in vendor applications](application-governance.md)
- [SIRT structure](../data/sirt.md)
- [GDPR obligations](../data/gdpr.md)
