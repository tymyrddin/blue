# Operation Broken Trust

Ankh-Morpork spent a fortune hardening its cellars against exactly this enemy, hardened relay, segregated
management networks, the lot, and none of it was touched, because none of it had to be. A defence pact is
a promise to act together, and acting together means a permanent software bridge: Fungolian developers
holding automated deployment rights that reach across the border straight into the city's management
core. The most expensive wall on the Disc is worth precisely what the least careful clerk on the far side
of that bridge is worth, and on the morning in question that turned out to be very little.

Shadow6, the Borogravian regency's premier intelligence wing, brought nothing premier to the job, and did
not need to. It phished one Fungolian developer with a macro in a document, read a password out of a file
somebody forgot to delete, and followed a build token a developer had hardcoded into a repository, and at
the end of that unremarkable little chain it held root on the server that pushes software to every
military branch the city owns. There was no master key. The ally left the back door open, the city's own
house keys were written on a scrap of paper in the ally's desk, and the Borogravians walked in.

The Office of Civil Surveys watched the whole thing from its taps on the international gateway, with the
particular cynicism of a professional service watching a fortune in defence grid undone by a single
careless click. The failure was not a software bug. It was a treaty bug, and there is no patch for a
treaty.

## Across the bridge

- [Fungolia](../circle-sea/members.md), the MycoSec dev tenant: the ally whose internal development
  segment is the entry point, and whose developers hold automated deployment rights into the city's own
  infrastructure, which means one careless laptop in their ministry is the whole of the city's exposure.
- [The Civic Defence Establishment](../establishment/index.rst): which segregated its management network
  into a secured VLAN, pronounced it safe, and never once costed the trusted deployment path the treaty
  drove straight through the wall it was so proud of.
- [The Office of Civil Surveys](../surveys/index.rst): the secret service, tracking from its posts on the
  border gateways the Borogravian stroll from a Fungolian desktop into the city's own administration core,
  and saying, to no one, exactly what it thinks of allies.
- [The Civil Observers' Society](../society/index.rst): the amateurs, who spotted the odd outbound HTTPS
  to a suspected Borogravian listener and are happily publishing circulars about it, not knowing the
  secret service is reading the same packets to map the apparatus behind it.

## The crossing

Shadow6 brought no zero-day and needed none. Every door on the path was already open, and the Office
logged the walk-through with the weary patience of professionals watching amateurs.

1. The lure: the oldest trick there is, and it worked first try. A spear-phishing mail to a developer in
   Fungolia's MycoSec division carried a macro-enabled file, `Q2_Research_Objectives.docm`. One click on
   Enable Content ran the embedded script, and an encrypted HTTPS reverse shell opened back to a
   Borogravian listener (`nc -nvlp 443`), outbound on 443, indistinguishable from any other web call.
2. The sift: on the domain-joined workstation, a `grep` through the user's home turned up a forgotten
   `.env` with a plaintext password for an internal service account, and `netstat` showed an SSH tunnel
   to a development server whose fingerprint was already sitting, trusted, in the local `known_hosts`.
3. The hop: the harvested credentials logged straight into the Fungolian dev host
   (`service_account@DEV_SERVER`). A `sudo -l` showed the account could run an automated Python admin
   tool as root, and `git log` on that tool's repository led to `config.py`, where a developer had left,
   in plaintext, the bearer token that authenticates automated builds into Ankh-Morpork's central
   deployment server. It had been sitting there being a catastrophe for as long as anyone cared to look.
4. The crossing: the config named the destination, the city's management cluster (`MGMT_SERVER`). Wearing
   the stolen token, the attacker walked the city's perimeter firewalls as the legitimate Fungolian build
   system, queried the management API
   (`curl -H "Authorization: Bearer ..." https://MGMT_SERVER/api/v1/systems/`), and the platform handed
   back the full layout, because a trusted partner is not asked twice. The API carried a
   command-execution endpoint, so a weaponised payload to `/api/v1/command/` ran with no second factor,
   and a root reverse shell dropped back to Borogravia (`nc -nvlp 4444`). The server that deploys software
   to every branch of the city's forces now answered to the regency.

Nothing on that list is clever. Every step is a thing a checklist would have caught, on the far side of a
border the city is not allowed to audit.

## Decision points

- Whether to sever the Fungolian bearer token at once. Invalidating it cuts the Borogravian root access
  in a breath, and tells Shadow6 in the same instant that the game is up, and ends the city's live read of
  which of its own systems the regency has been touching.
- Whether to slip a proxy between the two networks. The Office can stand a deep-packet inspection proxy
  between the Fungolian dev VLAN and the city's management zone, and quietly drop the command-execution
  payloads while letting genuine builds through, holding the door half-open so the attacker keeps
  believing it is wide.
- Whether to let the Society break it. The amateurs are a circular away from announcing the rogue HTTPS
  in public, and the Office can let them, and use the hobbyists' noise as the reason it resets the
  alliance's master tokens, without ever admitting it watched the whole pipeline itself.

The bitter lesson the morning teaches is that a state's defences are only ever as strong as the
poorest-trained clerk in its partner's ministry. Shadow6 did not pick a lock or crack a cipher. It found
an ally who left the door open and the city's keys on a scrap of paper, and every part of the path it
walked was a privilege the city had granted, in writing, on purpose.

## When the trust turns

- The bridge becomes a weapon. With root on the management server, the regency can rewrite the automated
  software updates pushed to every subordinate branch, and turn the city's own maintenance routine into a
  distribution pipeline for whatever it likes.
- The presence hides in the legitimate. The reverse shell rides a built-in administrative process, so the
  signature watchdogs see an authorised application running authorised commands, and the persistence
  survives the patch cycles meant to clear it.
- The shooting starts before the message. If the access is used to edit the troop-deployment ledgers
  along the border before the Office can move, the Borogravian regulars slip the frontier unseen, and the
  alliance is in a war before a single diplomatic clacks has been sent.

Which is the whole of what the campaign was ever about. Geography is dead, the network is everything, and
a state's closest friend is its largest unmonitored vulnerability.

## Behind the token

- The impact family this belongs to, where a legitimate cross-boundary build privilege becomes the attack
  path: [administrative hijack](../counter/impact/administrative-hijack.md).
- The structural hazard of anchoring the city's core to a partner it cannot inspect:
  [concentration and dependency](../counter/impact/concentration.md).
- The exposure the whole block is built on, the access granted to a trusted ally: the Circle Sea
  [threat picture](../circle-sea/threats.md), on the enemy inside the access.
- The technical lab execution behind this narrative:
  [Mycosec: Operation Broken Trust](https://red.tymyrddin.dev/docs/earthworks/mycosec/broken-trust.html).
