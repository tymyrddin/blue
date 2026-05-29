# Potential beneficiaries

## Why this is not just a banking problem

Discussions about BGP control-plane attacks often focus on financial institutions because the impact is immediate and 
visible. That focus is misleading. BGP is the mechanism that decides how traffic moves across the global Internet, 
and when it is abused, traffic can be redirected, intercepted, degraded, or made unreachable without any system 
failing locally. Any organisation that depends on reliable connectivity is therefore exposed, whether or not it 
operates network infrastructure itself.

The key issue for senior leaders is that routing attacks do not announce themselves. They often look like routine 
outages, congestion, or configuration mistakes. Without people who understand the difference, organisations respond 
slowly, misclassify incidents, or assume the problem sits elsewhere.

## Network operators, cloud platforms, and CDNs

Internet service providers, cloud providers, and content delivery networks are closest to the routing layer and 
usually see the first indicators of abnormal behaviour. However, operational familiarity with BGP does not 
automatically translate into preparedness for hostile manipulation. Many incidents are initially treated as 
harmless misconfigurations, allowing malicious routes to propagate further and persist longer than they should.

Because these organisations aggregate traffic for thousands of customers, the consequences of a delayed response 
scale rapidly. Services may continue to function well enough to avoid alarms while traffic is quietly diverted or 
observed. From an executive standpoint, this creates a false sense of stability at precisely the wrong moment.

Who specifically:

* Tier-2 and regional ISPs (least mature defences, most impact)
* IXPs and route server operators
* Small national providers in “strategic” geographies
* Network reliability engineers
* Abuse and trust teams
* Cloud security teams (who often think BGP is “just networking”)
* Fastly, Cloudflare, Akamai, regional CDNs
* Security teams *and* traffic engineering teams (they rarely train together)
* Route server maintainers
* Peering coordinators
* Trainers and community organisers

*This is where prevention actually scales*.

## Telecommunications, mobile networks, and public infrastructure

Telecommunications and mobile operators rely heavily on inter-operator trust and IP-based routing. When BGP is abused, 
assumptions about reachability, lawful interception, roaming, and emergency services no longer hold. These failures 
rarely present as neat technical faults; they surface as service degradation, regulatory exposure, or national-level 
incidents.

Public sector networks face similar risks. Government backbones, registries, courts, and public services are often 
multi-homed and externally connected, yet lack deep visibility into how traffic reaches them. When routing incidents 
occur, the impact is political and societal rather than technical, and senior officials are expected to make 
decisions without a clear understanding of what is actually under attack.

Who specifically:

* Core network engineers
* Security operations centres (SOC)
* Incident commanders (non-technical, very dangerous)
* Government backbone operators
* Senior telecom/network managers
* National communications authorities

## Enterprises and critical infrastructure operators

Large enterprises with their own autonomous systems are not passive users of the Internet. Multi-cloud architectures, 
private WANs, and global SaaS platforms all participate in global routing decisions. When those decisions are 
manipulated, organisations may experience outages, data exposure, or unexplained performance issues that cannot 
be resolved internally.

Critical infrastructure operators are particularly vulnerable. Energy grids, transport systems, water management, 
and industrial control environments increasingly depend on IP connectivity provided by third parties. These systems 
are long-lived and difficult to modify, and routing failures can translate directly into safety and continuity 
risks before anyone recognises the underlying cause.

Who specifically:

* Energy grid operators
* Water management authorities
* Transport and rail signalling backends
* Smart city backbones
* Network architects
* Security architects (who usually get briefed too late)
* Incident response leads
* IT/network teams responsible for multi-cloud operations
* WAN operations teams
* IT or network managers for global SaaS deployments

## CERTs, threat intelligence, and cyber response teams

National and sectoral CERTs, threat intelligence teams, and cyber defence organisations play a central role in 
detecting and responding to BGP abuse, even when they do not operate routers themselves. They are often responsible 
for distinguishing malicious routing behaviour from accidents, coordinating responses across multiple providers, and 
advising government or industry leadership.

Without training in BGP control-plane attacks, these teams risk misclassifying incidents, missing early indicators, 
or treating systemic abuse as isolated outages. This undermines both incident response and strategic decision-making, 
particularly when attribution, escalation, or international coordination is required.

Who specifically:

* National CERTs
* Sectoral CERTs
* Threat intelligence analysts
* Cyber defence teams
* Procurement and policy people (they decide whether RPKI is “worth it”)

## Regulators, law enforcement, and senior oversight

Regulators and law enforcement agencies increasingly investigate incidents that involve routing manipulation, whether 
in cases of fraud, espionage, service disruption, or critical infrastructure impact. Yet many regulatory frameworks 
implicitly assume that network paths are stable and trustworthy. When that assumption fails, investigations stall 
and accountability becomes unclear.

For senior leaders, this matters because policy, procurement, and compliance decisions shape whether organisations 
are prepared at all. Treating routing security as a purely technical concern pushes risk downward until it reappears 
as a crisis at board or ministerial level.

## Why leadership training matters

BGP control-plane attacks sit at the intersection of technical systems, organisational responsibility, and 
cross-border trust. Training for executives and senior managers is not about protocol details. It is about 
understanding who has visibility, who has authority to act, and where assumptions about the Internet no longer hold.

Organisations that recognise this early integrate routing security into resilience, governance, and risk management. 
Those that do not usually encounter the issue during an incident, when options are limited, explanations are 
uncomfortable, and the question “who should have known?” arrives far too late.

## TL;DR

If an organisation originates prefixes, influences routing decisions, depends on global reachability, or is blamed 
when the Internet misbehaves, then *it needs BGP control-plane attack training and incident playbooks of course*.

Banks just noticed first because money screams loudly. Infrastructure fails quietly until it does not.


