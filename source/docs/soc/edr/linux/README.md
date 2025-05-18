# Linux EDR techniques

## What?

Linux EDR solutions typically utilise eBPF programs for efficient kernel-space telemetry collection, auditing 
subsystems like auditd, and process lineage tracking through /proc monitoring. Modern implementations focus on 
container-aware monitoring, tracking namespace crossings and pod-to-pod communications in orchestrated environments. 
Effective Linux EDR requires deep understanding of privilege escalation vectors (SUID binaries, capability abuse), 
persistence mechanisms (cron jobs, systemd services), and stealthy attack patterns like memory-only malware or kernel 
rootkits. The open-source nature of Linux presents unique challenges in maintaining tamper-resistant agents and 
detecting compromised open-source components.

## Why?

* Threats are evolving: Attackers increasingly target Linux systems (cloud servers, IoT, DevOps pipelines).
* Limited native security: Unlike Windows and macOS, Linux lacks built-in EDR capabilities.
* Critical for compliance: Required for frameworks like CIS, NIST, and PCI-DSS.

## How?

* [Kernel-level monitoring](kernel.md)
* [Filesystem integrity](fs.md)
* [Container security](container.md)
* [Threat Hunting with Open Source](hunting.md)