# The asset register

The cork board in the applications office has a card that says "WHERE IS THE ASSET
REGISTER" in red marker, circled three times. The card has been there for two years.
The register has not been there for any of them.

This is common, and it is the wrong problem to solve last. An organisation without an
asset register cannot conduct a meaningful access review, cannot scope a DPIA accurately,
cannot answer a subject access request completely, and cannot respond to a breach
efficiently. Every other security improvement in this section depends, at some level,
on knowing what is running and who has access to it.

The asset register does not need to be a project. It needs to start.

## What goes in it

The Home's asset register covers systems. One row per system.
The columns that matter:

**System name.** What staff call it. Bestiary. Covenant. The Great Ledger. Exchange
Online. SharePoint. The server in the comms room. The Burrow. Sendstone, noted as
unsanctioned but acknowledged as in use.

**What it does.** One sentence. Enough for someone who does not use the system to
understand why it exists and what it touches.

**Data it holds.** The categories of personal data processed: resident medical records,
donor contact details, volunteer DBS references, employee records, financial data. Not
a full inventory, a category summary. Enough to know which systems are in scope for
a GDPR notification and which are not.

**Owner.** The named individual responsible for the system's operation and security.
Not a team. A person. If the system has no owner, that is the first finding.

**Access method.** How staff reach it. Entra ID SSO, local account, shared credentials,
web browser with individual login, VPN required. The access method determines where
it sits in the MFA and Conditional Access landscape.

**Authentication.** Whether MFA is available and enforced, optional, or absent. At the
Home, Bestiary will say absent. Covenant will say optional, forty percent adoption. The
Great Ledger will say local accounts managed by the Consortium. The server of uncertain
purpose will say unknown.

**Data Processing Agreement.** Yes, with date and location; pending review; not in
place; not applicable (internal system). The DPA column is where the compliance picture
becomes visible at a glance.

**Last reviewed.** The date this row was last confirmed accurate. A row that has not
been reviewed in twelve months is a row that may no longer reflect reality.

## How to build it without turning it into a project

Start with the systems everyone knows about. Bestiary. Covenant. Exchange Online.
SharePoint. Teams. Entra ID. The finance system. The CRM. That is seven rows, and
it takes an afternoon.

Then run the discovery conversations. One short meeting per department: what tools do
you use to do your work? What do you use to share files with people outside the
organisation? What do you use when the approved system is slow or broken? The answers
will include The Coven, The Burrow, and Sendstone. Add them. The register is a record
of what exists.

Then run the technical audit. Check the Entra ID app registrations for OAuth consents.
Check the Exchange mail flow rules for forwarding configurations. Check the SharePoint
external sharing report. Each of these surfaces systems or connections that the
department discovery did not mention, because staff do not know they exist or did not
think to mention them.

The result after these three steps is not a complete asset register. It is the first
version of one, which is the only kind that has ever existed. Completeness comes from
maintenance.

## Maintenance

Review the register quarterly alongside the access review. New systems added. Systems
confirmed as decommissioned removed, or kept with a decommissioned flag if the data
retention period has not expired. DPA column updated when a vendor contract is reviewed
or amended. Owner column updated when staff move on.

The register is stored in SharePoint in a site with access restricted to IT and the DPO.
It contains a summary of what personal data the Home holds and where. That makes it
sensitive. It also makes it the document the DPO reaches for first when a subject access
request arrives, when a breach is declared, and when a supervisory authority investigation
begins. It needs to be current more than it needs to be perfectly formatted.

The card on the cork board can come down. Put the link to the register there instead.
