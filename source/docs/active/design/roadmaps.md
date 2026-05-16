# The honeypot arms race

## Web-based traps

Modern web honeypots have developed beyond basic form fields. The Aggressive Web Honeypot (2014) pioneered
JavaScript obfuscation to detect XSS and SQLi attempts: leaving instrumented code in the site that triggers
on exploitation. Its principles influenced subsequent tools including:

* OWASP Honeypot Project: a community effort to crowd-source attack patterns across web honeypots.
* Client honeypots: active systems that visit URLs rather than waiting to be visited.

*Nothing ruins a hacker's day like realising they've been attacking a carefully crafted decoy for three hours.*

## Worm detection

Signature-based IDS fails against novel variants. The Zero-day polymorphic worms honeypot uses the
Aho-Corasick algorithm to recognise malware patterns without requiring a known signature: it identifies
behavioural similarity rather than exact matches, which catches variants that would otherwise pass detection.

## Botnet baiting

Two approaches to bot detection honeypots:

* Hybrid honeypot: combines Sebek (attacker recording), Dionaea (malware collection), and Snort
  (traffic analysis) in a single deployment.
* ODAIDS-HPS: uses nearest-neighbour algorithms to flag anomalies, identifying bot behaviour by
  deviation from normal traffic profiles.

*Why suffer a DDoS attack when you can redirect it to a honeypot and watch the bots pointlessly hammer a decoy?*

## Honeytokens

Honeytokens are decoy credentials, documents, or data objects designed to trigger alerts when accessed.
Construction ranges from simple fake credentials to complete believable databases. Targeting may focus on
phishing attempts, insider threats, or any access to systems that should be dormant.

Tools like HoneyGen can generate convincing decoy data at scale. Manual creation works for smaller
environments.

## APT traps

For sophisticated threats:

* High-interaction honeypots: fully compromisable systems that allow attackers to carry out their full
  kill chain while under observation.
* Honeypot agents: simulated users within the environment, behaving like real ones.
* NIDS integration: network intrusion detection tied to honeypot activity for early warning.

*The only thing better than detecting an APT is watching them spend months infiltrating a system built just for them.*

## Dynamic honeypots

The current generation adapts in real time:

* Automated fingerprinting: adjusts presentation to match the current production environment.
* Hybrid architectures: mixes high and low interaction to balance realism with risk.
* Cloud scaling: spins up and down decoy instances as the threat landscape changes.

## AI-assisted deception

Several systems use machine learning to adapt honeypot behaviour:

* RASSH: uses reinforcement learning to respond dynamically to attacker actions.
* DeepDig: learns from each intrusion attempt, improving its responses over time.
* Intelligent Honeypot: applies solutions from past interactions to novel situations.

*Nothing stings quite like realising you've been outsmarted by a machine that was pretending to be vulnerable.*

## Shadow honeypots and concealment

The shadow honeypot approach passes traffic through triple-ID checks before any response is sent:

* Passive monitoring: the honeypot observes without being visible.
* AIPS integration: for correlating false positives across the deployment.

Tools like Apate (Linux Kernel Module) help conceal honeypots within the operating system, manipulating
system calls without detection and maintaining enough performance to stay convincing.

Forensic capabilities have developed from simple logging to full attack reconstruction. Understanding
precisely how an intrusion unfolded is nearly as valuable as stopping it.
