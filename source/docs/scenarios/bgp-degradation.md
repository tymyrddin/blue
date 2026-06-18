# Operation Blight

Fungolia's frontier rides FungusFiber Internet, and for the fortnight the Mutually Suspicious Cooperation
Accord is being renegotiated, the frontier has a bad fortnight. Nothing is down. Pages bound for Fungolian
ministries load slowly, a committee's video call breaks up and recovers, a status board flickers amber and
clears, and every explanation on offer is duller than the truth. By the time the dull explanations run out,
the talks have spent days against the backdrop of a frontier that cannot quite be relied on.

No prefix was stolen. Shadow6, the Borogravian regency's cyber wing, did not come to take the frontier's
traffic but to make it feel fragile while the talks ran. Routing is a commons, so the Establishment, reading
the same global table everyone reads, can watch the paths lengthen and shift, and can see that every route
along them is valid. That is the trouble: there is nothing to reject. The city's stake is its own, its traffic
to and through the frontier rides the same souring paths, and a frontier that feels unreliable at the table is
worth more to Borogravia than one that is plainly down.

## On the backbone

- [FungusFiber Internet](https://red.tymyrddin.dev/docs/earthworks/fungusfiber/): the regional registry whose
  routes carry the frontier's traffic, and whose dependence on a handful of upstreams gives a hand on those
  upstreams somewhere to push.
- Shadow6, the Borogravian regency's cyber wing: under standing orders to paralyse, not to wreck, working a
  transit it holds in the frontier's path, steering rather than seizing, and timing the trouble to the Accord.
- [The Civic Defence Establishment](../establishment/index.rst): which reads the global table and sees the
  prepends and more-specifics for what they are, valid announcements, and which can prove nothing it would not
  also see on a genuinely bad week.
- [The Civil Observers' Society](../society/index.rst): the amateurs, posting cheerfully about FungusFiber's
  flaky season and the weather on the lines that climb toward the Ramtops, narrating a coercion as congestion.
- [The Circle Sea Arrangement](../circle-sea/index.rst): the talks themselves, where a frontier that stutters
  on cue is an argument no one had to make out loud.

## The slow souring

Shadow6 needed no break-in for this one. It needed a transit in the frontier's path and the patience to nudge
it, and the Establishment, reading the public table and a spread of traceroutes, reconstructed the shape after
the fact.

1. The map first: which upstreams FungusFiber leans on, which exchanges are load-bearing, and which Fungolian
   flows are latency-sensitive, read from RIPE RIS, RouteViews and historic traceroutes without a packet sent
   at the frontier.
2. The steering: from a transit it held, Shadow6 lengthened the path a chosen region saw by prepending its own
   ASN, while leaving another neighbour a clean announcement, so traffic shed onto worse paths for some regions
   and not others. Where it shared parallel links with a FungusFiber upstream, a raised MED pushed traffic off
   the clean fibre and onto a congested backbone hop.
3. The scoping: a more-specific of a Fungolian block, announced to a few peers only and tagged so it travelled
   no further than intended, pulled the chosen flows onto the chosen paths while the rest behaved normally, a
   fracture rather than an outage.
4. The discipline: every change spaced out, slow enough to stay under route-flap damping and under the
   thresholds a watcher keeps, so the result was loss and jitter that arrived like weather, never a flap and
   never a withdrawal that would read as an attack.
5. The timing: the worst of it landing on the mornings the Accord sat, and clearing on the days it did not.

What the Establishment sees, on its own registry, is a frontier whose paths are a little longer than they were
and a little different by region, every origin correct and every announcement valid, while its own users
report that Fungolian services are slow from some places and fine from others. There is no outage to point at
and no invalid route to drop. The shape is indistinguishable, packet by packet, from a fortnight of bad luck.

## Decision points

- Whether to call it an attack at all. Nothing is invalid, nothing is down, and the safe institutional reading
  is congestion on an ally's tired network. Naming it costs credibility if it is wrong and warns Borogravia if
  it is right.
- Whether to route around the frontier. The city can prefer diverse upstreams for its own traffic to Fungolia
  and blunt its share of the degradation, which it can do in hours, and which does nothing for Fungolia's own
  users or for the picture at the talks.
- Whether to say anything while the Accord sits. A public account of a deniable degradation, made mid-talks, is
  exactly the confirmation Shadow6 wants, that the frontier can be touched, said aloud by the victim; silence
  leaves the story to the Society and the dull explanations.

## When the routes turn

- The trouble tracks the calendar. It worsens on the mornings that matter and clears between, and when the
  talks turn it lifts altogether, the prepends falling away and the graphs flattening, leaving no incident with
  teeth.
- The leverage outlasts the routing. What Fungolia is left with is not damage but doubt, a frontier that felt
  fragile at the worst moment, and that impression sits in the room long after the paths are back to normal.
- The same hand can return. A transit that can sour the frontier for a fortnight can do it for the next round
  of talks, and the lesson the city takes is that a degradation it cannot prove is a weapon it cannot answer
  with a filter.

## Behind the announcement

- The class this belongs to, quality bent without a break:
  [availability under attack](../counter/impact/availability.md), and the exposure a few load-bearing upstreams
  concentrate, [concentration and dependency](../counter/impact/concentration.md).
- Reading a degradation that throws no invalid:
  [detecting inter-domain attacks](../counter/inter-domain/detection.md), where baseline deviation and
  control-plane and data-plane correlation do the work that alarms tuned for "down" cannot.
- The answer to a campaign no single incident describes:
  [posture for the long game](../counter/inter-domain/posture.md).
- The attacker's-side lab exercise behind this narrative:
  [Operation Blight](https://red.tymyrddin.dev/docs/earthworks/fungusfiber/blight.html).
