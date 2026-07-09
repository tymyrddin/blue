# Honeypot taxonomies

Choosing a honeypot is about matching the level of attacker interaction to what is actually useful to
collect, balanced against how much time and risk the deployment is worth.

## By purpose: research vs. production

### Research honeypots

Left exposed to observe what attacks look like in the wild. Useful for:

* Documenting attacker tools, techniques, and progression.
* Discovering zero-days before they appear in production environments.
* Generating threat intelligence.

### Production honeypots

Placed within production environments, positioned to divert attackers from real systems. Key features:

* Hidden in the network, presenting as vulnerable but real-looking services.
* Trigger alerts on first contact, before anything serious has happened.
* Convincing enough that attackers do not realise they have been diverted.

## By interactivity: how much rope to give attackers

| Type               | Interactivity                | Risk     | Best for                        | Example tools           |
|--------------------|------------------------------|----------|---------------------------------|-------------------------|
| Low-interaction    | Minimal (scripted responses) | Low      | Logging spray-and-pray attacks  | mailoney, dionaea       |
| Medium-interaction | Partial (emulated OS/shell)  | Moderate | Studying post-exploit behaviour | Cowrie (SSH proxy mode) |
| High-interaction   | Full (real VMs with vulns)   | High     | Advanced adversary analysis     | Cowrie with custom VMs  |

Low-interaction captures the initial probe. High-interaction follows what happens after access is gained.
With high-interaction, the attacker may pivot if the environment is not properly isolated.

## By deployment: where to place them

### Internal honeypots

* Location: inside the LAN.
* Purpose: catch insider threats or lateral movement from a phishing-originated breach.
* Useful signal: any contact at all, since there is no legitimate reason to probe them.

### External honeypots

* Location: internet-facing.
* Purpose: collect reconnaissance and automated attack data from outside.
* Produces: continuous attack data useful for threat intelligence.

## The Cyber Kill Chain and deception stack

The paper [Three Decades of Deception Techniques in Active Cyber Defence](https://arxiv.org/pdf/2104.03594.pdf) maps deception techniques to a kill chain and describes a four-layer deception stack. Worth reading for anyone designing a more comprehensive deployment.
Last updated: 16 May 2026
