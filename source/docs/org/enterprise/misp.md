# Threat intelligence with MISP

Angua is investigating an attempted intrusion. The attacker's techniques seem familiar. She's certain she's seen 
this pattern before, but she can't remember where or when.

"We need threat intelligence," she tells Dr. Crucible. "Not just alerts on individual events, but patterns. Context. 
Attribution. What are we seeing, what have others seen, what can we expect next?"

Dr. Crucible nods. "The Circle Sea Information Sharing and Analysis Center exists precisely for this. We could 
participate."

## What they built

Dr. Crucible and Angua deploy [MISP](https://github.com/MISP/MISP/releases) as their threat intelligence platform. 
Cloud server instance, integrated with all security tools.

Feed integration:

- CIRCL OSINT feeds
- AlienVault OTX
- Abuse.ch (malware hashes, C2 servers)
- Circle Sea ISAC (shared intelligence from other Ankh-Morpork organisations)
- Guild-specific threat data (Assassins' Guild shares attacker profiles, anonymized)

Threat actor tracking: custom taxonomies for known adversaries. "Tsort Advanced Persistent Thieves" (their most 
persistent threat), "Klatch Cryptographic Gang," "Pseudopolis Ransomware Collective."

Integration points:

- Suricata imports MISP indicators as IDS rules
- Graylog enriches alerts with MISP context
- Firewall auto-blocks known malicious IPs
- DefectDojo links vulnerabilities to active exploitation campaigns

Information sharing (anonymised): Golem Trust contributes indicators back to Circle Sea ISAC. IP addresses of 
attackers, malware hashes, attack patterns. Community defence.

The familiar attack pattern Angua noticed? MISP shows it's been targeting three other Ankh-Morpork companies. 
Attribution: Tsort APT. Likely targeting banking sector. Early warning allows Golem Trust to strengthen defences 
before the actual attack.

## Runbooks

* MISP deployment
* Feed configuration
* Indicator import/export
* Integration with security tools
* Information sharing procedures.

## Related

- [SIEM and threat intelligence/hunting notes](https://blue.tymyrddin.dev/docs/soc/siem/notes/)
- [Security operations systems and tools](https://purple.tymyrddin.dev/docs/secops/tools/)
