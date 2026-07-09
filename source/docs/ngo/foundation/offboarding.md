# Offboarding and access lifecycle

The former employee with an active Global Administrator account is not an anomaly. It is
the most visible version of a pattern that runs throughout the Home's application landscape.

Every system the Home uses has at least one account that belongs to someone who no longer
works there, or whose scope of access was never formally reviewed, or whose departure was
handled correctly in one system and not in the others. This is not a consequence of
negligence. It is the predictable result of an offboarding process that depends on
coordination between HR, IT, and the line manager at exactly the moment when all three
parties are most distracted.

## The Entra ID side

Disabling the Entra ID account is the first action on the day of departure, or the moment
IT receives notification. Not delete: disabling preserves the audit log and allows
recovery if the departure is later disputed or the account is needed to retrieve data.
Alongside the disable: revoke all active sessions, block sign-in, remove the account from
distribution lists and shared mailboxes that contain ongoing communications, and remove any
administrative roles immediately.

Within one week of departure, review and transfer ownership of SharePoint sites, Teams
channels, shared files, and Power Automate flows. Flows in particular are a common blind
spot. They run as the owner and fail silently when the owner's account is disabled. The
failure usually surfaces weeks later, when someone notices that an automated process
has stopped producing output and traces it back to a flow that belonged to someone who
left in February.

Within one month, formally delete the account or convert it to a shared mailbox if mail
forwarding is required. Confirm M365 licence reassignment and document completion.

## The application gap

Entra ID manages access to M365 services. It does not manage access to Bestiary, to
Covenant's external portal, to the Great Ledger, or to any other application with local
accounts not federated to Entra ID.

Bestiary has 47 accounts, nine of which are currently suspended pending review. Suspended
is not the same as deleted, and deleted is not the same as formally offboarded with the
access decision documented. The Bestiary account list should be cross-referenced with
the current HR record in the same audit exercise as the Entra ID list.

Covenant's external portal has a consultant admin account that was created during the
Events module onboarding and was not created through HR. It does not appear in the
standard leaver process because it was never a joiner process either. It is visible in
Covenant's own admin panel under Users. The DPA review for Covenant should include
confirmation that this account is formally accounted for.

The Great Ledger, managed by the Consortium, has three former-staff accounts. A
deprovisioning request was submitted to the Consortium's member services team. The request
was acknowledged. Acknowledgement is not the same as completion. Follow up. Security
advisories from the Consortium are still being routed to one of those departed staff
members' email addresses, which now forwards to a personal account that the Home has no
visibility over.

## Volunteers

Volunteers leave without a formal departure process more often than employees. They stop
coming in. Their access persists. The Coven, the Signal group used by the night shift team,
currently has fourteen members, three of whom are former volunteers who are no longer
active and were never removed from the group. The group contains shift schedules and
occasional resident welfare notes. The Home has no mechanism to remove people from a
Signal group run on personal devices, which is one of the reasons The Coven is not an
acceptable arrangement for the data it currently holds.

For formal volunteer access in the M365 tenant, quarterly access reviews with the
volunteer coordinator are the practical equivalent of the automated access review policies
available in Entra ID P2. The coordinator confirms which volunteers are currently active.
IT disables accounts for those who are not. The review should be documented and the
outcome should feed into the quarterly security check.

Time-limited access, where volunteer accounts are configured to expire after a set period
and require active renewal, is the sustainable version of this. It shifts the default from
access persisting until someone notices to access expiring unless someone confirms it
should continue.

## Making the process stick

A process that depends on someone remembering to file a ticket at the right moment will
fail in a busy organisation. The sustainable version requires HR to notify IT via a
standard form at the start of the departure notice period, and for IT to work through a
checklist that covers every application in the landscape. Completion
is documented and attached to the HR record.

Quarterly, run an access review of all active accounts against the current HR and volunteer
record to catch anything the process missed. The first review will produce more findings
than subsequent ones. That is normal, and the point is not to be surprised by it.

## Related

- [Entra ID audit](entra-id.md)
- [Privileged access](privileged-access.md)
- [Bestiary](../applications/bestiary.md)
- [Covenant](../applications/covenant.md)
- [The Great Ledger](../applications/great-ledger.md)
- [The Coven](../applications/the-coven.md)
- [Hunting identity persistence and OAuth consent abuse](../../counter/human/runbooks/identity-persistence-hunt.md)
Last updated: 10 July 2026
