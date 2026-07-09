# Operation Double Bite

The Fungolian Department of Energy and Infrastructure keeps the country's grid schematics and tunnel-maps
underground, which is fitting, because that is where the rest of Fungolia keeps its government too. Two
states would pay a great deal for those vaults. Midnight Sun, the unit the files number APT-44, did not
pay. It came through the front door and the back at once, owned the ground for months, took what
it came for, and then set the building alight on the way out so that the theft would read as a disaster.

That last move is the whole point of the case, and the reason the Ministry of Digital Affairs keeps the
file open as a teaching one. FMDA arrived to a wiped network and an incident team already mobilising
against an obvious, total, satisfying enemy, and had to argue, against everyone's instinct, that the
destruction in front of them was the smaller crime. The fire was lit to be looked at.

The arrangement inherits this one whether or not the report names it. FDEI's schematics underwrite power
and tunnels the Circle Sea leans on and cannot rebuild twice, and what left in the encrypted archives,
weeks before the first machine died, was never Fungolia's loss alone.

## In the tunnels

- The Fungolian Department of Energy and Infrastructure (FDEI): the victim, its vaults of grid schematics
  and tunnel-maps the thing worth a war to two neighbours, guarded by a gateway nobody had patched and a
  staff curious about conference agendas.
- Midnight Sun, the unit the files number APT-44: the attacker that came through two doors at once, held
  the ground for months, and burned the place on the way out so the theft would look like the catastrophe.
- [The Fungolia Ministry of Digital Affairs (FMDA)](https://red.tymyrddin.dev/docs/earthworks/fmda/): the
  investigator, which walked into a wiped network and a panicking response and had to make the unwelcome
  case that the wiper was the diversion.
- The Circle Sea Arrangement: which leans on FDEI's grid and tunnels for infrastructure it cannot build
  twice, and which inherits the loss of the schematics whether or not it is told they left.

## Both doors at once

Midnight Sun did not pick one way in. It took two at the same hour, so that a patch on either would have
closed nothing, and FMDA reconstructed the marathon from the wreckage.

1. Both doors: a spearphish to a mid-level energy analyst carried a PDF, `Draft_Agenda_Energy_Symposium.pdf`,
   that looked like a real agenda from a real research institute and exploited a known reader flaw
   (CVE-2023-27333) to drop a Cobalt Strike beacon. At the same hour, automated scanners found the
   department's public VPN gateway running an unpatched version with a public exploit (CVE-2024-21762) and
   ran code on the appliance itself, an unauthenticated foothold in the perimeter zone that needed no
   password at all.
2. Closets to hide in: the beacon called home over HTTPS from the analyst's workstation, and the VPN
   appliance got a hidden account and a web shell, two separate ways back, both dressed as ordinary
   administrative traffic.
3. The master key: from the workstation, Mimikatz dumped credentials out of memory, pass-the-hash carried
   them onto the file shares, and the attacker watched the network until an administrator logged in, took
   that account too, and walked by remote desktop straight onto the domain controller. With the directory
   owned, it forged golden tickets that would let it back in long after any password changed, and left
   scheduled tasks and a web shell on the department's document server for good measure.
4. The quiet heist: for months it drew off what it came for, the grid schematics, the tunnel-maps, the
   strategic energy correspondence, compressed into encrypted archives and trickled out over
   ordinary-looking HTTPS to servers in another country, always under the thresholds the loss-prevention
   rules watch.
5. The diversionary fire: when the last archive was out, Midnight Sun deployed a wiper, a variant of the
   HermeticWiper family wearing ransomware's clothes, that overwrote the boot records and system files on
   a handful of critical machines and left them unrecoverable. The incident team mobilised against a
   destructive attack, the department's whole attention turned to the smoke, and the months-long theft
   underneath it went unremarked.

FMDA's report makes the point nobody in the recovery wanted to hear: the wiper was loud because loud was
the job. It gave the responders a clear enemy and a clean story while the real loss, quiet and weeks old,
sat in an archive on a server abroad.

## Decision points

- Whether to treat the wiper as the incident. Rebuilding the burned machines and calling it contained is
  the fast and satisfying answer, and it is the answer the attacker designed for, since every hour spent
  on the smoke is an hour not spent finding what left in the encrypted archives.
- Whether to assume the credentials are all gone. With golden tickets forged from the domain controller,
  no password reset closes the door; the honest response rebuilds the directory's trust from the ground,
  which is slow, ruinous to operations, and the only thing that actually evicts the attacker.
- Whether to count the loss the report would rather not. The schematics and tunnel-maps underwrite
  infrastructure the arrangement shares, so naming the full theft means telling the alliance its own
  dependency was read, which is a harder committee meeting than announcing a wiper and a recovery.

The fire buys the theft its cover. A wiper is loud, total, and easy to understand, which is exactly why
it works as misdirection: it hands the responders a clear enemy and a clean narrative while the real
crime sits quiet and finished elsewhere. Looking only at the smoke misses the reason for the fire.

## When the fire starts

- The story writes itself wrong. The wiper hands everyone a destructive-attack narrative, the recovery
  becomes the whole project, and the exfiltration is filed, if at all, as a footnote to a disaster that
  was never the point.
- The door stays open. The golden tickets and the scheduled tasks survive the rebuild of the burned
  machines, so an attacker declared evicted is still holding keys, waiting for the noise to settle.
- The next fire is already laid. A department that learns to read the wiper as the attack will meet the
  same diversion again, because the lesson it took was about backups and boot records, not about the
  silent read the fire was built to hide.

## Behind the smoke

- The impact family this belongs to, the secrets read and gone while the fire drew every eye:
  [when nothing breaks and the secret is already gone](../counter/impact/confidentiality.md).
- The cover that hid it, destruction used as misdirection:
  [destruction and extortion response](../counter/impact/response.md).
- The trusted directory turned all the way over, golden tickets and all:
  [administrative hijack](../counter/impact/administrative-hijack.md).
- The channel the months-long theft left by:
  [counter moves on exfiltration](../counter/exfiltration/index.rst).
- The shared infrastructure a breach like this exposes:
  [concentration and dependency](../counter/impact/concentration.md), and the Circle Sea
  [threat picture](../circle-sea/threats.md).
- The technical lab execution behind this narrative:
  [FMDA: The Double Bite](https://red.tymyrddin.dev/docs/earthworks/fmda/double-bite.html).
