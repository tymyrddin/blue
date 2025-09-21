# United Kingdom & Ireland

Post-Brexit, the UK leans on 
[NCSC’s Cyber Assessment Framework (CAF)](https://www.ncsc.gov.uk/collection/cyber-assessment-framework) as the spine 
for critical infrastructure security. Regulators such as Ofgem for energy and Ofwat for water enforce resilience 
obligations, while industry groups like the Energy Networks Association (ENA) set sector-specific playbooks. 

Ireland, though still inside the EU, mirrors this with oversight by the Commission for Regulation of Utilities (CRU) 
and coordination through GovCERT.ie.

The emphasis is on CAF alignment, supplier assurance, and operational resilience: can operators withstand a hit, 
contain it, and keep power flowing while markets stay sane?

## Adversaries

* State actors probing grid stability for leverage in political or economic disputes.
* Criminal groups running ransomware or market fraud campaigns, often opportunistic but with systemic effects.
* Insider / supply-chain threats — vendor engineers with privileged tunnels, or compromised MSPs handling operational tech.

## Assets

* Grid control systems (SCADA, EMS/DMS) running distribution and transmission operations.
* Market balancing platforms — National Grid ESO in the UK, SEMOpx in Ireland — critical for settlement and pricing.
* Vendor support tunnels — remote access systems into substations, HVDC links, and DER aggregators.
* Operator consoles and transmission-grade (Tg) networks that, if blinded or disrupted, paralyse situational awareness.

## Attack vectors

* Remote vendor access abuse — poorly managed accounts, weak MFA, shared credentials.
* Weak supplier security — integrators or IT MSPs bridging between enterprise and OT.
* Protocol parsing bugs in IEC 61850, DNP3, or OPC UA stacks used in substations.
* Cloud misconfigurations in demand-response aggregators or smart-metering backends.

## Representative attacks

* HMI compromise — malware or ransomware taking down operator screens, leaving staff “flying blind.”
* Market settlement disruption — denial or manipulation of balancing feeds, delaying payments and undermining trust.
* Targeted vendor breach — attackers pivot via trusted suppliers to deploy implants into SCADA networks.

## Assistive technologies

* NCSC CAF & ICS guidance — baseline framework with four objectives: manage risk, protect against attack, detect events, minimise impact.
* UK-specific SIEM playbooks — E3C (Energy Emergencies Executive Cyber Security Group) shares indicators and scenarios.
* Sector exercises — “Exercise Resilient Shield” and similar industry-wide cyber drills test coordination.

## Top threats

1. Operator HMI compromise — ransomware or destructive malware denying visibility.
2. Vendor access / supplier chain compromise — stolen credentials, weak patch hygiene.
3. Targeted disruption tied to political events — timing attacks to coincide with strikes, elections, or geopolitical standoffs.

## Impacts

* Local or regional outages — cascading failures if SCADA visibility is lost.
* Market disruption — settlement delays, false signals in balancing markets, loss of investor confidence.
* Regulatory consequences — fines, mandated audits, reputational damage from Ofgem or CRU enforcement.
