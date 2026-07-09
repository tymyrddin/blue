# Operation Menagerie Watch

The Home for Bewildered Beasts of Legend goes everywhere, which is the point of it and the whole of the
danger. To find a basilisk that has fallen through the cracks of a world rebuilt without it, a field
worker has a reason to be in the bad part of every town, to ask after who has been seen and who has not,
and to be told. Across the Disc, from the Ramtops to Klatch to places the Circle Sea's writ has never
run, the Home's people listen for a living and write down what they hear. None of it is collected to be
useful to anyone but the creatures. All of it is the human terrain of half the Disc, in a detail no
ministry could buy, and the Office of Civil Surveys reads it without ever quite admitting there is
anything to read.

Shadow Wire, the unit the files number APT-62 and set in the same Borogravian stable as Shadow6 and
Shadow Hydra, did not go after the testimony where the city guards it. It went after the place the Home
guards nothing: a branch office in a non-allied capital, joined to headquarters by a site-to-site tunnel
that someone stood up years ago, on a budget, with a pre-shared key short enough to regret. Owning the
tunnel meant owning the feed, and owning the feed meant a name for every kind correspondent the Home has
ever had.

## In the field

- The Home for Bewildered Beasts of Legend: the Disc-wide welfare network whose reach is its asset and
  its liability in the same breath, running on goodwill, donor data, and a foreign cloud tenant it
  neither owns nor controls.
- Shadow Wire, APT-62: the Borogravian unit that went at the soft branch rather than the hard centre,
  cracked a tired tunnel, and walked in to read what the city reads.
- [The Office of Civil Surveys](../surveys/index.rst): the denied reader of the Home's testimony, now
  watching its own quiet source be read by someone else, and unable to lift a finger to protect it
  without admitting the source exists.
- The field workers: the welfare staff who never agreed to be anyone's asset, and who, seen from the far
  side of a border, are a foreign network under humanitarian cover, in danger the moment a name leaves
  the tunnel.

## Through the tunnel

Shadow Wire needed no exploit at the gate. It needed a key short enough to guess and a tunnel old enough
to trust it. The reconstruction:

1. The endpoint: a port sweep of the branch office's public range
   (`nmap -sS -p 500,4500,1194,943,8443 <branch-range>`) found `500/udp` open, the IKE port of an IPSec
   gateway, and `ike-scan -A -M <gateway>` fingerprinted it, an ageing concentrator still offering a weak
   proposal, `3des-sha1-modp1024`.
2. The key: against that weak proposal, `ike-scan --pskcrack --auth=3 --id=...` captured the IKE
   handshake, and `psk-crack -d rockyou.txt` returned the pre-shared key in about the time it takes to
   make tea, because it was a word in a list anyone can download.
3. The tunnel: wearing the key, Shadow Wire brought up its own IPSec connection (strongSwan, IKEv1, the
   same weak phase-1 the gateway still accepted) and landed a `tun0` address inside the Home's
   remote-access subnet, past the perimeter firewall without a shot fired at it.
4. The pivot: `ip route show` on the new interface listed what the tunnel was permitted to reach, and the
   permissions were as generous as the key was weak, a route straight through to the headquarters
   corporate subnet. `netdiscover` and a quiet `nmap -sn` drew the internal map, and a service scan
   (`nmap -sV -sC -O`) found the case-management server that holds the field reports before they sync to
   the foreign tenant.
5. The take: a single unpatched service later, a `meterpreter` shell, and `run persistence -U -i 60 -p 443`
   left a callback every minute so the read would survive the tunnel dropping. Then the search that was the
   whole point: the case histories, the chapter correspondence, the donor and member rolls, and, threaded
   through all of it, the field workers and the people in each town who speak to them kindly. It left over
   ordinary HTTPS, slow and unremarkable, while the Home's volunteers carried on rescuing beasts.

The Office sees it the way it sees everything it is not supposed to have: not on the Home's network, which
reports nothing, but on the far side, when a chapter's read on a border closing turns up in a Borogravian
appreciation a week before it reaches the desk that usually reads it first.

## Decision points

- Whether to warn the Home at all. Telling a welfare charity its tunnel is owned means telling it why the
  city cares, which is the one thing the relationship survives by never saying, and the warning that
  protects the field workers also confirms, to anyone listening, that they were worth protecting.
- Whether to roll the sources first. The Office can quietly move the most exposed correspondents before
  the names are used, which spends the source to save the person, and tells Shadow Wire by the pattern of
  who vanishes exactly which of its captures were the good ones.
- Whether to let the tunnel stand and feed it. Leaving the cracked key in place turns the breach into a
  channel the city controls, false reports going out to a reader who trusts them, at the price of every
  true thing already taken and every real worker still exposed while the game runs.

The tunnel buys an adversary the most detailed map of the Disc's human terrain that exists, and the names
to go with it, for the cost of a wordlist. Nothing in the Home broke. The beasts were fed on schedule.
The only thing lost was the safety of everyone who ever spoke to a welfare worker in confidence, which is
not a thing a patch restores.

## When the names get out

- The cover becomes a target. A field worker who reports kindly to a friend in the city is, read from
  Borogravia, a foreign asset under humanitarian cover, and a chapter in a non-allied capital is one
  accusation away from a welfare mission becoming a hostage situation.
- The map goes to market. The testimony is the same asset to an adversary that it is to the Office, only
  more so, and the most detailed human-terrain picture of half the Disc, suddenly for sale, is a standing
  intelligence win that needs no second break-in.
- The reader steers the read. An adversary inside the feed long enough does not only take, it can nudge
  what the Home goes to look at, the same quiet drift the Office itself was always one careless habit away
  from, now run by someone who wishes the city ill.

## Behind the kindness

- The impact family this belongs to, the testimony read and the sources named while nothing broke:
  [when nothing breaks and the secret is already gone](../counter/impact/confidentiality.md).
- The structural exposure, a charity's whole record on a foreign tenant it cannot control:
  [concentration and dependency](../counter/impact/concentration.md).
- The channel it left by: [counter moves on exfiltration](../counter/exfiltration/index.rst).
- The feed itself, the access the Office values and an adversary values more: [the Home across the
  Disc](../ngo/about/across-the-disc.md), and the periphery that reached for it, the Circle Sea
  [threat picture](../circle-sea/threats.md).
- The technical lab execution behind this narrative:
  [OpenHands: VPN Tunnel Pivot](https://red.tymyrddin.dev/docs/earthworks/openhands/vpn-tunnel-pivot.html).
Last updated: 13 June 2026
