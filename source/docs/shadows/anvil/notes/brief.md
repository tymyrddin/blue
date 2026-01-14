# Department of Silent Stability Internal brief (circulation restricted)

From: Head of Department, Silent Stability
To: Senior Clerks, Analysts, and the Usual Sensible People
Subject: The Silent Anvil

By direction of [the Patrician](https://indigo.tymyrddin.dev/docs/vetinari/) (whose interest in *not being surprised* 
remains as keen as ever), this brief sets out the operating principles of the Department’s latest undertaking, 
informally known as the Silent Anvil.

You will note the absence of trumpets. This is intentional.

## Purpose

The purpose of the Silent Anvil is simple:

* To identify vulnerable firmware in industrial control systems and internet‑exposed embedded devices
* To determine where such firmware is deployed *without interfering with it*
* To enable quiet, responsible notification to those who need to know

We are not hunters.
We are census‑takers with very good eyesight.

## Scope

The Anvil covers:

* PLCs, RTUs, gateways, HMIs
* Industrial and building automation devices
* Internet‑exposed smart home and consumer embedded devices

If it runs firmware, speaks a protocol, and has no meaningful update story, it is in scope.
If it controls something important, we are extra careful.

## Operating principle

If a device can be recognised without sending it a command, it should be.
If it cannot, we pause and ask whether recognition is necessary at all.

The Department does not:

* Exploit vulnerabilities
* Perform behavioural probing on live systems
* Write to registers, memory, or state
* “Just check” whether something breaks

Those activities belong in laboratories, not on the public network.

## Method (high level)

The Silent Anvil consists of two complementary wings, each fulfilling a precise role:

### Obsidian Desk (lab and research)

* Firmware acquisition: Obtained lawfully, offline, and away from anything that might explode
* Forensic extraction of static artefacts:

  * Banner strings, error messages, protocol constants
  * Web UI assets, headers, and embedded frameworks
  * Certificates, endpoints, and API strings
* Fingerprint construction: Artefacts are reduced to recognisable identifiers, tagged with metadata (including unsafe or sensitive items)
* Research outputs feed the Forge for identification

### Fingerprint Forge (internet‑scale identification)

* Passive discovery and correlation of fingerprints produced by the Desk
* Safe, non-intrusive observation via:

  * Internet search engines and passive datasets
  * TLS, HTTP, MQTT, and SSDP fingerprints
  * Web asset hashes and static resource matching
* Quiet notification: Vendors, operators, CERTs, or intermediaries, depending on context

No step requires asking the device whether it is vulnerable. The firmware already told us.

## On smart home devices

Smart home equipment differs from industrial control mainly in the confidence with which it claims to be 
“user friendly”. Technically, it behaves the same:

* Embedded firmware
* Distinctive artefacts
* Poor patch hygiene
* Unexpected exposure

The Forge leans harder on passive and static indicators for safety and scale.

## On behavioural fingerprinting

Behavioural probing exists.
It is powerful.
It is risky.
It is almost never justified at scale.

The Anvil therefore treats behavioural techniques as:

* Laboratory tools (Obsidian Desk)
* Escalation options requiring explicit permission
* Things that demand paperwork, authorisation, and careful thought

Curiosity is not authorisation.

## Principles

* All firmware research occurs offline in controlled environments
* Fingerprints are derived solely from static artefacts
* No live systems are touched or modified unnecessarily
* Unsafe or uncertain artefacts are tagged and never deployed
* Outputs support safe, responsible identification and disclosure
* The Forge and the Desk work in concert; one produces artefacts, the other observes at scale

## Closing remarks

The Silent Anvil exists so that the city may sleep without being jolted awake by the sudden realisation that *everyone has been running the same vulnerable firmware for years*.

We do not accuse.
We do not embarrass.
We do not announce.

We observe, we confirm, and we inform, quietly.

This approach has the Patrician’s full confidence, which is not a thing given lightly and is best not squandered.

Please proceed accordingly.

Head of the Department of Silent Stability

*(by a memorandum initialled in a handwriting that strongly suggests [the Patrician](https://indigo.tymyrddin.dev/docs/vetinari/) had already decided)*
