# Responsible disclosure considerations

When a vulnerability is discovered in a commercial product, obligations extend beyond the immediate finding.

## Vendor notification

If the vulnerability affects a product used by other organisations:

1. Notify the vendor first, before public disclosure
2. Provide sufficient detail for reproduction
3. Allow reasonable time for patching, typically 90 days
4. Coordinate disclosure timing with the vendor

## Coordination with relevant authorities

For critical infrastructure findings, relevant civic and national authorities are worth notifying:

- They can coordinate with vendors across affected sectors
- They can issue advisories to operators who may not otherwise learn of the issue
- They can support responsible disclosure timelines where vendor response is slow

In Ankh-Morpork, this means the Establishment's Receiving Desk, which handles incoming material of exactly
this kind. The Receiving Desk does not confirm receipt publicly.

## What the affected operator receives

Operators and vendors who hold or deploy vulnerable equipment are entitled to the findings, but judgement applies:

- Avoid providing full exploit code unless operationally necessary
- Consider whether the report may be further distributed beyond the immediate recipient
- Redact sensitive details if the report will reach a wider audience
- Confirm that findings are not trivially weaponisable from the report alone

## An example

A zero-day vulnerability discovered in a widely deployed industrial gateway: authentication bypass via a
crafted HTTP request. The disclosure sequence:

1. Vendor notified immediately with proof of concept
2. Relevant civic authorities notified with coordination details
3. Affected operators provided with detailed mitigation steps
4. Full exploit code not included in written reports
5. Ninety-day disclosure timeline agreed with vendor
6. Advisory published after patch was available

The vendor patched within 45 days. Public disclosure followed at 90 days. The finding reached the people
who needed it without reaching the people who would misuse it. That is the intended outcome.

## The balance of proof and safety

The fundamental tension in OT vulnerability research is this: a finding needs to be credible without the
demonstration causing harm. Proving that something dangerous is possible, without doing the dangerous thing,
requires more care than a standard security disclosure.

Simulator attacks are more persuasive than theoretical descriptions. Video evidence is more persuasive than
static screenshots. Detailed technical analysis is more persuasive than assertion alone. But crossing into
actual manipulation of production systems is not a proof technique. It is negligence.

Document everything safely demonstrable, explain clearly what cannot be safely demonstrated and why, and
trust that a well-evidenced finding will be taken seriously. If it is not taken seriously without a live
demonstration on production infrastructure, the problem is not the documentation.
