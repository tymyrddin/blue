# Four reports, one finding

The other pages in this section describe what each division does. This one follows what happens when three
of them handle the same thing without realising it, which is the case the pipeline is built for and the one
it gets right slowly.

Over a single week the same vulnerability arrives four times. Four desks, four channels, four different
levels of confidence, and no one of them holding enough to act on. CVE-2026-4471 is unauthenticated command
execution in the update service of the Acme Industrial Gateway v2.3.1. Someone has been using it from
94.23.117.8 against 10.44.12.0/24, the signalling subnet for the city's water treatment, since around
2026-04-28. None of the four reports says all of that. The building assembles it.

## The Receiving Desk takes it in

It comes first from someone who signs their work. T. Vanholt, on the Society's vetted register, sends a
PGP-encrypted report: a firmware finding and a packet capture of the exploitation, the two stapled together
by a researcher who has done the favour of being precise. The desk officer does not keep them stapled. A
firmware vulnerability is an intelligence question and belongs at the Long Table; a capture of traffic is a
signals question and belongs in the Quiet Room. The submission is logged as
[RD-2026-0047](receiving-desk/walkthrough-pgp.md) and split, the finding routed one way and the capture the
other, a shared reference left on both so the seam can be found again.

The second report has no name on it at all. It arrives through the
[Tor onion service](receiving-desk/walkthrough-tor.md): an insider who installs equipment for city
districts, recognised the model, recognised the CVE, and decided someone ought to be told. The desk can
verify none of it, so the reliability ceiling sits at two. That is not a judgement on the person, who
cannot be assessed, but on a channel that records nothing. Logged as RD-2026-0049, with a note that it
touches the same CVE as the Vanholt finding. Whether the note means anything is, the desk writes, the Long
Table's to decide.

A third report lands the same week and looks, for a moment, like more of the same.
[J. Marsh](receiving-desk/walkthrough-security-txt.md), unvetted, reports a Siemens controller exposed at a
city address: a genuine finding, responsibly disclosed, routed to the Long Table as RD-2026-0048. Different
product, different vulnerability, different decade of CVE. It will turn out to belong to nothing here, which
is itself worth recording.

## The Quiet Room characterises it

The capture from the Vanholt submission reaches the Quiet Room, where the rule is to describe and not to
interpret. The duty analyst reviews the traffic, confirms it is consistent with the exploitation pattern,
confirms the target subnet is live water treatment infrastructure, and for that reason holds the event at
`tlp:amber` rather than the sensor default. It leaves as
[QR-2026-0031](quiet-room/walkthrough-society-notification.md), reliability four, routed to the Long Table
sharing group. The analyst does not say whether this is a campaign or an accident. That is not the Quiet
Room's sentence to write.

Days later a sensor raises its own hand. A Suricata rule fires on the same source address, 94.23.117.8,
reaching a host inside the same subnet, nothing behind it but a rule signature and a timestamp. On its own
it is a reliability-two alert, below the line, the kind the perimeter produces all day. But
[QR-2026-0032](quiet-room/walkthrough-automated-sensor.md) touches infrastructure already in the pipeline,
so instead of being dropped it is held for correlation and passed up as context at its own reliability. The sensor does not know it has corroborated
anything. The pipeline knows.

## The Long Table assembles it

By the time the Long Table opens [LT-2026-0007](long-table/walkthrough-correlation.md), four items in the
store point at the same CVE, the same address, the same stretch of water. The assessor's first job is to
resist the obvious arithmetic. Four reports are not four sources. The Vanholt finding and the Quiet Room's
characterisation of his capture share a parent: one researcher seen through two pipelines, and counting him
twice would manufacture a confidence no one earned. What is left is genuinely independent: a vetted
researcher, an anonymous insider, and a perimeter sensor, none of whom consulted the others.

So the table writes two sentences and keeps them apart. The activity is well-supported and recorded at the
confidence the corroboration carries. The anonymous tip's own ceiling stays where it was, because
corroboration changes what can be said about the claim, not about the source. The Siemens report is set
aside, named and dated, as the thing that was considered and did not fit. CVE-2026-4471, vendor notified
2026-04-14, the ninety-day window closing 2026-07-13 with no reply on record. The determination is to
escalate. What is done about it happens somewhere this page does not go.

## Off this thread

Two other Quiet Room walkthroughs run beside this one without joining it.
[QR-2026-0033](quiet-room/walkthrough-correlation-hold.md) is a different host in a different week: two
sub-threshold sensor events that mean something only together. [QR-2026-0034](quiet-room/walkthrough-drop.md)
is the report that goes nowhere, dropped and logged, kept ninety days in case it ever acquires company. They
sit here because the building does the quiet cases too, and a pipeline judged only on its escalations is
being judged on the wrong thing.

A later finding will come the same way: in at a desk, characterised in the room, assembled at the table,
under a name that still does not appear on any building.
Last updated: 10 July 2026
