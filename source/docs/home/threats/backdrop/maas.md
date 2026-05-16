# Malware as a service

The cloud ecosystem's subscription model has been adopted by criminal infrastructure as well. Malware-as-a-Service,
Ransomware-as-a-Service, and related offerings allow operators without significant technical skill to deploy
sophisticated attacks by renting the underlying tooling from developers who handle maintenance and updates.

The economics are straightforward. Malware developers earn a percentage of each successful attack without taking
on the operational risk of running campaigns themselves. Affiliates gain access to polished tooling without the
development cost. The result is a market that has dramatically lowered the skill threshold for launching attacks
while maintaining the sophistication of the tools being used.

## What the service layer includes

Infostealer subscriptions provide credential-harvesting malware, collection infrastructure, and panel access
for reviewing stolen data. Ransomware kits come with deployment documentation, negotiation support, and in some
cases dedicated leak sites for publishing exfiltrated data if ransom is refused. Botnet rental covers
distributed infrastructure for credential stuffing, DDoS, or spam.

The common thread is automation. Campaigns that previously required manual effort at each stage now run largely
unattended once configured.

## The relevant implication for home users

The service layer means the person running a credential-stuffing campaign against a password manager or an email
provider may have no technical background at all. The sophistication of the tool is decoupled from the
sophistication of the operator. Standard defences, unique passwords, MFA on important accounts, awareness of
phishing, remain the appropriate response; the attacker's technical level does not change what works.

## Resources

* [Threat Spotlight: Illicit Telegram Markets & OTP Bots](https://flare.io/learn/resources/blog/threat-spotlight-illicit-telegram-markets-otp-bots/), 2022
