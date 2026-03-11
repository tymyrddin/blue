# Incident response

An organisation without a security team or a SIEM still has security incidents. The incidents
do not wait for the infrastructure to be ready. A compromised account, a data breach via a
phishing attack, ransomware via a malicious attachment, an employee who accidentally shared
a donor spreadsheet publicly: these happen regardless of whether a formal incident response
programme exists.

The goal at this stage is not a mature incident response capability with runbooks and a war
room and a retained forensics firm. The goal is to have answers to three questions before
an incident happens rather than during it: who do we call, what do we do immediately, and
what do we need to report to whom?

## Who do we call

Identify the people who need to be involved in an incident before an incident occurs.

The IT decision-maker who can authorise emergency actions: disabling accounts, taking systems
offline, engaging external help.

The data protection officer or legal counsel, because any incident that involves personal
data has AVG implications and possibly a notification obligation.

Microsoft's support line, if the incident involves the M365 environment. A Microsoft support
contract with appropriate SLA may matter if the incident requires urgent assistance.

An external incident response or forensics firm, if the organisation wants the option of
calling one. Identifying and pre-qualifying a firm before an incident is significantly
better than searching during one.

The communications lead, because a significant incident will eventually need to be
communicated to affected parties, the board, and potentially the media.

## What do we do immediately

For the most common incident scenarios, the immediate response steps should be documented
in advance.

For a compromised account: disable the account in Entra ID, revoke all active sessions,
reset the password and MFA methods, review the sign-in logs and audit logs for the account,
check for inbox rules or forwarding rules created, check for suspicious activity in the
applications the account had access to.

For ransomware: isolate affected devices from the network, identify the scope of encryption,
check backup integrity and recoverability, do not pay the ransom without legal advice,
engage external assistance.

For a data breach (personal data exposed or stolen): identify what data was involved and how
many people are affected, preserve evidence, notify the data protection officer, assess the
AVG notification obligation.

## AVG breach notification

The AVG requires notification to the Autoriteit Persoonsgegevens (AP) within 72 hours of
becoming aware of a personal data breach, if the breach is likely to result in a risk to
the rights and freedoms of natural persons. This is a short window, and breaches have a
statistical preference for being discovered on a Friday afternoon. The notification does
not need to be complete: it can be updated. But it needs to happen.

If the breach is likely to result in a high risk to individuals, the affected individuals
must also be notified directly.

The data protection officer owns this process. The security architect's role is to support
with technical facts: what happened, what data was involved, how many people are affected,
what was done to contain it.

## Learning from incidents

After an incident is contained, a post-incident review should cover what happened, how it
was detected, how it was contained, what the impact was, and what could be done differently.
The output is a short list of improvements. The review is not a blame exercise.

Small incidents are learning opportunities. Document them, review them, use them to improve
the environment and the response capability over time.

## Related

- [AVG obligations](avg.md)
- [Phishing recognition and response](../awareness/phishing.md)
- [MFA and account security](../foundation/mfa.md)
