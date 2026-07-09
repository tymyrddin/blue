# Ransomware as a service

Ransomware has become a franchise operation. Developers build and maintain the encryption tooling and associated
infrastructure: payment portals, victim communication channels, decryption key management. Affiliates pay a
percentage of collected ransoms in exchange for access to the kit and support. The developer takes the
development risk; the affiliate takes the operational risk of running campaigns.

The distribution model has shifted over time. Early ransomware relied heavily on mass phishing campaigns. Current
operations more often use drive-by downloads, compromised VPN credentials, or botnets for initial access. No
operating system is exempt: Windows, macOS, and Linux variants all exist, and some ransomware families target
backup systems specifically to remove the obvious recovery path.

## The extortion layer

Some groups have added a second pressure beyond file encryption. Exfiltrated data gets published, or threatened
for publication, on dedicated leak sites. This shifts the leverage: a victim who has good backups still faces
the question of what was taken. GDPR and similar data protection frameworks have been used by attackers as an
additional angle, with threats to report violations if ransom is not paid.

RansomedVC demonstrated this in 2023, claiming to act as penetration testers and threatening regulatory
reporting as a condition of negotiation. The legal framing was not persuasive, but it illustrated how far the
extortion logic has developed beyond simply locking files.

## For home users

Home ransomware typically targets backup-connected storage: NAS devices, cloud sync folders, and external drives
left permanently connected. The offline backup, disconnected when not in use, remains the most reliable
mitigation. Testing the restore process matters: a backup that has never been tested is an assumption.
Last updated: 10 July 2026
