# Operation Spore Cloud

The same registry, hit a second way. FungusFiber Internet is still the frontier's local registry, its
core routers still announcing which way the packets go, but this time the hand on it is not a Borogravian
operator working through the night. It is a machine, run from across the water by Deep Vector, the cyber
arm the red files number APT-99, one modernising faction of the Agatean court that has decided the Circle
Sea is worth a model's attention. The framework compresses what used to take a room of specialists into
an afternoon: it reads the registry's public footprint, writes the perfect lure, finds the way up, and
times the hijack to the minute, none of it touched by a human hand.

This one needs no tap either, for the same reason the last did not. Routing is public. The Establishment
runs Ankh-Morpork's own registry and watches the global table, and it caught the bad origin the instant
it propagated. The trouble is the clock. The machine announced its route, took what it wanted, and
withdrew it again inside a window built to be shorter than the time it takes a human desk to decide
whether to ring an alarm.

## On the public table

- [The Agatean Empire](../circle-sea/threats.md), Deep Vector (APT-99): a court faction running generative
  models and automated parsers to map, lure, and hijack the frontier's registry from thousands of miles
  off, never auditing a line by hand.
- [FungusFiber Internet](https://red.tymyrddin.dev/docs/earthworks/fungusfiber/): the regional registry
  again, its exposed support logs, legacy customer portals, and soft internal boundaries the ideal
  feedstock for rapid machine categorisation.
- [The Civic Defence Establishment](../establishment/index.rst): which runs the city's own registry and
  watches the global table, now reading a hijack that arrives and departs faster than its analysts can
  write it up.
- [The Civil Observers' Society](../society/index.rst): the amateurs, cataloguing the suspiciously flawless
  advisories crossing the support channels as unusually efficient administrative updates, missing the
  machine underneath.

## At machine speed

Deep Vector sent no operators. It set a framework on FungusFiber and let it do the reading, the writing,
and the timing, and the Establishment reconstructed the shape from the public table.

1. The survey: the framework correlated FungusFiber's public footprint, status blogs, registry
   allocations, role profiles, into a ranked list of soft spots without sending a packet: perimeter admin
   portals on weak or legacy credentials, the staff worth a tailored phish, and staging nodes quietly
   bridged into the production core.
2. The perfect lie: a generative writer, fed the local technical vernacular scraped from a public
   engineering forum, produced an internal notice from the network manager about BGP route flapping,
   urging a junior engineer to audit a linked routing template, in context-perfect British English with
   not a tell in it, the kind of note that slides past every text filter because there is nothing wrong
   with it.
3. The shortcut up: on a low-privilege support shell, a parser read the host's configuration and isolated
   the way up in seconds. The support profile could run `/usr/bin/tcpdump` as root without a password, and
   tcpdump's post-rotate command feature is a known door from a restricted sniffer to an interactive root
   shell.
4. The model of the hijack: rather than announce blind, the framework simulated the route first,
   projecting how a more-specific `/24` advertisement against FungusFiber's customer banking block would
   converge across the wider internet, and how likely the external route monitors were to catch it inside
   a five-minute window. It chose the window the model called quiet.
5. Becoming the path: the `/24` went out for its five minutes, the wider internet re-pointed the banking
   block's traffic through the rogue node, a transparent proxy captured and indexed it and passed it on
   untouched, and the window closed before the monitors had finished deciding whether to alarm.

What the Establishment caught, on its own registry, was the more-specific origin the instant it
propagated, RPKI-invalid and gone again in five minutes, a hijack measured in the time it takes to notice
one.

## Decision points

- Whether to pre-commit the rejection. The Establishment can enforce RPKI and strict route-origin
  validation on its registry now, so the next invalid origin is dropped automatically rather than chased
  by hand, which is the only defence that keeps pace with a five-minute hijack, and which protects only
  the networks that have already done it.
- Whether to sharpen the monitoring. Faster, more sensitive route monitors catch the short hijacks the
  slow ones sleep through, at the cost of an alarm that cries wolf at every legitimate flap, which is its
  own kind of blindness.
- Whether to harden the human edge instead. The whole chain turned on a flawless note and an
  over-privileged support box, and tightening the boring things, multi-party sign-off on urgent config
  changes, support systems walled off from the core, MFA on every admin channel, removes the rungs the
  model climbed, slowly, against an attacker that does not tire.

What the automation buys is speed and a clean accent. A lower-tier actor runs a campaign that used to need
a room of specialists, in an afternoon, in flawless local English, and finishes inside the window the
monitors were built to miss. The cleverness is not in the exploit. It is in how little time any of it
took.

## When it converges

- The hijacks get shorter than the response. As the model tightens its windows, each diversion ends before
  a human can be woken, and a defence that depends on someone noticing stops being a defence at all.
- The lure pool deepens. Every flawless notice that works trains the next, and a generative writer that has
  read the frontier's own vernacular can produce them faster than the staff can learn to doubt them.
- The reach is not regional. A framework that can model FungusFiber's convergence can model any registry's,
  and an attacker who never has to be in the room can hold a dozen frontiers' routing under review at once,
  picking quiet windows on all of them.

## Behind the model

- The impact family this belongs to, where a provider's own tools and trust become the trap:
  [administrative hijack](../counter/impact/administrative-hijack.md).
- The routing layer siphoned, and the validation that answers it:
  [availability under attack](../counter/impact/availability.md), [BGP origin validation](../counter/network/exposure.md),
  and [hunting a route-origin hijack](../counter/network/runbooks/bgp-hijack-hunt.md).
- The peer that isn't, running its court's machine against the frontier: the Circle Sea
  [threat picture](../circle-sea/threats.md).
- The technical lab execution behind this narrative:
  [FungusFiber: hijacking the ISP](https://red.tymyrddin.dev/docs/earthworks/fungusfiber/hijack-isp.html).
