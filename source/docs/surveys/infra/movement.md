# Moving and separating

Collection is useless unless what is collected can move, and movement is exactly where the
discipline of an estate shows. This page covers three things that read as one problem: the
networks that carry material, the ladder that sorts it by harm, and the guarded crossings
between the rungs.

## Transport

One of the least visible parts of the estate, and among the most important. The components are
ordinary enough to list: dedicated lines, classified networks kept apart from anything public,
enciphered clacks, deployable semaphore for the field, and couriers for the things that travel
under seal because no wire is trusted to carry them.

What sets these networks apart is what they are built around. A commercial carrier optimises for
cost. A service network optimises for working during a siege. Those are different goals, and they
produce different architecture: more redundancy than efficiency would justify, routes that
survive a tower going dark, and a willingness to pay for capacity that sits idle until the day it
is the only thing left running.

## The classification ladder

Many people picture classification as a label on a document. It is closer to a property of the
architecture. Material at different levels of harm tends to live in physically or logically
separate worlds, each with its own networks, its own storage, its own rules for who may reach in.

A simplified ladder runs from the open end to the sealed:

```text
Open
  ↓
Official-sensitive
  ↓
Restricted
  ↓
Confidential
  ↓
Secret
  ↓
Sealed
```

The city's own version of this ladder runs the same way. The open end lives on rented compute and
is treated as a default; the sealed end sits behind walls the city controls and uses no rented
golem at all. The grey middle is broad, and most of the interesting arguments happen there.

The ladder is not the city's invention. Its shape and most of its vocabulary come from the
[standing arrangement around the Circle Sea](../../circle-sea/index) that everyone treats
as binding and no one quite calls a treaty. The shared scheme is what lets material cross between allies at all: a thing marked
restricted in one capital is meant to be held as restricted in the next.

## The crossings

The estate is not really a stack of layers. It is a set of separated worlds that talk through a
small number of controlled crossings, and the crossings are the actual design. Anyone can buy
compute. The work, and the cost, is in the bridges.

A crossing between two worlds is built to be difficult on purpose. Material moves upward more
freely than down: a lower world can hand something to a higher one, often aggregated or stripped
of detail on the way. Downward is the guarded direction. Material rarely descends without being
filtered, downgraded, or rewritten into a form safe to hold below, and some of it never descends
at all.

The ordinary mechanisms are cross-domain guards, content-inspection engines, release workflows,
manual review, protocol filtering, and, where the requirement is absolute, a data diode. A data
diode is a one-way door: information can travel in one direction and physically cannot return.
Enforcing that property in hardware is generally trusted more than enforcing it in software,
because in a place that assumes compromise, a wire that cannot carry a reply is easier to believe
than a programme that promises not to.

This is the part worth lingering on, because the crossings are the attack surface. The summary
that goes up is an interpretation. The downgraded picture that comes down is an interpretation.
Someone who shapes what passes a crossing shapes what the world on the far side believes, without
touching anything operational. Every transfer is logged, and the log is kept somewhere the people
doing the transferring cannot quietly amend, precisely because whoever owns the crossing owns the
belief on the other side of it.
