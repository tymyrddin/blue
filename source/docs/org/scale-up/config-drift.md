# Configuration drift and the CIS benchmark

Cheery Littlebottom, in her new role as risk manager, is conducting an infrastructure audit. She's accessing 
servers via Teleport, reviewing configurations, checking hardening status.

- Server 1: SSH configured correctly, firewall rules tight, automatic updates enabled.
- Server 2: SSH allows password authentication (legacy), firewall has extra rules, updates manual.
- Server 3: SSH perfect, firewall missing recent rules, updates enabled.

"Ponder," she says, document in hand, "why are our servers configured differently?"

"Well, server 1 is new, server 2 is from the early days and we haven't updated it, server 3 is somewhere in between..."

"That's called configuration drift. It's a security risk. We need consistency."

Otto Chriek, the new compliance officer (and vampire, which means he photographs everything), agrees. "For ISO 
27001 certification, we must demonstrate consistent security controls. Configuration drift is evidence of poor control."

## What they built

Ludmilla takes charge of configuration management. [Ansible](https://github.com/ansible/ansible/releases) becomes the 
standard. Everything defined as code. All servers configured identically.

Ansible playbooks for:

- CIS Debian hardening
- SSH hardening (no passwords, specific ciphers only)
- Firewall rules (default deny, explicit allows)
- Automatic security updates
- Log shipping configuration
- Monitoring agent deployment

[OpenSCAP](https://github.com/OpenSCAP/openscap/releases) provides compliance scanning. Custom profiles check CIS 
benchmarks. Scans run weekly. Results feed into [DefectDojo](https://github.com/DefectDojo/django-DefectDojo/releases) 
(deployed later) for tracking remediation.

Configuration drift checks run daily. Alert if any server deviates from standard. Auto-remediation for simple cases. 
Manual review for complex cases.

Emergency patch procedure documented: test in staging, apply to one production server, monitor for 24 hours, roll out 
to remaining servers.

Within six weeks, all servers conform to standard. Configuration drift drops to zero. Cheery approves. Otto photographs 
everything for the audit trail.

## Runbooks

* Ansible control node setup
* Playbook development
* CIS hardening procedures
* OpenSCAP scanning
* Remediation workflows
* Patch management

## Related

- [The ISO 27001 mountain expedition](https://purple.tymyrddin.dev/docs/audits/iso27001/)
- [Risk management](https://purple.tymyrddin.dev/docs/risk-management/)
