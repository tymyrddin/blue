# The cat-and-mouse game

*If your honeypot is obvious, you are not trapping attackers. You are giving them a practice dummy.*

## How attackers unmask honeypots

Honeypot detection is all about inconsistencies, the tiny flaws that make a decoy feel "off" to a seasoned attacker. Common giveaways include:

**Too perfect, too empty**

* Real systems have user artifacts (temp files, logs, quirks).
* Honeypots often feel like a brand-new VM, pristine and unlived-in.

**Limited interaction**

* Low-interaction honeypots fail when probed beyond basic commands.
* "Why can’t I curl google.com from this ‘production’ server?"

**Legal tells**

* Defenders can’t break laws (e.g., a honeypot refusing to launch DDoS attacks).
* Attackers test these boundaries deliberately.

**Fingerprintable traits**

* Default credentials (admin:admin).
* Unpatched but improbably old services (Windows Server 2008 in 2025?).
* "Honeypot-like" network delays (emulated services lag differently).

## Fighting Back: Concealing traps

Modern honeypot design focuses on plausible deniability:

**Add "Realism" noise**

* Fake user histories (bash_history, logs).
* Scheduled "maintenance" tasks (cron jobs).

**Dynamic responses**

AI-generated context-aware replies (e.g., SSH honeypots that "remember" past commands).

**Legal workarounds**

Simulate attack outcomes without actually attacking (e.g., logging "DDoS attempts" but not executing).

**Regular updates**

Rotate fingerprints to match current real-world systems.

*The best honeypot doesn’t just trap attackers, it makes them doubt their own skills.*

## Ethical note

Found a fingerprintable honeypot? Report it responsibly, the goal is better defences, not easier attacks.