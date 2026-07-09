# Operation DHCP Deception

The city's remote dependencies are held together by lines nobody looks at. The outer posts and the
allied research branches gave up couriers a generation ago; they reach the core down encrypted IPsec
and OpenVPN tunnels, and to the Establishment those tunnels are a wonder of the age, secure vaults
driven clean through the public mud. The wonder has a flaw nobody costed: a vault is only ever as safe
as the signpost that points to its door. Shadow Hydra, the Borogravian unit the red files number
APT-29, does not pick the lock. It moves the signpost.

The keys it is moving toward are not, strictly, the city's to lose twice. Ankh-Morpork's masters sit
in their cellars. But by treaty the alliance's master clacks keys are mirrored into a Fungolian
research branch, so two capitals can read the same traffic and call it cooperation, and that mirror is
where the signpost leads. Own a public VPN gateway, poison the protocol that hands out the local map,
and the whole shared infrastructure becomes a funnel aimed at the one copy the city does not guard.

Borogravia does not want Ankh-Morpork. It wants Ankh-Morpork blind. The clacks keys are exactly the
ones that let the city read the traffic along the trade roads through the valley it has watched
Borogravia and Zlobenia bleed over for a century, and a regency minded to move on Prince Heinrich would
rather the alliance were looking elsewhere when it does. A state too devoted to Nuggan's Abominations to
keep the colour blue legal two seasons running, and far too poor to field a modern army, can still
afford a Shadow Hydra, and that asymmetry is the whole of the threat. That the theft runs through
Fungolia is the bonus prize: an alliance that catches its own ally bleeding its secrets turns inward and
litigates, and an alliance litigating is an alliance not watching the valley.

The Office of Civil Surveys sits on the gateway segment, classification-grade captures running, and
reads the operation off the wire in cold forensic order while the volunteers outside are still trying
to assemble it from broken clacks.

## On the tunnel

- [Fungolia](../circle-sea/members.md): the ally whose research branch rides the city's remote VPN
  architecture and keeps the mirrored clacks keys by treaty. When its workstations are quietly handed a
  new map, the mirror is what bleeds, and Fungolia is the partner the city will be sorely tempted, and
  exactly meant, to blame.
- [The Civic Defence Establishment](../establishment/index.rst): which bought the cryptographic
  strength of the tunnel and never costed the map that points to it, and which needs the very keys now
  walking out the door to watch the very border Borogravia is busy clearing.
- [The Office of Civil Surveys](../surveys/index.rst): the secret service that is not called one, whose
  passive captures on the gateway subnet hold Shadow Hydra's entire pipeline in evidence-grade detail,
  and whose problem is no longer seeing the theft but admitting it.
- [The Civil Observers' Society](../society/index.rst): the attic puzzlers, who spotted the rogue server
  on the wire because spotting things is what they do for love, and who are now drafting a loud public
  fix for a breach the city is watching in deliberate silence.

## The poisoned map

The attack came not as a battering ram but through the network's routine administrative habits, caught
step by step on the Office's captures.

1. The gateway breach: Shadow Hydra scanned the public perimeter and found the gateway's OpenVPN
   (UDP/1194) and WireGuard (UDP/51820) endpoints on 192.168.1.5. Rather than break the cryptography it
   exploited an authentication bypass on the public interface, ran a command injection, quietly dropped
   a backdoor administrator onto the box, and pulled the internal blueprint (192.168.2.0/24).
2. The misdirection: from inside the gateway it ran `dnsmasq` as a rogue DHCP service and fired
   release-and-renew at the research workstations, which took the rogue server's instructions and set
   the attacker's foothold (192.168.1.254) as their default gateway. Not a single lock was broken, and
   every byte the lab sent now ran through a Shadow Hydra intercept.
3. The plaintext harvest: with the traffic flowing through its node, the attacker enabled IP forwarding
   to keep the wire looking healthy and ran `tcpdump` toward the research server (192.168.2.100). The
   trap snapped on a routine oversight, an unencrypted login window, and handed over plaintext
   credentials, `researcher` and `MycoSec2025!`, straight off the wire.
4. The pivot and siphon: with valid credentials the attacker opened an ordinary authenticated SSH
   session into the research archive, found the mirrored master cryptographic data, compressed 2.5 GB,
   and smuggled it out in fragments down a covert DNS tunnel (`dnscat2`), disguised as a routine volume
   of lookups to an outside domain.

## Decision points

- Whether to let the Society's cleanup run. The volunteers have found the rogue DHCP server and are
  happily building a public script to evict it. It would mend the routing by lunchtime. It would also
  tell Shadow Hydra, in the same keystroke, that it is being watched, and blow a surveillance the Office
  has spent months building and will never get back.
- Whether to accuse Fungolia at all. An ally caught leaking the city's keys is a scandal the arrangement
  will demand to litigate, which is precisely the second half of the plan the keys were only the deposit
  on. Say nothing and the keys keep bleeding; say it loud and the city hands the periphery, gift-wrapped,
  the quarrel Shadow Hydra came to start.
- Whether to isolate the research segment. Cutting the trusted route between the gateway subnet and the
  crypto cell on 192.168.2.0/24 saves the keys and freezes the coordination, and the coordination is the
  thing the city built the mirror for in the first place, the thing it needs to watch the very border
  the theft is meant to clear. There is no version of this that does not cost the city something it
  wanted.

The poison buys a perfect map to a false door. No lock was forced, the tunnels held their encryption to
the last, and the master keys walked out the front of an archive that reported itself in the best of
health the entire time.

## When it normalises

- The watchdogs see an employee. The attacker moved on a real, authenticated session with a real,
  stolen credential, so the host-layer alarms read the intrusion as a researcher doing their job, and a
  researcher doing their job is the one thing no alarm fires on.
- The drain becomes the weather. Left alone, the covert tunnel settles into a low, slow, permanent
  murmur, and every new clacks key the city mints is mirrored to the periphery, by treaty, before it is
  ever put into service, so the alliance is reading compromised traffic the day it switches the keys on.
- The quarrel arrives on schedule. Borogravia leaks just enough to let the city catch Fungolia
  red-handed, the arrangement freezes its own ally out to argue the breach, and somewhere south a
  regency walks a column down a valley nobody upstream is watching any more.

## Behind the map

- The impact family this belongs to, where trusted configuration is turned into a trap:
  [administrative hijack](../counter/impact/administrative-hijack.md).
- The layer manipulated to rewrite where traffic goes: [availability under attack](../counter/impact/availability.md),
  [IPv6 first-hop security](../counter/network/exposure.md), and
  [hunting IPv6 first-hop attacks](../counter/network/runbooks/ipv6-first-hop-hunt.md).
- The covert channel that walked the data past the perimeter:
  [counter moves on exfiltration](../counter/exfiltration/index.rst).
- The periphery, the players, and why a war that means nothing to the city still cuts its roads: the
  Circle Sea [threat picture](../circle-sea/threats.md), on the enemy inside the access.
- The technical lab execution behind this narrative:
  [Mycosec: Operation DHCP Deception](https://red.tymyrddin.dev/docs/earthworks/mycosec/dhcp-deception.html).
Last updated: 13 June 2026
