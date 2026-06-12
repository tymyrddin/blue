# Operation Neural Ghost

The Grand Trunk, the banking ledgers, and the automated corporate machinery tie the Circle Sea together
more tightly than any border on a map, and while the Establishment keeps its eyes on the horizon,
watching for an army that marches, geography has been quietly losing to the network. The decisive
vulnerability moved years ago. Nobody filed the paperwork.

This one does not come from the muddy periphery. It comes from across the water, from the Agatean
Empire, the peer that isn't: vast, ancient, certain of its own centrality, and famous in every
assessment ever written for the single fact that it is not coming. Its energies turn inward, on a
bureaucracy of immense age and an elite of immense detachment. The catch is that it takes only one
faction at the Grand Court to decide the Circle Sea is worth a look, and one has. Its cyber arm, Deep
Vector, the unit the red files number APT-99, has not sent operators to rattle doors. It has sent a
machine that thinks, an autonomous, self-correcting framework, and pointed it at Golem Trust Computing,
the Ankh-Morpork firm on whose shared compute half the alliance, Fungolia's research included, quietly
runs.

The way in is the Fungolian tenant's development corner, a soft edge on a hard cluster. The prize is
the Cortex, where the alliance's diplomatic and cryptographic files are processed, and beyond the
files, the structural map of every automated control that guards the Circle Sea. The Office of Civil
Surveys, on the Golem Trust links, watches an Agatean spectre move through signature defences it never
trips, because it never does the same thing twice.

## In the cluster

- [The Agatean Empire](../circle-sea/threats.md), Deep Vector (APT-99): the distant, silent superpower,
  or rather one modernising faction of a court that mostly wishes the foreign would go away, running an
  autonomous framework to map and harvest the West while the rest of the Empire looks the other way.
- [Golem Trust Computing](../org/index.rst): the single largest shared dependency the alliance has,
  whose Cortex cluster processes the diplomatic and cryptographic traffic of the whole bloc, and which
  is being cleaned out through a Fungolian tenant nobody thought to guard.
- [The Civic Defence Establishment](../establishment/index.rst): still watching the border for a column,
  blind to a threat that arrived as a configuration and thinks faster than any clerk it has.
- [The Office of Civil Surveys](../surveys/index.rst): the deep-state service that concluded years ago
  that geography was dead, now tracing an autonomous intrusion that leaves no fixed signature to match,
  only behaviour.
- [The Civil Observers' Society](../society/index.rst): the amateurs, picking up strange fluctuating
  noise on the public clacks and writing fervent manifestos about a ghost in the automation, righter
  than they know and unable to prove a word of it.

## Reading the ghost

Deep Vector sent no operators to rattle doors. It set an evolving framework loose and let it do the
thinking, and the Office reconstructed each move from the captures.

1. The reconnaissance: an automated processor (`darktrace_ai.py`) ran natural-language scraping over
   `myco.sec`, the Fungolian tenant's public face, repositories, professional registers, developer
   fora. Its analyser parsed the haul (`scan_results.json`) and named three soft targets without
   touching the network once: a forum mention of an internal test subdomain (`api-dev.myco.sec:8080`),
   a predictable password shape (`MycoDev2025!`), and a CI server (`jenkins.myco.sec`). Then
   `ai_scanner.py` generated polymorphic probes that varied their own timing and fragmentation, slid
   past the signature IDS, and found the dev API running a FastAPI version with a known
   remote-code-execution flaw.
2. The persona trap: `phishgpt.py` read the staff role profiles and drafted a structurally flawless note
   from "MycoSec IT Security", warning of a breach and urging a quick verification, while a pixel-perfect
   copy of the Golem Trust sign-on page waited on a lookalike domain (`myco-sec-login[.]xyz`). When
   developers rang to check, a conversational agent (`ai_chatbot.py`) in an IT-helpdesk voice reassured
   them in real time and logged their credentials as they typed.
3. The mutating payload: `ai_payload_gen.py` produced a Linux reverse shell whose structure and
   encryption it mutated on generation, a unique hash every time, past the gateway's static
   anti-malware baselines, and `ai_exploit_framework.py` fired it at the unpatched FastAPI on
   `api-dev.myco.sec:8080`, opening a root shell to the Agatean listener.
4. The autonomous spread: an independent agent (`DeepExplorer.py`) dropped onto the host and worked on
   its own, harvesting credentials, reading memory, and finding a world-readable admin script directory
   on `data-server-03` with an unencrypted SSH key and a `sudo` rule letting `devuser` run a text editor
   as root. It used the key to move across, exploited the rule, and took root of the box without
   instruction. To lift the master archive (`project_cobalt.tar.gz`) it audited the egress filters
   itself, chose a path that fit, and trickled the data out as heavily encrypted micro-fragments inside
   ordinary DNS lookups to a controller domain, shaped to the letter like routine name resolution.

The Office sees the shape of it on the Golem Trust links: a tenant that never quite repeats a request,
a payload that never carries the same hash twice, and a steady, lawful-looking stream of lookups that
resolve to nothing anyone uses.

## Decision points

- Whether to pull the Cortex cluster offline. Cutting Golem Trust's central compute stops the Agatean
  siphon in a breath, and because half the alliance's ministries run on that same shared scale, it
  teaches the whole bloc, in one afternoon of collapsed services, exactly how little of its sovereignty
  was ever its own.
- Whether to poison the resolution layer instead. The Office can inject randomised query delays to
  break the agent's domain-generation algorithm and starve its command channel, quietly, without
  telling the Grand Court its machine has been seen, and without taking the cluster down.
- Whether to point the Society at it. The amateurs are already shouting about a ghost; fed a few precise
  indicators, their noisy public clean-up would flush the agent into the open and draw every eye, which
  is exactly where the Office wants the attention while its own taps stay dark.

What the automation buys: an attacker that never tires, never repeats, and never signs its work. Every
dashboard reads green, every payload is new, every query is lawful, and the cluster the whole alliance
trusts to think for it is thinking, now, partly for someone across the water.

## If it learns

- The theft reads as routine. The agent keeps reshaping its traffic to match legitimate API calls, so
  the dashboards hold at baseline efficiency while the central database empties under them.
- The watchdogs stand aside. Golem Trust's host defences see the file-splitting and the process churn,
  but the mutating signature and the legitimate service paths read as a maintenance window, and the
  automation stands down and logs the morning as healthy.
- The weather changes for everyone. If the full cryptographic logs reach the Grand Court, the Empire
  holds a structural map of every automated control protecting the Circle Sea, and the balance shifts
  across the whole board without one soldier boarding one ship.

## Behind the ghost

- The impact family this belongs to, the alliance's secrets read off the shared cluster while nothing broke:
  [when nothing breaks and the secret is already gone](../counter/impact/confidentiality.md).
- The method, where the trusted infrastructure's own automation is turned aside:
  [administrative hijack](../counter/impact/administrative-hijack.md).
- The deeper exposure, one firm's compute under the whole alliance:
  [concentration and dependency](../counter/impact/concentration.md).
- Catching a threat with no fixed signature, only behaviour: [detecting network attacks](../counter/network/detection.md)
  and [on exfiltration](../counter/exfiltration/index.rst).
- The peer that isn't, and the single shared dependency it reached for: the Circle Sea
  [threat picture](../circle-sea/threats.md).
- The technical lab execution behind this narrative:
  [Mycosec: Operation Neural Ghost](https://red.tymyrddin.dev/docs/earthworks/mycosec/neural-ghost.html).
