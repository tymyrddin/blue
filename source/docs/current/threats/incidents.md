# Known incidents (per region)

Incidents that directly involve smart energy devices (meters, inverters, EV chargers, gateways, OTA/fleet servers) 
and closely related ICS incidents that shaped sector practice (e.g., Ukraine 2015). 

## EU / continental Europe

1.  Smart-meter research hacks (Spain, 2014), [Reuters](https://www.reuters.com/article/technology/popular-electricity-smart-meters-in-spain-can-be-hacked-researchers-say-idUSKCN0HW15E/ "Popular electricity smart meters in Spain can be hacked, ...") — Research showed popular smart meters used in Spain could be hacked to under-report usage, impersonate other meters, or be used as attack platforms. This was an academic disclosure and media coverage rather than a criminal mass-exploit, but it underlined weaknesses in deployed AMI devices. 
2.  Ukraine power-grid attacks (2015), [Wikipedia](https://en.wikipedia.org/wiki/2015_Ukraine_power_grid_hack "2015 Ukraine power grid hack") — Not an EU incident, but regionally critical: nation-state attack (Sandworm) on distribution companies caused outages and demonstrated that grid attack chains (network access → ICS compromise → switching substations) are feasible. It shaped EU policy and ICS practices. (Technical forensic reports widely published.)
3.  Mirai / IoT botnet impact (2016),[CISA](https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets "Heightened DDoS Threat Posed by Mirai and Other Botnets") — Mirai and variants used consumer IoT (cameras, routers, smart devices) to launch massive DDoS events (Dyn, OVH). While not targeted at smart meters specifically, Mirai proved IoT fleets can be weaponised at scale — a key precedent for fears about compromised smart energy devices used as botnets.
4.  Academic / vendor research on inverter/EV charge weaknesses, [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-5747 "CVE-2025-5747 - NVD") — Multiple security research disclosures (and vendor CVEs) show real device vulnerabilities in inverters and chargers; these are often published as advisories rather than seen in widespread field exploitation. Examples of device CVEs and vendor advisories appear in public trackers. (See device-level CVEs published to NVD.)

## United Kingdom & Ireland

1.  Smart-meter rollout operational failures (ongoing, UK), [The Guardian](https://www.theguardian.com/business/2024/mar/26/smart-meter-rollout-number-faulty-machines-leaps-great-britain "New blow to British smart meter rollout as number of faulty machines leaps to 4m") — Large numbers (millions) of faulty or “dumb” smart meters and rollout problems have been publicly reported; regulators (Ofgem) are enforcing fixes. These are operational and security-adjacent (availability and reliability), not public evidence of nation-scale cyberattacks — but they do create systemic exposure.
2.  Research & capability exercises (UK), [The Guardian](https://www.theguardian.com/technology/2017/jan/05/information-security-broken-hacking-event-chaos-communications-congress "Five things that got broken at the oldest hacking event in ...") — Security research and red/blue exercises (e.g., Chaos Communication Congress coverage, NCSC CAF exercises) have demonstrated attacks and failure modes on smart meters and IoT devices; largely defensive disclosures and policy responses.
3.  NIS / regulatory enforcement activity, [Ofgem](https://www.ofgem.gov.uk/energy-regulation/technology-and-innovation/cybersecurity "Cybersecurity") — Not a single exploit incident, but regulatory enforcement and public incidents (faulty meters) have driven closer security scrutiny and remediation obligations — a practical effect for CNAs and vendors in the UK/Ireland.

Summary: UK/Ireland public record shows operational problems, research demos and regulatory enforcement rather 
than many public, large-scale criminal hacks of smart energy fleets.

## North America (US / Canada / Mexico)

1.  Mirai / IoT botnets / DDoS (2016 onward), [CISA](https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets "Heightened DDoS Threat Posed by Mirai and Other Botnets") — Mirai’s impact on internet infrastructure (Dyn DDoS etc.) directly demonstrated the danger of compromised IoT fleets — relevant because consumer smart plugs, cameras and gateways are part of the energy-IoT surface. 
2.  Red-team / research compromises of utility smart-meter deployments (Mandiant demo & others, 2021), [CyberScoop](https://cyberscoop.com/mandiant-utility-hack-smart-meter-red-team/ "How (and why) cyber specialists hacked a North American ...") — Public red-team research shows how smart-meter systems can be manipulated in lab/test environments; these are controlled demonstrations to guide defenses.
3.  Ransomware / attacks on utilities & vendors (multiple, 2010s–2020s), [Asimily](https://asimily.com/blog/top-utilities-cyberattacks-of-2025/ "Top Utilities Cyberattacks of 2025 and Their Impact") — While many ransomware incidents focus on IT, they often affect operator HMIs, billing and backend systems (examples: Suncor 2023 affecting operations, steady surge of attacks reported by Check Point). These incidents show how IT compromise cascades into operational impact. 
4.  Guidance & preparedness driven by Ukraine (post-2015), [isa.org](https://www.isa.org/intech-home/2017/march-april/features/ukrainian-power-grids-cyberattack "Special Section: Ukrainian power grids cyberattack") — Ukraine attacks drove US/Canada policy (DOE/CISA advisories) and sector exercises; the attacks are frequently cited in industry threat models. 

Summary: North America has many criminal incidents affecting utilities (often ransomware/IT), broad IoT botnet 
history, and research revealing smart-meter/inverter weaknesses; fewer public reports of mass smart-device fleet 
manipulation in the wild.

## APAC (China, India, Japan, Australia) — regional summary

1.  Rogue communications modules found in Chinese inverters (2025, [Reuters](https://www.reuters.com/sustainability/climate-energy/ghost-machine-rogue-communication-devices-found-chinese-inverters-2025-05-14/ "Rogue communication devices found in Chinese solar ...")) — U.S. researchers reported finding undocumented/rogue communication devices in some Chinese solar power inverters — a supply-chain/firmware provenance concern with potential for remote control or unexpected channels. This is a recent, high-profile disclosure (investigative reporting). 
2.  Widespread meter tampering / fraud cases (India, ongoing), [The Times of India](https://timesofindia.indiatimes.com/city/bhopal/2k-power-thefts-found-as-consequence-of-contentious-smart-meter-drive/articleshow/123350785.cms "2k power thefts found as consequence of 'contentious' ...")] — Indian utilities regularly report large numbers of tampered meters and detection drives uncovering mass manipulation and theft; many are physical or local-adjacency frauds rather than remote nation-scale cyberattacks, but the impact is large.
3.  Research evidence & demonstrations (Japan, Australia), [upstream.auto](https://upstream.auto/blog/cybersecurity-and-privacy-risks-of-ev-charging-networks/ "EV CPO Under Siege: A New Attack Exposed ...") — Japan and Australia have active research/testbed communities demonstrating device and protocol weaknesses; Australia’s AEMO/ACSC guidance and test exercises are well developed. These are defensive/research outputs rather than mass exploitation events. 
4.  Device CVEs & vendor advisories, [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-5747 "CVE-2025-5747 - NVD") — As with other regions, multiple vendor/device vulnerabilities (EV chargers, inverters) surface in public CVE/NVD feeds; these are often patched or disclosed to vendors before broad exploitation is reported. (Examples: recent [Wolfbox CVEs recorded in NVD in 2025](../re-cve/wolfbox-cluster.md).)

Summary: APAC shows significant supply-chain and fraud incidents (meter tampering) plus worrying device provenance 
findings; public mass-exploitation of smart fleets is rare in open sources but the region’s heterogeneity raises risk.

## Patterns by region

*   EU: mix of academic disclosures, ICS precedents (Ukraine) and vendor CVEs; policy response (NIS2) strong.
*   UK/Ireland: rollout and operational faults dominate public record; research and regulation (NCSC/Ofgem) drive fixes.
*   North America: many ransomware/IT incidents and IoT botnets; preparedness and standards (NERC CIP) are central.
*   APAC: lots of meter tampering (fraud), supply-chain / provenance issues, and device CVEs; maturity varies by country.

## Caveats and limits

*   Under-reporting: many incidents are not publicly disclosed (regulated reporting windows, vendor NDAs, or national secrecy for ICS incidents). Public lists under-count true numbers.
*   Research vs exploitation: academic/r\&d disclosures (e.g., smart meter hacks, EV charger proofs-of-concept) are often conflated with “attacks” in media; I separate demos from criminal/state actions above.
*   Rapid change: CVEs and disclosures (e.g., Wolfbox 2025 entries, Reuters 2025 inverter findings) continue to appear; the landscape evolves quickly. For any operational decision, verify the latest advisories.
