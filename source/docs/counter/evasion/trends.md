# Evasion trends: defensive perspective

The defender's problem has changed. Detecting malware used to mean recognising malware.
Modern evasion is not about hiding malware; it is about not being malware at all. An
attacker who uses only signed tools, legitimate credentials, and normal protocols
produces log entries indistinguishable from an admin having a strange day.

## Signature failure

Signature-based detection assumed attackers would carry identifiable tools. That
assumption has not held for years. The combination of LoLbin execution, fileless
payloads, and per-deployment payload mutation means there is often no file, no binary,
and no repeated byte sequence to match against.

The shift to behavioural detection was necessary and correct. But behavioural detection
against a disciplined attacker who mimics admin workflows is a much harder problem,
and false positive rates that are acceptable in theory become paralysing in practice
when analysts are drowning in alerts.

## The modern threat picture

Fileless execution: memory-only payloads reduce the forensic footprint to near zero
during an active operation. Detection requires either catching the execution at the
moment it happens (EDR telemetry) or finding it in a memory acquisition after the
fact. Neither is reliable in real time.

BYOVD: attackers arriving with a signed, trusted driver to disable the very tools that
would detect them is not a theoretical risk. It has been documented in ransomware
deployments, nation-state operations, and red team engagements. HVCI (Hypervisor-
Protected Code Integrity) defeats it, but HVCI is not universally deployed.

*In documented cases, the driver has been a vulnerable version of a legitimate security
product or hardware utility: a Dell firmware update driver (DBUtil_2_3.sys, CVE-2021-21551),
a Gigabyte firmware component (gdrv.sys), a version of the MSI Afterburner driver
(RTCore64.sys). The binary passes signature validation. The EDR
status panel shows green. Process creation events stop arriving at the detection backend
because the kernel callbacks have been removed. The first indication that something has
happened often comes from network or identity telemetry, not from the endpoint that has
been silenced.*

AI-generated polymorphism: per-deployment payload mutation means hash-based detections
fail. Behavioural detections survive, but only if the behaviour is distinctive. An
AI-generated PowerShell variant that achieves the same effect via a different code
path may not match any existing behavioural rule.

Steganographic C2: command-and-control traffic that looks like cloud storage API calls
and embeds instructions in images provides no destination, no protocol anomaly, and
no payload to inspect. Detection requires content-level analysis of image uploads and
downloads, which is expensive and produces high false positive rates.

Environmental awareness: samples that detect sandbox conditions and behave benignly
during automated analysis are now the norm, not the exception. Detonation-based
detection is unreliable against any attacker who has bothered to implement the
standard environment checks.

## Where detection still holds

Not all of this is hopeless. Detection is probabilistic and layered; the goal is
raising attacker cost and reducing dwell time, not achieving perfect detection.

Behavioural detection catches the majority of attackers who are not highly disciplined.
LoLbin usage, even well-executed, often produces process chains (Word spawning
PowerShell, PowerShell making network connections) that stand out against a baseline.
EDR products with good baseline modelling catch these reliably.

Identity-centric controls stop attacks that depend on credential or token abuse. MFA,
short-lived tokens, and conditional access policies mean that stolen credentials are
less useful for longer. Token replay attacks require the stolen token to still be
valid; reducing token lifetime reduces the window.

HVCI and Secure Boot enforced via policy prevents BYOVD attacks on modern hardware.
Deployment discipline here is a direct counter to a specific and serious threat.

Deception technology catches automated and less-disciplined attackers reliably. An
attacker who has done reconnaissance knows to avoid honeypots. An attacker using
automated tooling does not.

Log coverage and retention determines whether incidents can be investigated after
the fact. Even when real-time detection fails, sufficient log coverage allows
retrospective reconstruction of an intrusion. This is where many organisations fail:
not in the detection capability, but in the log availability to use it.

## The fundamental asymmetry

Attackers only need to stay below the noise floor. Defence requires coverage
across everything, all the time. This asymmetry does not resolve; it is managed.

The defences that narrow the asymmetry are not the sophisticated ones: they are patch
management, least privilege, MFA, log retention, and a small team of analysts who
know what normal looks like. The sophisticated tools extend a disciplined baseline;
they do not replace it.
