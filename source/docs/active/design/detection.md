# The cat-and-mouse game

Honeypot detection is about inconsistencies: the small flaws that make a decoy feel off to an
attacker who has seen enough real systems to notice. Common giveaways:

## Too perfect, too empty

Real systems accumulate artefacts: temp files, idiosyncratic log entries, command history. A honeypot
that presents as a brand-new VM is pristine in a way that no production system actually is.

## Limited interaction

Low-interaction honeypots fail when probed beyond scripted responses. An attacker who notices that
outbound network calls do not work, or that the shell behaves inconsistently, has found the edge of
the emulation.

## Legal tells

A honeypot cannot cross certain lines. Launching actual DDoS attacks from the system, for instance.
Attackers who probe these boundaries deliberately can use a refusal as confirmation.

## Fingerprintable traits

* Default credentials left in place.
* Service versions that are improbably old for a supposedly active system.
* Response timing that does not match the claimed service.

## Concealing traps

Modern honeypot design focuses on plausibility:

* Fake user histories: populated `bash_history`, realistic log entries, scheduled maintenance tasks.
* Dynamic responses: context-aware replies.
* Legal workarounds: simulate attack outcomes without executing them (logging apparent DDoS attempts
  without generating real traffic).
* Fingerprint rotation: periodically update service versions and configuration to match current
  real-world systems.

## Ethical note

Finding a detectable honeypot is worth reporting responsibly. The goal is better defences.
Last updated: 10 July 2026
