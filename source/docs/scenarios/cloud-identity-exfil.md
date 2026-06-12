# Operation Silent Siphon

The Fungolian Ministry of Foreign Affairs keeps its diplomatic spores, as the locals insist on calling
them, in fungal chambers under the capital and, like everyone else, on Golem Trust's cloud. There is no
fortress wall in this story, and no broken lock. Crimson Weave, the unit the files number APT-41, brought
no malware at all. It logged in with a password somebody had reused, made itself part of the furniture,
and read the ministry's post for months as a ghost in the mail.

The Ministry of Digital Affairs reconstructed the whole tenancy afterward, step by patient step, and
this being Fungolia it scheduled three emergency committees and one formal disagreement before it would
sign the report. The uncomfortable finding sits at the top of the file: nothing in the ministry ever
blinked. There was no malicious file to scan for, no strange process, no alarm, only a configuration
nobody was reading, and a cloud the whole alliance trusts being trusted exactly as designed.

The city has a stake whether or not it is named. The shared mailboxes Crimson Weave read held the Circle
Sea's negotiating positions, and the first anyone in Fungolia knew the post had been opened was a quiet
word from across the water.

## Under the ministry

- The Fungolian Ministry of Foreign Affairs (FMFA): the victim, its diplomatic correspondence cultivated
  in the usual underground chambers and stored, like everyone's, on the shared cloud, defended chiefly by
  the assumption that a platform the whole alliance leans on could not be the way in.
- Crimson Weave, the unit the files number APT-41: the attacker that broke nothing, dropped nothing, and
  borrowed the ministry's own trust instead, reading the diplomatic post for months without leaving a
  thing to find.
- [The Fungolia Ministry of Digital Affairs (FMDA)](https://red.tymyrddin.dev/docs/earthworks/fmda/): the
  investigator, which traced every step after the fact and, true to form, ran the inquiry at the speed of
  a bureaucracy required by law to disagree with itself once a week.
- [The Office of Civil Surveys](../surveys/index.rst): the city's secret service and the alliance's
  inconvenient conscience, whose quiet tip-off was the first sign anyone in Fungolia had that the post was
  being read, since the ministry's own systems reported a calm and blameless year.

## The invisible tenant

Crimson Weave never broke in. It logged in, and then it set down anchors that a changed password would
not lift. FMDA traced the tenancy in order.

1. The key under the mat: the attacker bought old breach dumps from unrelated leaks, combed them for
   ministry addresses, and tried the reused passwords against the ministry's web mail. One landed, a third
   assistant under-secretary, `h.morel@minfa.fung`, whose password `Compost2023!` had not changed since a
   contractor's database spilled it two years earlier, and whose account carried no second factor. One
   valid session, no alarm raised.
2. The copied keys: inside the mailbox, the attacker set two quiet anchors. A new inbox rule named
   `_MSGTAG`, shaped to read like a system rule, silently forwarded a copy of every message in and out to
   an address it controlled, with the notify flag turned off. Then, on the cloud's identity portal, it
   registered a multi-tenant application under a dull and plausible name, `Golem Trust Telemetry`, and
   consented it to read mail and list users. That consent issued long-lived tokens that answer to the
   application, not the password, so a reset of `h.morel`'s credentials would change nothing at all.
3. Down the hall: with the application's tokens, the attacker called the directory API, listed the users,
   listed the groups, and found the doors worth opening: the shared mailboxes, `circle-sea-delegation` for
   the alliance briefings and `treaty-counsel` for the legal advice on the arrangement, both readable by
   any member of the ministry by default. No further break-in was needed; the permissions were already
   there for the asking.
4. The silent observer: every call went over ordinary traffic to the cloud's own API, indistinguishable
   from the ministry's daily use, and the data left slowly, in small amounts, under the thresholds the
   loss-prevention rules watch for. The same tokens read the Foreign Minister's calendar, a perfect
   timetable of who was meeting whom and when.
5. The harvest: over months, Crimson Weave drew off the ministry's draft negotiating positions for the
   Circle Sea, its cables on Klatch and the Agatean court, its legal analyses of the sanctions packages,
   and the minister's entire contact network, and the ministry showed not one sign of it. Fungolia found
   out only because the Office of Civil Surveys, watching the far end, noticed the arrangement's positions
   arriving somewhere they had no business being, and said so.

What FMDA puts at the head of the report is that there was nothing to detect in the usual sense. The
indicators were never files. They were a forwarding rule and an app consent that every busy administrator
has waved through a hundred times.

## Decision points

- Whether to pull the rogue application's consent at once. Revoking the `Golem Trust Telemetry`
  registration and killing its tokens ends the read in a breath, and it tells Crimson Weave the cover is
  blown before FMDA has finished mapping which other accounts it touched and before the city has traced
  the far end.
- Whether to reset and watch instead. FMDA can leave the rule and the application in place under
  observation, feeding the attacker a controlled view while it follows the forwarding address and the
  token usage, which learns a little more and risks a little more with every day the post keeps leaving.
- Whether to admit how it was found. Saying plainly that the breach was caught by an allied tip-off names
  the city's standing watch over its own ally's mail, which Fungolia would rather not hear and the city
  would rather not confirm, so the report may yet credit a routine audit that never quite happened.

The siphon buys an adversary the diplomatic post with nothing to scan for. No malware, no dropped file,
no broken lock, only a reused password, a forwarding rule, and a consent screen. The hardest part of the
clean-up is convincing people a breach occurred at all, when every dashboard insists the year was quiet.

## If it stays unseen

- The read becomes the baseline. While the tokens hold, the ministry's positions reach the adversary
  before they reach the table, and the arrangement negotiates against a party that has already read its
  hand.
- The reset does nothing. Because the application's tokens are independent of the password, the reflex
  response, force a password change, closes none of it, and the post keeps leaving while everyone believes
  the matter handled.
- The exposure is not Fungolia's alone. The shared mailboxes hold the alliance's briefings, so a breach in
  one ministry's cloud quietly reads the negotiating positions of every member that trusted Fungolia to
  hold them.

## Behind the siphon

- The impact family this belongs to, the diplomatic post read and gone while every system ran clean:
  [when nothing breaks and the secret is already gone](../counter/impact/confidentiality.md).
- The method that opened it, where the cloud's own identity and trust become the access path:
  [administrative hijack](../counter/impact/administrative-hijack.md), and the scopes that make it possible,
  [OAuth scopes as blast radius](../counter/cloud/oauth-scopes.md).
- The quiet, months-long theft that leaves nothing to scan for:
  [counter moves on exfiltration](../counter/exfiltration/index.rst).
- The single shared platform half the alliance keeps its post on:
  [concentration and dependency](../counter/impact/concentration.md).
- The access granted to a trusted ally, read from inside: the Circle Sea
  [threat picture](../circle-sea/threats.md), on the enemy inside the access.
- The technical lab execution behind this narrative:
  [FMDA: The Silent Siphon](https://red.tymyrddin.dev/docs/earthworks/fmda/silent-siphon.html).
