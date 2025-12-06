# Honeypot taxonomies

Choosing a honeypot is about what annoys attackers most while keeping your logs interesting.

## By purpose: Research vs. Production

### Research honeypots

The academics of deception tech: Left exposed like an unlocked bicycle in Camden, just to see who takes the bait. Perfect for:

* Documenting attacker tools, techniques, and tantrums
* Discovering zero-days before they’re cool (or weaponised)
* Generating threat intel while sipping tea

*Why hunt vulnerabilities when you can let hackers deliver them to your doorstep?*

### Production honeypots

The bouncers of your network, strategically placed to lure attackers away from the VIP section (your actual systems). Key features:

* Hidden in production environments, masquerading as vulnerable services
* Trigger alerts the moment an intruder takes the bait
* Ideally so convincing, attackers never realise they’ve been had

*The digital equivalent of a ‘wet paint’ sign, except the paint is alarms.*

## By Interactivity: How much rope to give attackers

| Type	               | Interactivity	                | Risk	     | Best For	                        | Example Tools           |
|---------------------|-------------------------------|-----------|----------------------------------|-------------------------|
| Low-Interaction	    | Minimal (scripted responses)	 | Low	      | Logging spray-and-pray attacks	  | mailoney, dionaea       |
| Medium-Interaction	 | Partial (emulated OS/shell)	  | Moderate	 | Studying post-exploit behaviour	 | Cowrie (SSH proxy mode) |
| High-Interaction	   | Full (real VMs with vulns)	   | High	     | Advanced adversary analysis	     | Cowrie + custom VMs     |

Golden Rule:

* Low-interaction = "Look but don’t touch"
* High-interaction = "Touch, but pray they don’t pivot"

## By deployment: Where to plant your digital landmines

### Internal honeypots

* Location: Inside your LAN
* Purpose: Catch insider threats or phishing-born breaches
* Ideal Outcome: Never triggered (because if they are, your network is already toast)

### External honeypots

* Location: The wild, wild internet
* Purpose: Collect script kiddies, botnets, and APTs like Pokémon
* Ideal Outcome: So much attack data, your SIEM starts sobbing

*External honeypots: the only place where ‘constant bombardment’ is a good thing.*

## The Cyber Kill Chain & deception stack

For those who enjoy overcomplicating things beautifully, the paper 
[Three Decades of Deception Techniques in Active Cyber Defence](https://arxiv.org/pdf/2104.03594.pdf) offers:

* A tailored kill chain for modern threats
* A four-layer deception stack (because why stop at one taxonomy?)
* Enough jargon to impress at cybersecurity conferences

*Required reading, if only to nod sagely when someone mentions ‘stratified deceptive countermeasures’.*
