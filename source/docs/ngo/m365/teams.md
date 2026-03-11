# Teams: governance and data in channels

Teams is where work happens, which means it is also where data accumulates in ways that are
harder to govern than a SharePoint document library or an Exchange mailbox.

Files shared in Teams channels live in SharePoint. Messages in private chats are stored in
Exchange. Files shared in private chats go to OneDrive. This means Teams data governance is
really SharePoint and Exchange governance, but experienced through an interface that makes the
underlying storage invisible to users.

## Teams creation and sprawl

In a default M365 configuration, any user can create a new Team. In an organisation that has
been running Teams for a few years, this results in a long list of Teams with varying levels
of activity, unclear ownership, and inconsistent membership.

You can restrict Team creation to specific groups (typically IT and approved coordinators) in
the Entra ID Group settings. Whether to do this is a judgement call: tighter control reduces
sprawl but creates a request queue and a governance burden. A middle ground is allowing
creation but requiring a named owner and running periodic reviews of inactive Teams.

## Guest access

External guests in Teams can access channels they are invited to, which includes the files
shared there. Guest access is legitimate and useful. The question is whether it is governed.

Check the Teams Admin Centre under Org-wide settings, then Guest access. Is external access
enabled? What can guests do? Are there specific Teams where guests should not be present but are?

Periodic guest access reviews, particularly for Teams holding sensitive project or donor data,
are worthwhile.

## Private channels and sensitivity labels

Private channels restrict access within a Team to a subset of members. They have their own
SharePoint site collection and are not visible to other Team members. If your licencing includes
Microsoft 365 E3 or higher, sensitivity labels can be applied to Teams and M365 Groups to
control external access and other settings consistently.

## What is in the channels

The harder governance question is what data people are actually sharing in Teams messages
and channels. Donor lists pasted into chat. Sensitive case information discussed in a channel
with broader membership than the case warranted. Personal data shared in a way that is not
covered by your retention policy.

This is a culture and awareness issue as much as a technical one. Technical controls can limit
the worst exposures, but the underlying behaviour requires training and clear guidance on what
belongs in Teams and what belongs in more controlled systems.

## Related

- [SharePoint and external sharing](sharepoint.md)
- [Security awareness](../awareness/index)
- [Data protection and AVG](../data/avg.md)
