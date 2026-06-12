# Operation Shadow Protocol

There is a particular kind of confidence that comes from owning a thing nobody else has yet learned to
attack, and the Singularity facility was built entirely out of it. A pure, modern IPv6 research network
run by the city's closest ally, Fungolia: no legacy copper, no backward compatibility, nothing the
ordinary civic grid could so much as address. The engineers called it a sanctuary. What they had built,
without quite noticing, was a network that asks the wire who to trust and believes the answer.

Ankh-Morpork's own master ledgers stay where they have always stayed, in cellars with no address, under
a city that learned long ago that darkness and cold encourage the wrong sort of civic participation. But
a partner cannot be a partner and be told nothing. By treaty the city mirrors two things across to the
Singularity tier so the two can coordinate a defence: the border troop-deployment ledgers, and the
alliance's master clacks routing keys. The cellar is pristine. The mirror is the problem.

Borogravian state intelligence, the unit the red files call Shadow6, has owned the mirror for three
weeks, quietly, and turned a trusted treaty channel into a siphon. Nothing touched the city's walls. All
of it ran on the access the city granted freely, last winter, in writing. And the city knows, because
the most-trusted ally is the one watched most closely, and the Office of Civil Surveys has been
sitting on the wire the whole time.

## On the wire

- [Fungolia](../circle-sea/members.md): the closest ally and the most watched, whose Singularity tier
  has been thoroughly owned and who does not yet know it. It holds duplicate copies of the city's border
  plans by right, which makes its weakest server the city's existential exposure, and not a thing the
  city is permitted to walk in and fix.
- [The Civic Defence Establishment](../establishment/index.rst): which signed off on the mirror as a
  triumph of alliance engineering and is learning, this morning, that a secret copied is a secret with
  two doors, and that it holds the key to only one of them.
- [The Office of Civil Surveys](../surveys/index.rst): the civic body that is not, on paper, a security
  service, whose interception has been reading the Singularity border for months out of the same instinct
  that has it reading every ally it has ever had. The taps are the Office's. So is the silence about them,
  which is the more expensive secret of the two.
- [The Civil Observers' Society](../society/index.rst): the volunteers, hobbyists and puzzlers who notice
  things for sport, currently watching the flashpoint periphery for the next small war between Borogravia
  and Zlobenia, and missing, entirely and loudly, that the Borogravian threat they are squinting at across
  the valley is already inside the access the alliance signed last winter.

## Through the border tap

The wire looked silent because a pure-protocol network carries no legacy traffic to watch. But the
Office's interception on the shared border gateways recorded the Borogravian chain in full, and
reconstructed the rest from the segment's own behaviour.

1. The foothold: a valid IPv6 research key, left in a public repository, gave Shadow6 a low-privilege
   shell on a routine Fungolian node. The terrain was confirmed pure, no IPv4 address or route on the
   host, only a global address and a default gateway, which made the gateway the target.
2. The reconnaissance: no noisy scan. `passive_discovery6` sat on the wire for several minutes and
   mapped the neighbouring hosts from their own neighbour-discovery chatter, and a quiet `nmap -6`
   against the gateway's link-local address found its web management interface open.
3. The takeover: a `curl` to the management API returned the router's model and version, and a
   proof-of-concept against a known command-injection flaw in its configuration API dropped a reverse
   shell back to a waiting `nc -6` listener. Root on the core router, the single source of truth for the
   segment.
4. The false authority: a rogue DHCPv6 server (`wide-dhcpv6`) and a poisoned RDNSS option named the
   attacker as gateway and resolver, and an injected Router Advertisement with a better metric made the
   Borogravian foothold the preferred default route. A `dhclient` renew on the targets pulled the new
   map down, and configuring themselves by SLAAC the hosts rewrote their own routing and resolution to
   match.
5. The lateral move: with the network resolving through it, the attacker ran `dnschef` to point the
   shared authentication name at a credential page of its own, took an administrator's login, and used
   it to reach the high-value research server, which still accepted a legacy `ssh-rsa` host key.
6. The siphon: it packed the mirrored ledgers and keys with `tar` and `openssl`, split them into small
   fragments, and shipped them out with `icmp6_exfil`, encoded in the payloads of ICMPv6 echo requests
   aimed at a dead address it controlled, reassembled on the far side with `icmp6_sniff` and decrypted.
   To the segment it was routine diagnostic ping.

The Office sees the shape of all of it on the boundary: a host that suddenly routes through an
unauthorised link-local address, a default route that changed with no change behind it, and a patient
trickle of echo requests to an address that never answers.

## Decision points

- Whether to block Fungolia's prefixes at the border. Severing the link stops the leak inside a minute.
  It also tells Borogravia the drain has been found, and tells Fungolia, in front of the whole
  arrangement, that the city has been reading its closest ally's internal traffic for months. One of
  those admissions is a tactical loss. The other is a treaty crisis the city would have to survive in
  daylight.
- Whether to feed the pipeline instead. The Office holds the tap from both ends, so it can do worse to
  Borogravia than stop the theft: leave the siphon running and pour false troop movements down it, and
  let a regency on the Zlobenian border plan its war off a map the city is drawing. The cost is that
  every hour the deception runs is an hour the real keys are still leaving beside it.
- Whether to look hard at the city's own cellars. The exploit is less a Fungolian failing than a
  property of the pure-protocol networks the city is busy building at home, and the morning forces the
  question of whether to cripple its own shiny new efficiency, hand-addressing what was meant to
  configure itself, before the same chain runs one day on a server with no ally to blame.

The mirror buys the attacker everything the cellar would have, at none of the cost and none of the risk.
The walls are intact, the guards are at their posts, and the city's border plans are on a foreign server
in a rival's hands, carried there by the city's own treaty and read off the wire by the city's own spies,
who cannot say a word.

## If it digs in

- The persistence stops being removable. Fungolia's switching layer never had the guards the protocol
  assumes someone enabled, so the rogue advertisements have written themselves into the endpoints' own
  flash. A hard reboot does not clear the attacker; it reinstalls him, politely, from the machines' own
  memory, and Fungolia cannot scrub a network it no longer authoritatively configures.
- The keys reach Borogravia, and the alliance goes blind in the dark. With the master clacks routing
  keys in hand, a regency that cannot field a modern army can read, redirect, or quietly drop the
  alliance's traffic at will, and the first the Establishment hears of a column moving down the valley
  is when it is already through.
- The watchdog files it as housekeeping. Golem Trust Computing's automation notices the mass
  fragment-and-encrypt, reaches for containment, then reads the rogue configuration as a maintenance
  window authorised under the Fungolian access, and stands down while the drain finishes in full and
  certified compliance.

## Under the protocol

- The impact family this belongs to, where the architecture's own automation is the threat:
  [administrative hijack](../counter/impact/administrative-hijack.md).
- The routing and naming layer turned into the lie: [availability under attack](../counter/impact/availability.md),
  [IPv6 first-hop security](../counter/network/exposure.md), and
  [hunting IPv6 first-hop attacks](../counter/network/runbooks/ipv6-first-hop-hunt.md).
- The covert channel the data left by: [counter moves on exfiltration](../counter/exfiltration/index.rst).
- The exposure a trusted ally's access always is, named in the alliance's own planning: the Circle Sea
  [threat picture](../circle-sea/threats.md), on the enemy inside the access, and
  [Fungolia in the roster](../circle-sea/members.md).
- The technical lab execution behind this narrative:
  [Mycosec: Operation Shadow Protocol](https://red.tymyrddin.dev/docs/earthworks/mycosec/shadow-protocol.html).
