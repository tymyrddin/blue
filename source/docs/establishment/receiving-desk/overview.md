# Intake, triage, and routing

The Receiving Desk handles incoming disclosures: vulnerability findings, threat intelligence, anonymous
tips, and material whose origin is recorded only to the extent that an intake channel was used.

## Intake channels

Three channels are available.

`security.txt` is the standard endpoint. A researcher with a finding submits the details, the affected
system, and contact information. The submission is logged against the researcher record. A case is
created. An acknowledgement goes out within two working days.

PGP-encrypted email is the preferred channel for sensitive material where the researcher is willing to
be identified but not exposed in transmission. The Receiving Desk's public key is published alongside
the `security.txt` entry. Decryption takes place on the Receiving Desk's own infrastructure.

The Tor onion service is the anonymous channel. Submissions through this channel receive a case reference
number but no researcher record. The intake log records the channel used and the date of receipt. It does
not record the origin. This is not a gap in the logging. It is what the channel is for.

## Case handling

Every submission produces a case record containing the date of receipt, the channel, the initial
confidence classification, the triage determination, and the routing decision. Researcher contact details
are recorded where the channel allows it. Where it does not, the case reference number is the only link.

Triage routes each case to the appropriate division. Signals-layer findings go to the Quiet Room.
Intelligence-layer findings go to the Long Table. Hardware or firmware submissions go to the Repair Shop.
Submissions that span categories are split and routed separately, with a note in each case record linking
to the others.

## Researcher handling

Researchers who submit through identified channels receive a standard timeline: acknowledgement within two
working days, triage determination within ten, escalation status within thirty. The timeline covers the
Receiving Desk's part of the process. What happens to a finding after it routes to another division is
that division's timeline.

Anonymous submissions receive their case reference through the same Tor onion service used to submit. The
reference is the only record of the transaction. Neither the Receiving Desk nor any other division can use
it to identify who made the submission.
