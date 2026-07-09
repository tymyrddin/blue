# Patch windows and the downtime tax

A patch closes a known vulnerability. Applying it closes a service, for as long as the reboot, the
regression test, and the change approval take. That is the trade the friction is made of: the
protection is immediate and the cost is an outage, and the outage is the part the business notices.

The gap that follows is not ignorance. Between a patch being released and a patch being deployed sits
a maintenance window that has to be scheduled, announced, and survived, and for many organisations
that window is weeks. Attackers reverse-engineer the patch to build the exploit in
days. The exposure is the difference, and it is created by the deployment friction rather than by
anyone failing to know the patch exists.

Some systems never get a window at all. A production line, a turbine controller, a payment switch, a
hospital system: anything that cannot stop is anything that cannot easily be patched, and the
exceptions list fills with exactly the systems whose compromise would hurt most. Over time the
unpatched surface is not the forgotten machines but the important ones, protected from downtime into
permanent exposure.

The emergency path is the release valve and its own risk. An out-of-band patch deployed without the
usual testing trades the vulnerability for a regression, and a bad patch that takes down the estate
is indistinguishable, on the morning, from the attack it was meant to prevent. The honest position is
that patch latency is a managed risk, and the management is mostly about which
exposures are carried deliberately, and for how long.
Last updated: 10 July 2026
