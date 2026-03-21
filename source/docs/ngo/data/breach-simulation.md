# The Fabulist Incident: a data breach tabletop

The most common route into a non-profit's data is not a sophisticated technical attack.
It is a convincing email to someone who is busy, followed by an attacker who moves quietly
for long enough to find what they came for. By the time the anomaly is noticed, the data
has left the building, the 72-hour GDPR clock is running, and the team is making consequential
decisions under pressure for the first time.

The Fabulist Incident is a tabletop simulation of exactly that situation. It is built around
the Home's actual applications, its actual regulatory obligations, and the actual decisions
its SIRT will face. It is run before a real incident, so that the first time the team
practices these decisions is not also the first time they matter.

## The scenario

Everything in this scenario is plausible. The techniques are real. The applications are
the ones the Home uses. The data involved is the data the Home holds. Participants are
asked to treat every decision as if it were real.

On Monday morning at 08:47, an email arrives in the IT coordinator's inbox. It appears to
come from support@fabulist-systems.com. The actual sending domain is fabulist-systerns.com,
with a Cyrillic r in place of the Latin r. The email explains that a critical security
vulnerability has been identified in [Bestiary 4.2.1](../applications/bestiary.md) and that the patch must be applied
before the next maintenance window to prevent data loss. It includes the correct Fabulist
Systems logo, the correct version number, and is signed by a name matching a real Fabulist
support contact whose details are on the Fabulist website. The email is busy. The IT
coordinator forwards it to Kevin with a note: "Can you check this and apply if it looks
right?"

At 09:23, Kevin clicks the download link. The file is a Windows executable presented as
a patch installer. Kevin's machine is running Defender. The executable uses a loader
technique that was tested against Defender last week and reaches the inbox cleanly. Kevin
opens it. The installer screen appears briefly, then closes. Kevin assumes it ran silently.
He does not report it.

Over the following thirty-six hours, an attacker operates from Kevin's machine under
Kevin's credentials. Kevin has local administrator access on the Bestiary server because
the Bestiary maintenance workflow requires it. The attacker connects to the server,
queries the Bestiary database, and exports the complete medical and case history records
for all current and former residents: 412 records, including species data, psychiatric
diagnoses, medication histories, and next-of-kin contacts, some of whom are themselves
mythological entities with complicated circumstances.

The attacker also checks Kevin's saved browser credentials and finds that Kevin's Covenant
password is identical to his Bestiary password, a coincidence that dates to the week
Covenant was onboarded and Kevin set both up at the same time. The attacker logs in to
Covenant from Kevin's machine and exports the full volunteer contact list: 340 names, home
addresses, personal email addresses, telephone numbers, and DBS check reference numbers
with expiry dates.

On Wednesday at 14:15, the IT coordinator notices an anomaly in the Entra ID sign-in
logs during a routine check: Kevin's account has authenticated from an IP address
registered in Romania at 03:14 on Tuesday, outside Kevin's normal working hours and
from a country Kevin has no business presence in. The IT coordinator checks the Bestiary
access logs and finds the export query. They check Covenant. They call the Head of IT.

It is now 14:47 on Wednesday. The question is when the organisation first became aware
of a personal data breach.

## The exercise

The tabletop runs for approximately two and a half hours with the SIRT members and anyone
else whose role would be involved in a real incident of this type.

A facilitator presents the scenario in stages, pausing after each stage for the team to
discuss and make decisions. The facilitator does not tell participants what the right
answer is. The decisions are recorded by the documentation lead. After the exercise, the
decisions are reviewed against what the runbooks require and what the GDPR obliges.

The stages correspond to the real phases of an incident response:

The first stage ends at Monday 09:23, immediately after Kevin opens the file. The
facilitator pauses: what, if anything, does the organisation have in place that would
detect this? The answer is almost certainly nothing, because the executable passed
Defender and Kevin did not report it. What would need to be in place for it to be
detected? This discussion produces the first set of improvements.

The second stage ends at Wednesday 14:15, when the anomaly is spotted. The facilitator
pauses: what is the first call? Who does the IT coordinator call and in what order? What
information do they have at this point and what do they not yet know? The team walks
through the escalation path from the SIRT structure.

The third stage presents the full picture as it is known at 14:47: the Bestiary export,
the Covenant export, the 36-hour dwell time, and the identification of the initial vector
as the phishing email on Monday. The facilitator poses the GDPR question: when did the
organisation become aware of a personal data breach? Is it Monday, when the phishing
email arrived? Tuesday at 03:14, when the attacker accessed Bestiary? Wednesday at 14:15,
when the anomaly was spotted? The 72-hour clock runs from the moment of awareness.
The team decides. The DPO speaks.

The fourth stage addresses containment. Kevin's accounts must be disabled, his machine
isolated, Bestiary taken offline, Covenant locked. In what order? What breaks when each
action is taken? Who authorises taking Bestiary offline, given that it is the primary
resident management system and the medical team depends on it? The team makes the call.

The fifth stage addresses notification. The data involved: 412 resident records including
psychiatric diagnoses and medication histories, and 340 volunteer records including DBS
reference numbers. Is this likely to result in a risk to the rights and freedoms of the
individuals? Almost certainly yes. Is it likely to result in a high risk requiring direct
notification to individuals? The team decides, with the DPO advising. The 72-hour clock
is running. The notification runbook is opened.

The sixth stage is the external communication question: what does management know and
when? What does the board know? Is the press a consideration? Is the Consortium notified,
given that some of the resident records may appear in the Great Ledger?

## The debrief

After all six stages, the facilitator leads a review of the decisions made against the
three documents that govern them: the SIRT structure, the breach response runbook, and
the GDPR notification runbook.

For each decision where the team diverged from the documented process, the question is
not why did you get it wrong but whether the process is right or whether the decision the
team made under pressure reveals something the documentation missed.

The output is a short list of improvements to the runbooks and the SIRT structure, a
confirmed contact list, and a team that has made the hardest decisions of a breach response
in conditions where the consequences of getting them wrong were limited to a slightly
uncomfortable afternoon.

## Building on this foundation

The Fabulist Incident covers the most common data breach pathway for organisations of the
Home's type: a spear-phishing attack using sector-specific context, credential reuse across
systems without SSO integration, a dwell time that produces regulatory ambiguity, and data
involving both sensitive personal records and third-party personal data.

Subsequent simulations can extend the same scenario in different directions. A ransomware
variant where the attacker encrypts the Bestiary server rather than exfiltrating it changes
the containment decisions and the notification calculus. A variant where the Covenant
export includes payment tokenisation data introduces a different notification threshold.
A variant where the breach is reported to the Home by an external party rather than
discovered internally tests the responsible disclosure intake process.

Each variant uses the same SIRT structure, the same runbooks, and the same applications.
The scenario changes. The foundation holds.

The [arrows and shields reference maps the attack patterns in this scenario to their
technical taxonomy](https://purple.tymyrddin.dev/docs/audits/supportive/arrows-shields.html) and to the controls that 
address them. The SIRT external documentation covers building out the team capability, metrics, and the responsible 
disclosure programme that would surface this class of vulnerability through external reporting.
