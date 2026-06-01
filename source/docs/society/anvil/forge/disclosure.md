# Responsible disclosure considerations

A vulnerability found in a commercial product comes with obligations that outlast the finding itself. This is the part where the work stops being technical and starts being about who gets told, in what order, and how much.

## Vendor notification

Where the vulnerability affects a product other organisations also run, the order that tends to work:

1. The vendor first, before any public disclosure
2. Enough detail for them to reproduce it
3. Reasonable time to patch, typically ninety days
4. The disclosure timing worked out together rather than sprung on them

## Coordinating with the authorities

For critical-infrastructure findings, the relevant civic and national authorities are worth bringing in. They can do things a lone researcher cannot:

- Coordinate with vendors across the affected sectors
- Issue advisories to operators who would otherwise never hear about it
- Hold a responsible-disclosure timeline together when a vendor drags its feet

In Ankh-Morpork, this means the Establishment's Receiving Desk, which handles incoming material of exactly this kind. The Receiving Desk does not confirm receipt publicly, which is rather the point of it.

## What reaches the operator

Operators and vendors holding vulnerable equipment are entitled to the findings, but a little judgement travels with them:

- Full exploit code can usually stay out, unless there is an operational reason for it
- The report may be passed on further than its first recipient, which is worth assuming
- Sensitive detail can be redacted where the report will reach a wider audience
- A finding that is trivially weaponisable from the report alone wants a second look before it goes out

## An example

A zero-day in a widely deployed industrial gateway: authentication bypass via a crafted HTTP request. How the disclosure ran:

1. Vendor notified immediately, with proof of concept
2. Relevant civic authorities notified, with coordination details
3. Affected operators given detailed mitigation steps
4. Full exploit code kept out of the written reports
5. A ninety-day timeline agreed with the vendor
6. Advisory published once the patch was available

The vendor patched in 45 days. Public disclosure followed at 90. The finding reached the people who needed it without reaching the people who would misuse it, which is the outcome the whole exercise is for.

## The balance of proof and safety

The standing tension in OT vulnerability research: a finding has to be credible without the demonstration causing harm. Proving something dangerous is possible, without doing the dangerous thing, takes more care than an ordinary disclosure.

A simulator attack persuades more than a theoretical description. Video evidence persuades more than a static screenshot. Detailed technical analysis persuades more than assertion. But stepping across into actual manipulation of a production system is not a proof technique. It is negligence with better PR.

The working approach: document everything that can be shown safely, say plainly what cannot be shown and why, and trust that a well-evidenced finding carries. If it does not carry without a live demonstration on production infrastructure, the problem was never the documentation.
