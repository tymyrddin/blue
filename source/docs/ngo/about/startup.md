# The Home in its early years

The Home did not begin with architecture. It began with Mrs. Clodpull, a secondhand
laptop, and a spreadsheet that would, over the following three years, become something
between a sacred text and a liability.

In the early days there were four staff members, twelve residents, and one shared email
address that everyone had the password to, including Kevin's aunt who had helped set it up
and had never been asked for it back. The address was info@homeforbeasts.am and it received,
in roughly equal measure: donation enquiries, lost property notifications, and messages from
a troll named Gerald who was convinced this was the booking line for a different sort of
establishment entirely.

There was no IT department. There was Kevin, who was good with computers in the sense that
he could restart them, and occasionally borrow one from the local library when his own broke.
Everything that needed remembering was remembered by Mrs. Clodpull. Everything that needed
writing down was in the spreadsheet. The spreadsheet had seventeen tabs. Nobody except
Mrs. Clodpull understood what three of them were for. Nobody asked.

## What the infrastructure looked like

The infrastructure at startup was not so much an architecture as a collection of individual
decisions that had not yet been introduced to each other. Each staff member had a personal
email address, their own files on their own device, and a shared understanding that if the
laptop died they would need to call a cousin. Password management was handled by memory,
sticky notes, and a small notebook that lived in Mrs. Clodpull's desk drawer and was
consulted only in moments of genuine crisis.

File storage was Google Drive, on the free tier, for the person who had set it up. The
others used email attachments. The donation records lived in the spreadsheet. The member
records lived in a different spreadsheet. Whether they were tabs in the same file or entirely
separate documents on separate machines was not always clear, even to those involved. Backups
were not mentioned, on the grounds that mentioning them might tempt fate.

The thing in the basement predated all of this and had never needed an account. It had
an arrangement. The arrangement worked.

## What this meant for security

In the startup state, the security posture is honest in a way that later stages sometimes
are not. Nobody has promised anything they cannot deliver. There is no policy claiming that
MFA is enforced when in fact it only applies to accounts someone remembered to configure.
There is no access management system granting permissions to people who left three years ago.
The attack surface is small because the surface itself is small.

The risks are equally honest. A single compromised account is a compromised everything.
A lost laptop is a lost archive. A staff member who leaves takes institutional knowledge with
them and, sometimes, an active login session. Gerald the troll still has access to the shared
email. Nobody is certain what he might do with it, but his enquiries have so far been
limited to asking about availability and whether breakfast is included.

The security work at startup is not glamorous. It is making sure the shared email account
belongs to the organisation. It is
enabling two-step verification before a phishing email makes that conversation urgent. It is
writing things down, not because writing things down is inherently secure, but because the
alternative is that the knowledge walks out with the person who holds it.

## What to do first

Before anything else: find out what actually exists. Not what was planned, but what is
running. Ask who has access to what, and accept that the first answer will be incomplete.
Ask where the data lives, and accept that the honest answer is probably several places, not
all of which can be named immediately.

Then, in rough order of how badly things could go wrong: secure the shared accounts, enable
MFA wherever the platform offers it, move the files off individual machines and into shared
storage with a backup that someone has actually tested, and document the things that live
only in Mrs. Clodpull's memory before she takes a well-earned holiday.

Do not attempt to build a security programme at startup scale. Build habits instead.
Programmes come later. At this stage, the goal is to ensure that the organisation survives
the first crisis without losing the data, the access, or the spreadsheet.

The thing in the basement does not need its own account. Leave it.