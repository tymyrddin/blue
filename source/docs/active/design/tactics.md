# Deception tactics

Deception technology has evolved considerably, but the underlying principle is consistent: make the
environment expensive to navigate. Attackers who spend hours on decoy systems are not spending those
hours on real ones, and every action they take is logged.

## Decoys: occupying attacker time

Decoys lead attackers away from actual assets. Honeypots and honeynets serve two purposes:

* Recording attacker tools, techniques, and progression.
* Educating defenders by revealing what adversaries are actually doing rather than what signatures
  suggest they might do.

The right honeypot depends on the environment and on how much useful signal is worth trading against
the operational overhead of running and monitoring it.

## Honeyclients

A honeyclient simulates a browser visiting potentially malicious content, collecting what happens without
exposing a real system to it. Thug is a practical starting point: a Python-based low-interaction
honeyclient that emulates browser behaviour and identifies exploit attempts.

It is worth running in an isolated VM or container. Thug is designed to be safe, but visiting malicious
content at scale still carries some risk.

*Nothing says "hobby" like intentionally infecting a VM for science.*

## Attribution

Getting reliable attribution is difficult, but some techniques help narrow the field:

* Document beacons (the Molehunt approach): a document that contacts a controlled server when opened,
  logging the IP and user-agent of whoever opened it.
* BeEF (Browser Exploitation Framework): adversaries use it to hijack browsers; defenders can deploy
  it in controlled environments to study how client-side attacks unfold. "Your JavaScript. Our
  intelligence."
* HoneyBadger: a honeypot with built-in geolocation, useful for placing activity geographically.

Attribution data is useful for building threat models and for correlating activity across incidents.
It rarely produces actionable targeting on its own.

## Traps

Beyond individual honeypots, purpose-built traps can occupy crawlers and scanners:

* Spidertrap: ensnares web crawlers in loops of procedurally generated pages.
* Weblabyrinth: similar approach, bots get lost in generated content.
* Nova: a cluster of decoy hosts plausible enough to divert reconnaissance effort.

*The goal is not just to detect. It is to send them down a rabbit hole with no exit.*
