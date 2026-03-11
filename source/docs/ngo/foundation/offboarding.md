# Offboarding and access lifecycle

The 2022 leaver with an active Dynamics licence is a real person at a real organisation.
You will find them in the audit. Possibly several of them.

In a non-profit with high volunteer and staff turnover, access lifecycle management is one of
the most consistently weak areas. Not because nobody cares, but because the process requires
coordination between HR, IT, and the line manager, and in a busy organisation that coordination
breaks down at exactly the moments when IT is most overloaded.

## The offboarding process

For an employee departure, the minimum viable offboarding process covers two phases.

On the day of departure, or the moment IT is notified: disable the Entra ID account (not delete,
disabling preserves audit logs and allows access recovery), revoke all active sessions in the
Entra ID user portal, block sign-in, remove the account from distribution lists and shared
mailboxes that contain active communications, and remove any administrative roles.

Within one week: review and transfer ownership of SharePoint sites, Teams channels, and shared
files. Review and transfer ownership of Power Automate flows, which is a common blind spot
because flows run as the owner and break silently when the owner is offboarded. Silently,
that is, until someone notices that the automated weekly report has not arrived for three
months, at which point it usually emerges that nobody was reading it anyway. Review external
sharing links the account created. Reassign Dynamics and other application licences.

Within one month: formally delete the account or convert it to a shared mailbox if mail
forwarding is needed, confirm application access has been removed in all non-Entra systems,
and document completion in the HR and IT ticket.

## The application gap

Entra ID manages M365 access. It does not manage everything. A leaver's account in the CRM,
the membership administration system, sector-specific software, or any application with local
accounts not federated to Entra ID requires a separate deprovisioning step per system.

These are the gaps that create lingering access. Document which applications have Entra ID SSO
integration and which require manual deprovisioning. The manual ones go on a checklist that HR
or IT completes for every departure.

## Volunteer offboarding

Volunteers present the same problem at higher volume and lower coordination. A volunteer who
stops coming in rarely triggers a formal departure process. Their account sits active.
Their access persists.

Time-limited access is one option: configure volunteer accounts to expire after a set period
and require active renewal. Not possible with all licencing configurations, but achievable with
access reviews.

Regular access reviews in Entra ID P2 include this feature, which prompts managers to confirm
whether their direct reports still need access. For volunteer populations, quarterly reviews
with the volunteer coordinator are a practical equivalent.

Minimal access scope reduces the risk when deprovisioning is delayed. Volunteer accounts with
access only to what they genuinely need create less exposure when they are not promptly removed.

## Making the process stick

A process that depends on someone remembering to file a ticket at the right moment will fail.
The sustainable version requires HR to notify IT via a standard form or ticket type at the
start of the departure notice period, IT to work through a standard checklist adapted for
your application landscape, and completion to be documented and ticketed. Quarterly, run an
access review of all accounts against the current HR record to catch anything missed.

## Related

- [Entra ID audit](entra-id.md)
- [Application landscape](../applications/landscape.md)
