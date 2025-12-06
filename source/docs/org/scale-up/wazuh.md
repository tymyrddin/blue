# File integrity and the Wazuh deployment

Angua notices something odd in the Graylog alerts. A configuration file on `merchants-guild-app-03` was modified. 
At 03:17 at night. By root. But there's no record of anyone logging into that server.

She digs deeper. The file modification is legitimate (automatic update). But it highlights a gap: they're not 
monitoring file integrity comprehensively. If an attacker modified a critical file, would they even notice?

"We need file integrity monitoring," she tells Carrot. "Real-time. For all critical systems."

Dr. Crucible suggests Wazuh. "It's more than FIM. Full SIEM capabilities, active response, vulnerability detection. 
The Unseen University use it to monitor their hex networks."

## What they built

Dr. Crucible and Angua deploy [Wazuh](https://github.com/wazuh/wazuh/releases), running in a cloud. 
Agents deploy to every server and even developer workstations.

File Integrity Monitoring watches:

- `/etc/` (all configuration changes)
- `/var/www/` (web application files)
- `/opt/vault/config/` (Vault configuration)
- `~/.ssh/` (SSH key changes)
- Critical application directories

Alerts trigger on: unauthorised modifications, new files in suspicious locations, deletion of log files, changes to 
system binaries.

Security configuration assessment checks system hardening. CIS benchmarks for Debian, Docker, Kubernetes. Results 
feed into compliance reporting.

Vulnerability detection scans installed packages against CVE databases. Alert on critical CVEs. Auto-create DefectDojo 
tickets for tracking.

Active response can automatically block IPs, kill processes, or isolate systems. Configured carefully: they learned 
from a test that blocked everyone including themselves.

MITRE ATT&CK mapping provides context. Every alert maps to tactics and techniques. Helps Angua understand attack 
patterns.

Two weeks after deployment, Wazuh catches a developer's workstation compromised via phishing. unauthorised SSH key 
added to `~/.ssh/authorized_keys`. Alert fires immediately. Response: 12 minutes from detection to containment.

## Runbooks

* Wazuh manager deployment
* Agent deployment at scale
* FIM configuration
* Active response rules
* Vulnerability scanning
* Integration with Graylog.

## Related

[Integrated security operations](https://purple.tymyrddin.dev/docs/secops/)
