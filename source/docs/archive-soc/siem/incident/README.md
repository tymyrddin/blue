# Splunk investigation walkthrough

## What?

An investigation with [Splunk](https://tryhackme.com/room/splunk201) and the [Cyber kill chain](../notes/ckc.md) as framework. 

A guided approach to analysing security incidents in Splunk, structured around the Cyber Kill Chain (CKC), a model 
that breaks attacks into stages (recon, exploitation, command & control, etc.). This helps trace an attacker’s steps 
methodically.

## Why?

* See the full attack story: Map Splunk logs to each kill chain stage to understand how the breach happened.
* Prioritise evidence: Focus on critical phases (like lateral movement or data exfiltration).
* Speak the language of defenders: CKC is widely used in IR reports and threat intel sharing.

## How?

* [I am really not batman](scenario.md)
* [Reconnaissance phase](recon.md)
* [Exploitation phase](exploit.md)
* [Installation phase](install.md)
* [Action on objectives](objectives.md)
* [Command and control phase](c2.md)
* [Weaponisation phase](weaponise.md)
* [Delivery phase](deliver.md)

Tip: Start with the end goal (e.g., "data stolen") and work backward through the kill chain, it’s often faster!


