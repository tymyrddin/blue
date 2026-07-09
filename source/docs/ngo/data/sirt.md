# Building a lean SIRT

The Home does not have a security operations centre. It has an IT coordinator, a Head of IT,
a data protection officer, and a small number of people in legal, HR, and senior management
who need to be involved when something goes wrong. That is enough to build a functioning
Security Incident Response Team, provided the roles are defined before an incident rather
than during one.

A lean SIRT does not require dedicated headcount. It requires that the people who will
respond to an incident know in advance that they will respond to it, know what their role
is, know who to call, and have practiced the decisions they will be asked to make under
pressure. The practice is what this section is building toward.

## Roles at the Home

These map to the essential SIRT roles described in the external SIRT guidance, adapted for
the Home's scale-up state. One person may hold more than one role for minor incidents.
For a significant breach, all roles should be covered by separate people.

The incident lead owns the response from detection to closure. They make the escalation
calls, authorise emergency containment actions, brief the board, and own the post-incident
review. At the Home, this is the Head of IT for technical incidents. For incidents with
significant legal or reputational dimensions, it may escalate to the Director.

The technical lead investigates what happened. They follow the forensic trail, assess
the scope of compromise, determine what data was accessed, and implement containment.
At the Home, this is the IT coordinator, with Kevin as the first point of operational
support. For incidents beyond the team's technical capacity, this role calls the retained
external incident response firm.

The communications lead manages what is said and to whom. During a confirmed breach, the
timeline of what was communicated to staff, management, the supervisory authority, and
affected individuals becomes part of the legal record. At the Home, this is the Head of
Communications, briefed by the incident lead, with the DPO advising on what must be
said and when.

The documentation lead records everything: actions taken, decisions made, timestamps,
evidence preserved. During an incident, this is a dedicated task because the technical
lead cannot both investigate and document accurately at the same time. At the Home, this
is an administrative function assigned from senior management support staff when an
incident is declared.

The DPO is not a member of the SIRT in the operational sense but is involved from the
moment personal data may be at risk. The DPO assesses notification obligations, advises
on lawful processing during the response, and owns the supervisory authority relationship.
At the Home, the DPO must be notified within the first hour of a suspected breach involving
personal data.

Legal counsel is engaged for breaches with potential regulatory action, litigation risk,
or where law enforcement involvement is being considered. At the Home, this is external
counsel retained for data protection matters.

## Escalation paths

Before an incident: the IT coordinator is the first point of contact for all security
concerns. They assess and decide whether to escalate. The decision tree is simple: does
this involve personal data, a compromised account with access to personal data, or a
system outage affecting production? If yes to any, escalate to the Head of IT immediately.

The Head of IT escalates to the Director and DPO when: confirmed personal data breach,
ransomware or data destruction, external party involvement (attacker, regulator, press),
or when the incident requires actions affecting operations beyond the IT function.

Contacts, including out-of-hours mobile numbers for the Head of IT, DPO, and Director,
are documented in a single access-controlled page in SharePoint and in a printed card kept
in the IT coordinator's desk and the Director's office. The printed card is reviewed and
reissued quarterly.

## External support

The Home maintains a relationship with an external incident response firm qualified under
the relevant national CERT framework. The firm is engaged at scale-up state on a retainer
that provides a guaranteed four-hour response to a confirmed incident. The retainer number
is on the printed card.

Microsoft support is the second external contact for incidents involving the M365
environment. The support tier should be reviewed against the incident response SLA
required: standard support is not adequate for a time-critical breach response.

The national supervisory authority for data protection is a contact, not a resource. They
receive notifications. They do not help with the response. The notification process is in
the GDPR notification runbook.

## Preparing for incidents

The SIRT exists on paper until it has run through a scenario. The first simulation, the
Fabulist Incident tabletop, is in the breach simulation page. Run it before a real incident
requires the team to function under pressure.

After each real incident and each simulation, the post-incident review updates the
structure: contacts checked, escalation paths confirmed, runbooks adjusted for what was
learned. The loop is described in the post-incident runbook.

For further guidance on building out the SIRT capability, [this SIRT documentation](https://purple.tymyrddin.dev/docs/incident-response/sirt/)
gives a short quick start on roles, structure, responsible disclosure, external partnerships, metrics, and the
improvement loop in detail.

Last updated: 02 June 2026
