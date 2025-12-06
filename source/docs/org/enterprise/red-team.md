# Red Team operations

Mr. Teatime was an inhumator for the Assassins' Guild. Now he's legitimately employed as Golem Trust's Red Team Lead. 
The transition was Adora Belle's idea, though even she admits it was risky.

"If I wanted to break into our systems," Mr. Teatime says at his first team meeting, eyes glittering with enthusiasm, 
"how would I do it? Let's find out."

Carrot establishes rules of engagement. No actual customer data exfiltration. No permanent damage. No attacking 
production during business hours without approval. Document everything.

"Understood," Mr. Teatime says. "When do we start?"

## What they built

Carrot and Mr. Teatime establish the red team program. Five members: three former Assassins' Guild inhumators 
(reformed, mostly), two ethical hackers from Überwald.

Isolated red team infrastructure: separate Hetzner project, no connection to production.  Adversary simulation 
servers, [Caldera](https://github.com/mitre/caldera/releases) for adversary emulation, custom tools developed in-house.

Engagement types:

- Full scope penetration tests (quarterly)
- Assumed breach scenarios (start inside the perimeter)
- Physical security tests (warehouse and office access)
- Social engineering campaigns (phishing, pretexting)
- Purple team exercises (red attacks, blue defends, both learn)

First engagement objective: "Steal Royal Bank customer data." Duration: 2 weeks. Rules: realistic attacker TTPs.

Results:

- Initial access via phishing (1 employee clicked, Sam Vimes Jr., naturally)
- Lateral movement attempted via SMB
- Detected by Zeek after 45 minutes (unusual SMB patterns)
- SOC responded within 1 hour
- Red team blocked by network segmentation before reaching production data
- Outcome: "Blue team wins, but barely" - Mr. Teatime

Improvements identified:

- Enhanced email filtering (phishing detection)
- Additional training for Sam Vimes Jr. (and everyone else)
- Better network microsegmentation
- Faster automated response playbooks

Purple team exercises monthly. Recent scenarios: ransomware simulation, insider threat, supply chain attack, cloud 
misconfiguration exploitation. Both teams learn. Detection improves. Response times drop.

Mr. Teatime is professionally satisfied. "This is more challenging than assassination work. You can't just kill 
the servers."

## Runbooks

* Red team infrastructure setup
* Engagement planning
* Purple team coordination
* Attack scenario development
* Findings documentation
* Improvement tracking

## Related

- [Red wilds](https://red.tymyrddin.dev/)
- [Colourful teaming](https://purple.tymyrddin.dev/docs/teaming/)
