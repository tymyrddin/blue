# The first hour

Suspecting a compromise is different from knowing about one. The decisions made in the first hour have a significant effect on what can be recovered from the incident and what cannot.

## Contain or observe

Taking a server offline immediately stops an active attacker but destroys the state that forensic investigation depends on: running processes, open network connections, the contents of memory. Leaving it running while monitoring lets information accumulate but allows the attacker to continue and potentially deepen access.

The default for a server that holds sensitive data, that could be used to attack other systems, or that is actively sending outbound traffic to unknown destinations, is network isolation rather than shutdown. Network isolation preserves the system state for investigation while stopping the most immediate harm. Shutdown is a last resort.

The default for a server whose compromise is only beginning to be suspected, with no active outbound traffic and no immediate risk to other systems, is to observe and gather information first.

## The reboot trap

Rebooting clears running processes, open connections, and memory. An attacker who has established persistence through a cron job or modified binary survives the reboot; the evidence of how they got in does not.

Attempting to clean up before the investigation is complete destroys evidence and frequently does not remove the threat. A compromised server may have multiple persistence mechanisms; removing the visible one leaves the others intact and now unknown.

The tools on a compromised server are not reliable. `ps`, `ls`, `netstat`, and similar commands may have been replaced by the attacker to hide processes and files. Output from a potentially compromised system is evidence, but not necessarily accurate evidence.

## Immediate priorities

Take a snapshot or disk image if the infrastructure allows it. Cloud environments make this straightforward. On bare metal, at minimum document the running process list (`ps aux`), active connections (`ss -tulnp`), and recent auth log entries before anything else changes.

Rotate credentials. Change passwords and rotate SSH keys for any account that had access to the compromised server. If those credentials were reused elsewhere, rotate them there too. This is the step that limits how far the damage spreads if credentials have already been extracted.

Check lateral reach. What other systems did this server have credentials for? What databases could it reach? What API keys were stored on it? The compromised server is rarely the end of the attacker's intended path.

Preserve logs. If logs have not been forwarded off the server, copy them to external storage before they are overwritten or the server is taken offline.

## Documenting while it is happening

Notes taken during an incident are evidence. Memory under stress is not reliable; contemporaneous records are. Write down what is observed as it is observed: timestamps, commands run, what the output showed.

An incident that goes to law enforcement, insurance, or a regulatory body needs documentation. An incident that does not still benefits from a record that supports the post-incident review.

## Recognising when to escalate

A small team without security expertise is at a disadvantage in incident response. The escalation decision is worth making in advance.

Indicators that the situation warrants external help: evidence the attacker has reached multiple systems; data that may require breach notification under applicable law; an attack that appears targeted rather than opportunistic; uncertainty about whether the threat has been fully contained.

A rapid containment decision and a clean rebuild from known-good backups is sometimes the better outcome over an extended investigation attempting to determine the full scope of a sophisticated compromise. The judgment of when to give up on forensics and rebuild gets easier when backups are current and the rebuild process is understood before it is needed.
Last updated: 10 July 2026
