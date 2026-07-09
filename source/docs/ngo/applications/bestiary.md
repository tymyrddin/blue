# Bestiary

Bestiary is the Home's resident management system. It was built by Fabulist Systems,
a small software house from the Shades district that specialises in software for the creature welfare sector,
and has been running at the Home for eleven years. The current version is 4.2.1. Version 5
was announced in 2021 and is still, according to the Fabulist Systems website, coming soon.

The system manages the full resident lifecycle: initial intake assessment, species
classification, medical history, feeding requirements and dietary notes, behavioural
observations, therapy session records, and rehoming case management. It also handles the
Home's legal obligations around creature registration, which vary considerably depending on
whether the creature in question falls under mundane wildlife legislation, mythological
heritage protection, or the rather more ambiguous category of entities whose legal status
has not yet been determined by any court willing to hear the case.

Dr. Flannel uses Bestiary for all medical records. Madame Zara uses it for therapy notes,
though she has strong opinions about the behavioural classification schema, which she
describes as "written by someone who has never sat in a room with a phoenix". Mrs. Clodpull
uses it for intake records and considers it adequate, which from Mrs. Clodpull is a
reasonable endorsement.

## Technical details

Bestiary runs on-premises, on a Windows Server 2016 installation in the comms room on the
second floor. The server is the one whose decommissioning has been discussed at three
consecutive IT planning meetings. The reason it has not been decommissioned is Bestiary.
There is a cloud-hosted version of Bestiary, introduced in version 5, which is coming soon.

Authentication is local. Bestiary has its own username and password database. There is no
integration with Entra ID and no single sign-on. Staff who use Bestiary have a separate
set of credentials, which they manage independently. Password resets go through Kevin, who
receives the request by email, resets the password in the Bestiary admin panel, and sends
the new password back by email. This process has been in place for eleven years. Nobody has
formally proposed an alternative.

There are currently forty-seven active user accounts in Bestiary. An access review conducted
eighteen months ago identified nine accounts belonging to staff who had left the Home, six
of which had last logged in more than two years prior. The nine accounts were suspended
during the review. Whether they have since been reactivated for any reason has not been
checked.

The database backend is Microsoft SQL Server. Backups run nightly to a network share. The
network share is on the same physical server. This has been flagged. It remains the
configuration.

## What it holds

Bestiary holds the complete medical, behavioural, and case history for every resident the
Home has ever taken in, including residents who have been rehomed or who have died. Records
for the latter are retained under the mythological heritage protection framework, which
requires a minimum of fifty years' retention for creatures classified as endangered or
singular. The thing in the basement has a Bestiary record. The species field is blank. The
notes field is lengthy.

The system also holds personal details for the residents' next of kin, emergency contacts,
and, in the case of residents with known family structures, details about relatives who may
attempt to reclaim them. Some of these contacts are themselves mythological entities. Their
contact details include addresses that do not appear on any map and telephone numbers that
do not connect consistently.

## Known issues

The reporting module generates PDF outputs that require a specific version of a PDF renderer
that is no longer supported. The IT coordinator has found a workaround that involves a
secondary application running alongside Bestiary. The workaround has been in place for three
years and is documented in a text file on Kevin's desktop.

Fabulist Systems provides support via a ticketing portal and a telephone number that goes to
voicemail during a calendar of public holidays whose number and scheduling has never been satisfactorily explained. The
support contract is renewed annually. The last renewal included a price increase of twelve
percent, which was described in the accompanying letter as a reflection of increased
operational costs. The contract was renewed anyway, because there is no migration path that
does not involve exporting eleven years of records in a format that Bestiary's export
function produces unreliably.
Last updated: 21 March 2026
