# IOC generation

In the grand tradition of the Patrician's intelligence gathering, Indicators of Compromise (IOCs) serve as the 
fingerprints left behind by miscreants attempting to manipulate the routing fabric of the Internet. Much as 
Sergeant Colon might catalogue suspicious persons loitering near the Palace, we must catalogue the digital 
signatures of BGP hijacking attempts.

This page and code demonstrates how to extract IOCs from our simulator scenarios and fashion them into useful threat 
intelligence, suitable for distribution to fellow defenders of the realm.

## Disclaimer

All code in this module that generates IOCs (Indicators of Compromise) is intended solely for simulation and testing within the simulator environment. It is not guaranteed to reflect real-world threat feeds or operational accuracy.

While the generated IOCs can be useful for learning, experimentation, and getting started with real-world threat analysis, they should never be used as the sole basis for production security decisions.

Use at your own risk. Always validate and supplement with trusted, real-world sources when applying threat intelligence in operational environments.

## Extracting IOCs from scenarios

### Malicious ASNs

Autonomous System Numbers (ASNs) are rather like noble house sigils, they identify who's responsible for routing 
traffic. When one goes rogue, it's worth remembering.

[🐙 Extracting attacker ASNs from playbook scenarios](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/extracting_attacker_asns.py) 
is for sniffling out the rotten turnips who're fiddling with BGP routes by faking their ROA paperwork and then looking 
at who turns their nose up at it.

### Suspicious Prefix Announcements

[🐙 Prefix announcements are the calling cards of BGP hijackers](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/suspicious_prefix_announcements.py). Like tracking which pubs the Thieves' Guild frequents, 
we must note which address spaces attract unwanted attention.

### Known attacker infrastructure

[🐙 The infrastructure behind attacks](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/known_attacker_infra.py), login sources, control servers, and suspicious network locations, 
deserves cataloguing, much like the Thieves' Guild's register of suspicious locksmiths.

## Creating threat feeds

### STIX 2.1 Format

[🐙 STIX (Structured Threat Information Expression) is rather like the official City Watch crime reports](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/stix_2_format.py), 
formal, structured, and suitable for sharing with other jurisdictions.

### OpenIOC Format

[🐙 OpenIOC is the more practical, working-class format](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/openioc_format.py), 
favoured by those who need to get things done without excessive ceremony.

### CSV Format

Sometimes the simplest approach is best, like a well-organised ledger at the Post Office. 

[🐙 CSV feeds are universally readable and splendidly practical](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/csv_format.py)

## Updating Detection Rules with IOCs

Once you've gathered your IOCs, they must be distributed to the relevant detection systems, rather like posting 
wanted notices throughout the city.

### Updating Wazuh rules dynamically

[🐙 Wazuh updater](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/wazuh_updater.py)

### Updating Splunk lookups

[🐙 Splunk lookup updater](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/splunk_lookup_updater.py)

## Threat feed management

Managing threat feeds is rather like managing the City Watch's intelligence network. It requires organisation, 
regular updates, and knowing which sources to trust.

### Automated feed update system

[🐙 Feed update system ](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/feed_update_system.py)

### Feed distribution via HTTP API

[🐙 Feed distribution](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/feed_distribution_http_api.py)

### Automated Feed Ingestion Client

[🐙 Feed ingestion](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/ioc-generation/threat_feed_client.py)

## Conclusion

The generation and distribution of IOCs from BGP hijacking scenarios follows a well-trodden path: extract indicators from observed behaviour, format them for various consumption methods (STIX for the sophisticated, CSV for the pragmatic), distribute them through reliable channels, and integrate them into detection systems with appropriate automation.

Much like the semaphore system connecting the cities of the Disc, a well-maintained threat intelligence infrastructure ensures that warning of attacks propagates faster than the attacks themselves. The key is to be systematic, maintain good records, verify integrity at every step, and remember that an indicator is only as valuable as the detection rule that acts upon it.

As the saying goes in Ankh-Morpork: "An ounce of prevention is worth a pound of cure, but a well-distributed threat feed is worth its weight in gold."

*"The presence of those seeking the truth is infinitely to be preferred to the presence of those who think they've found it.", Terry Pratchett, Monstrous Regiment*