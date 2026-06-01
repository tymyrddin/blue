# About the Civil Observers' Society

![A secretive workshop hidden in a Victorian-steampunk city, glowing screens and mechanical contraptions everywhere](/_static/images/anvil.png)

The Civil Observers' Society is a legally endorsed, operationally independent volunteer organisation. It has
a charter, a code of conduct, a screening process for members, and a public record of every case it has
worked on. Its findings are disclosed openly when disclosure is complete. Its methods are transparent. Its
funding is not a line in any government budget.

It is not the Office of Civil Surveys. The name proximity has been noted by both organisations. The Office
has not requested clarification. This is taken as its own kind of answer.

## The legal basis

Jurisprudence in Ankh-Morpork, and in most of the territories where the Society operates, is consistent on
one point: if you address a societal need using appropriate methods, you are permitted to execute minor
intrusions to prevent more damaging ones. This is not a loophole. It is the legal foundation on which the
entire responsible disclosure framework rests.

The Society's approach qualifies. The Public Prosecution service has confirmed this. The city's CSIRT has
confirmed it. Neither has provided the Society with tasking authority, a budget, or a formal mandate. They
have provided something more durable: the assurance that the Society will not be prosecuted for the work
it was going to do anyway.

## What it does

The Society performs three functions that the Establishment cannot admit it performs, because performing
them would require legal and diplomatic frameworks the Establishment has not acknowledged needing.

It scans. At scale. The Society's scanning infrastructure operates continuously across internet-facing
systems, identifying vulnerable firmware, exposed services, and configurations that should not be public.
This range is published. System owners who want to avoid receiving the Society's notifications are invited
to allowlist the relevant IP range.

It finds. Vulnerabilities the Establishment cannot seek through official channels because seeking them would
require acknowledging offensive capability. Vulnerabilities in non-allied systems that the Establishment
cannot notify because notifying them would reveal sources and methods. The Society notifies everyone.
Vendor, CSIRT, affected operator, and the Office of Civil Surveys, as one recipient among many.

It records. Every case is tracked on a public register. The Society's case history is not operational
intelligence. It is an interpretive record: a transparent account of what was found, when, and what
happened after notification. This record is publicly searchable. The Office's use of it is not in the
Office's logbook.

## The charter and the conduct

Society membership requires a certificate of conduct. Members are screened. The screening is not the
Establishment's: it is the Society's own process, run under the charter, producing a determination about
whether a prospective member's judgment can be trusted with the Society's methods.

The charter's operating principle is "do no harm." This is not a slogan. It is the criterion against which
every scan, every probe, and every disclosure decision is evaluated. A method that risks harm to the system
being researched is not the appropriate method that jurisprudence requires. The Society polices this
boundary itself because no one else has the authority to do it on the Society's behalf.

Members are volunteers. Most hold professional roles in security, in research, or in institutions that do
not require them to identify their employer when contributing to the Society's work. The Society operates
because its members find the work interesting and believe that disclosure makes the digital infrastructure
safer. Both of these things are true. Neither cancels the other.

## The disclosure boundary

The Society decides what to scan. No one tasks it. The Establishment receives notifications as one recipient
among many, alongside the vendors, the CSIRTs, and the affected operators. What the Establishment does with
those notifications is the Establishment's operational matter.

What the Office of Civil Surveys does is not the Society's operational matter either. A Society finding that
appears two weeks later in an Office cyber advisory, attributed to "analysis of observed activity," has
travelled a path the Society does not document and the Office does not describe.

The Patrician's administration acts on Society findings with a consistency that constitutes operational
acknowledgment. The acknowledgment is not formal. The Society does not ask it to be. Asking would require
the Establishment to answer.

## The name

"Civil Observers' Society" was chosen. Whether the proximity to "Office of Civil Surveys" was noticed
before or after the choice was made is a question the Society's members answer differently depending on
the audience.

The confusion is occasionally inconvenient. More often it is useful, in the way that being mistaken for
something official tends to be useful when making enquiries of parties who might otherwise be unresponsive.
The Office has never issued a clarification. The Society has never requested one.

The Society uses the language of the trade because the trade uses real IP addresses.
Euphemism is for the Office. We have work to do.

## The Anvil

The Society's firmware research wing. The Anvil extracts artefacts from industrial control systems, smart
home devices, and embedded platforms using entirely passive and offline methods: banner strings, protocol
constants, web assets, certificates. These become fingerprints. The fingerprints are used to identify where
vulnerable firmware is deployed in the wild. Vulnerable operators are notified.

The Anvil does not touch live systems. What the firmware has already broadcast is sufficient.

## The Sceptical Engine

The Society's tooling arm. The Sceptical Engine is where the Society builds and maintains [vulnforge](https://github.com/tymyrddin/vulnforge): a local, air-gapped vulnerability scanner that uses AI
models to propose candidates and isolated code execution to verify them. The model proposes. The code
decides. Nothing leaves the host. Every step is recorded in a tamper-evident audit log.

The name was chosen deliberately. In an era when most AI tooling asks users to trust the model's
confidence, the Sceptical Engine is built around institutional distrust of that confidence. The model is
one subsystem in a larger system that does not defer to it.

This is the Society's research ethos expressed as an engineering principle.