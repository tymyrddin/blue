# AI vendor assessment checklist

Five incidents. Five questions that were not asked before they became problems. This page
collects them into a checklist the IT function and DPO work through before any AI tool
is deployed or any trial account is created. Not the first paid use. The first use.

The checklist does not guarantee a safe outcome. It guarantees that the questions were
asked and the answers were documented. That is what accountability requires.

---

## Data governance

**What personal data will this system process?**
Name the categories: donor contact details, volunteer records, resident medical histories,
employee data, financial records. If the answer is none, note it and confirm it during
the vendor review. If the answer is any of the above, the remaining questions apply.

**What is the lawful basis for processing?**
Identify the GDPR Article 6 basis and, for special category data, the Article 9 basis.
Legitimate interests requires a documented LIA. Consent requires a consent record.
A trial account is still live processing and still requires a lawful basis.
[Relevant: Oracle, Merlin, TalentScore]

**Is a data protection impact assessment required?**
Required for any system that profiles individuals, makes or supports automated decisions
with significant effects, or involves large-scale processing of personal data. The vendor's
onboarding flow does not mention this because it is not the vendor's obligation.
[Relevant: Merlin, TalentScore]

**Is a Data Processing Agreement in place before data is transferred?**
The DPA names the processor, the data categories, the processing purposes, the sub-
processors, the data residency, and the security obligations. A DPA signed at initial
onboarding may not cover new processing activities added later. The DPA column in the
asset register reflects the current scope, not the original contract.
[Relevant: Oracle, ClaimCraft, Bestiary Intelligence]

**Does the DPA name sub-processors and their data locations?**
Cloud-based inference commonly involves sub-processors in jurisdictions outside the EEA.
Standard Contractual Clauses cover the transfer in principle. Whether the SCCs are
current, correctly executed, and actually in place is a separate question. Ask for the
SCCs and check the date.
[Relevant: ClaimCraft, Bestiary Intelligence]

---

## Model governance

**Has the model card been read?**
Not skimmed. Read. The fairness and bias assessment section, the known limitations
section, and the version history. If the vendor does not publish a model card, ask
for equivalent technical documentation. If the vendor declines, that is an answer.
[Relevant: TalentScore]

**Does the model's bias assessment identify differential outcomes for protected
characteristics?**
If it does, the assessment is honest. Review what the bias is, whether mitigations are
in place and verified, and whether the Home's specific use case is in the affected
category. Ongoing mitigation efforts are not the same as resolved mitigation efforts.
[Relevant: TalentScore, Merlin]

**What serialisation format is the delivered model artefact in?**
Certain formats, including Python pickle files, execute code on load. A delivered model
in such a format from a vendor whose build pipeline has not been audited is a code
execution risk. Ask for the format explicitly. Ask for
a hash to verify the file has not been modified in transit.
[Relevant: Oracle]

**What data was used to train the model, and does the Home's data contribute to it?**
Training data that includes the Home's personal data requires a lawful basis and
documentation. Vendor terms that permit use of "anonymised" data for model improvement
require scrutiny: anonymisation of linked records with sufficient quasi-identifiers is
not what the word usually implies.
[Relevant: Oracle, ClaimCraft, Bestiary Intelligence]

---

## Operational governance

**Does the deployed system have authentication controls appropriate to the data it
accesses?**
A model endpoint with no authentication beyond a shared password, and no rate limiting,
is queryable by anyone who can reach it. Membership inference attacks work precisely
against such endpoints, allowing external parties to determine whether specific individuals
appear in the training data through systematic querying.
[Relevant: Oracle]

**Are audit logs available and reviewed?**
Logs covering who queried the system, from which IP address, at what time, with what
inputs and outputs, are the minimum required to detect misuse. If the vendor does not
provide query logs, that is a gap. If the Home's own infrastructure does not log access
to the deployed model, add it.
[Relevant: Oracle]

**Does the system process user-generated text?**
Any system that passes staff-written notes, emails, or case records into a language model
creates a prompt injection surface. An attacker who can write into the input, through a
compromised account or a social engineering approach, can embed instructions that the
model will process as legitimate. Validation and sanitisation of text inputs before they
reach the model reduces, but does not eliminate, this risk.
[Relevant: Bestiary Intelligence]

---

## Vendor governance

**What happens to the Home's data if the vendor is acquired?**
The acquisition clause in the vendor's terms determines whether customer data transfers
to the acquiring entity and under what conditions. If the clause is permissive, consider
whether that is acceptable given the data involved. An acquisition by a data analytics
company changes the risk profile of a relationship with a gift aid processing startup.
[Relevant: ClaimCraft]

**Has the vendor's DPA vacancy been checked?**
A vendor processing personal data without a Data Protection Officer in post, in a
jurisdiction where one is required, is a compliance signal. It is not definitive, but it
is worth noting.
[Relevant: ClaimCraft]

**Is there an incident response clause in the vendor contract?**
If the vendor's system is involved in a data breach, what are their notification
obligations to the Home, and within what timeframe? A contract without an incident
response clause leaves the Home dependent on the vendor's goodwill when it most needs
something more reliable.
[Relevant: Oracle]

---

## Before signing off

The IT function and the DPO both review the completed checklist. Items marked unknown
require follow-up before deployment. Items marked not in place require a
documented decision: accepted risk with a review date, or deployment blocked until
resolved.

The checklist is filed in the DPA register alongside the contract and the DPA. It is
reviewed when the vendor adds a materially new feature, changes their infrastructure,
or is acquired.
Last updated: 10 July 2026
