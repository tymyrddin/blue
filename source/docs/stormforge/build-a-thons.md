# Beaconbuild

A build-a-thon is exactly what it sounds like: a group of people building something together,
under time pressure, with the goal of having a working thing at the end rather than a
presentation about a working thing they might build someday.

The things built in Beaconbuild sessions are practical. They are designed to run on modest
hardware with open-source tools and to be reproducible by the crew that built them, at their
own organisation, with their own available resources, without needing the same crew present.

Build-a-thons do not have a fixed pace. Some crews finish the core build in half the time
and spend the rest making it better. Some crews spend most of the time on one component that
turns out to be more interesting than expected and call the rest good enough for a prototype.
Both produce something real. The documentation that comes out of the second type tends to be
more thorough, because nothing concentrates the mind on writing things down like having just
spent four hours figuring something out.

## SIEM-in-two-days

A watchtower is only useful if it is actually staffed. The most sophisticated SIEM on the
market, running on hardware the organisation cannot afford to maintain, configured by a
consultant who has since left, is not a watchtower. It is a very expensive building with
the lights on and nobody home.

This build-a-thon is about the other kind: a SIEM stack that an NGO or small team can
actually run. Over two days, participants set up log collection from a small set of sources,
configure parsing so the logs mean something, build a handful of detection rules for the
scenarios most likely to matter, and set up dashboards that show the relevant information
without requiring a specialist to interpret them.

The emphasis is on maintainability. Every decision gets documented as it is made, which slows
the build down slightly and makes the resulting thing infinitely more useful six months later
when the person who configured it has moved on and someone else needs to understand what it
does and why it is making that particular noise.

Day one tends to involve a certain amount of swearing at log parsing configurations. This is
normal and temporary. By day two, the logs are arriving cleanly and the crew has developed
strong opinions about timestamp formats.

Participants leave with a working prototype and the ability to explain every component of it
to a colleague who was not there. That second part is not accidental; it is the measure of
whether the knowledge is actually portable.

## Pi-Rogue-in-a-day

The PiRogue Tool Suite is a network analysis and security monitoring platform that runs on a
Raspberry Pi, costs less than a dinner for two, and can be carried in a small bag. It was
built for civil society organisations operating in environments where dragging a rack of
enterprise security hardware is not an option.

In this build-a-thon, participants build one. From the hardware. The complete process: write
the image, boot, configure, connect to a test network, watch the traffic, find something
interesting in it.

Completion time varies, which is the diplomatically accurate way of saying it varies quite
a lot. People who have worked with Raspberry Pi hardware before and are comfortable at the
command line typically finish the core build in three to four hours and spend the rest of
the session exploring the tools. People for whom this is new territory take longer, and that
is the intended experience, because the learning happens in the doing, and the doing includes
the parts where you have to look something up.

Every participant who completes the session has a working device and a build log they produced
themselves. The build log is the actual deliverable. Anyone who can follow the build log can
build another one, which means the knowledge is now portable and no longer lives only in the
heads of the people who were in the room that day.

## Awareness kit in a day

This one does not involve setting up servers. It involves building the materials to run a
security awareness session, from scratch, for a specific audience.

The audience is defined at the start of the session. The group decides: are we building for
the staff of a small animal shelter? The volunteers of a community radio station? The team
at an underfunded human rights organisation? The constraints of that audience shape every
decision that follows.

Participants produce a phishing simulation scenario tailored to that audience, using the
simulation tools covered in the Stormwatch sessions; a one-page reference card that the
audience will actually read rather than file; and a fifteen-minute session plan for a workshop
that does not involve anyone being made to feel foolish about what they did not know before
they arrived.

The test is whether another crew could pick up the materials and run the session without the
original builders present. Materials that pass this test have a long life. Materials that only
work when the person who made them explains them have a very short one, which is unfortunately
when most awareness materials end up: filed under done, never used again.

