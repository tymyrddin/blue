# The dragon attack exercise

Commander Vimes visits again. This time, he has a suggestion.

"Ms. Dearheart, Mr. Stibbons," Vimes begins, boots up on Adora Belle's desk (she glares but doesn't object), "you've 
built good security. But have you tested it against something... realistic?"

"Define realistic," Ponder says nervously.

"A dragon attack."

"A what?"

"Your datacenter is in Finland. Dragons are rare there but not unknown. What happens if one decides your Hetzner 
facility makes a good nesting site?"

Silence.

"Or," Vimes continues, "an earthquake. Fire. Flood. Someone accidentally damages the main network cable with a 
forklift. You've planned for security incidents. Have you planned for disasters?"

Dr. Crucible interrupts: "Actually, I may be able to arrange a controlled dragon incident. For testing purposes. I 
know someone at the Lancre Dragon Sanctuary."

Three weeks later, they're running a disaster recovery exercise. The dragon (small, cooperative, well-compensated) 
creates a localized emergency near the Hetzner datacenter. Not real danger, but enough to trigger failover procedures.

## What they built

Ponder and Carrot architect multi-region Disaster Recovery (DR). Primary region: Finland (fsn1). DR region: Germany 
(nbg1). Perhaps add Helsinki (hel1) for Nordic customers.

Database replication: streaming replication for PostgreSQL. Write to primary, asynchronous replication to DR. 
Replication lag monitored; alert if exceeds 1 second.

Application deployment: identical infrastructure in both regions. Load balancers health-check both. GeoDNS routes 
traffic to nearest healthy region.

Failover automation: monitors primary region health. Three consecutive health check failures trigger automatic 
failover. DNS TTL set to 60 seconds for quick propagation.

The dragon attack exercise results:

- Automated failover activated: 6 minutes after simulated outage
- Total customer-facing downtime: 11 minutes
- Data loss: 0 (replication lag was 0.3 seconds at failover time)
- Recovery: Complete when "dragon departed"

Lessons learned: 17 items documented. Procedures updated. Six new runbooks created.

They send the dragon an additional thank-you gift basket.

## Runbooks

* Multi-region architecture
* Database replication setup
* Failover automation
* GeoDNS configuration
* DR testing procedures
* Recovery procedures

## Related

- [Business continuity planning](https://purple.tymyrddin.dev/docs/risk-management/)
- [DR scenario testing](https://purple.tymyrddin.dev/docs/choreographies/scenario-planning)
