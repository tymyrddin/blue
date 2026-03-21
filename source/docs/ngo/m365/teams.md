# Teams: governance and data in channels

Teams is where work happens, which means it is also where data accumulates in ways that
are harder to govern than a SharePoint document library or an Exchange mailbox.

Files shared in Teams channels live in SharePoint. Messages in private chats are stored
in Exchange. Files shared in private chats go to OneDrive. Teams data governance is
therefore SharePoint and Exchange governance, experienced through an interface that makes
the underlying storage invisible to most users, including the ones sharing things they
should not be sharing there.

## Teams creation and sprawl

In a default M365 configuration, any user can create a new Team. At the Home, after
several years of growth and multiple project cycles, this has produced a collection of
Teams with varying activity levels, unclear ownership, and membership lists that predate
the current offboarding process. Some of them contain data from projects that have ended.
Some of them have external guests who were invited for a specific collaboration and whose
access was never reviewed.

The question of whether to restrict Team creation is a judgement call between control and
friction. A middle ground that works for most organisations at the Home's scale is allowing
creation but requiring a named owner, and running quarterly reviews of Teams that have had
no activity in the past ninety days. Inactive Teams with no named owner are a consistent
governance finding.

## Guest access

External guests in Teams can access channels they are invited to, which includes the files
shared there. Check the Teams Admin Centre under Org-wide settings, then Guest access.
Confirm what external access is permitted and what guests can do once they are in.

Periodic reviews of guest membership in Teams that hold sensitive data are the practical
control. Partner organisations involved in resident welfare, funders with access to
programme reporting channels, and external collaborators from past projects are all
categories the Home is likely to have represented in its guest list.

## What should not be in Teams

The harder question is what data staff are actually sharing in Teams messages and channels.
Resident welfare notes discussed in a channel with broader membership than the case
warrants. Volunteer contact details pasted into a chat rather than accessed from Covenant.
Shift schedules for the night team that would be more appropriately handled in Bestiary.

The night shift team's use of The Coven, the Signal group, for operational coordination is
partly a function of this: Teams access on personal devices during night shifts is less
convenient than the messaging app already on the phone, and the organisational Teams
environment does not have a clear designated space for the kind of real-time, informal
coordination that shift handovers require. The Coven is not an acceptable arrangement for
the data it currently holds, but the underlying need it addresses is legitimate. The answer
is not to close it without providing a workable alternative.

A private Teams channel for the night shift team, with appropriately scoped membership and
clear guidance on what data belongs there, is a more sustainable answer than a policy
prohibition on a tool people are actively relying on.

## Retention and purview

Teams messages are governed by the retention policies configured in Microsoft Purview. If
no retention policy has been configured, messages are retained indefinitely by default.
This matters for GDPR: messages containing personal data that has no ongoing purpose are
data the Home holds without a clear legal basis for continued retention.

This does not need to be addressed all at once. A default retention policy for Teams
messages, set to a reasonable period, is a starting point. Communications that need to be
kept longer for legal or operational reasons can be handled by exception.

## Related

- [SharePoint and external sharing](sharepoint.md)
- [Security awareness](../awareness/index)
- [The Coven](../applications/the-coven.md)
- [Data protection and GDPR](../data/gdpr.md)
