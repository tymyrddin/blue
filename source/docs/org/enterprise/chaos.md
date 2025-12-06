# Chaos engineering

Ponder is reviewing incident reports. "We keep saying we're resilient. We've tested DR once with the 
[dragon attack exercise](../scale-up/dragon-attack.md). But are we really resilient? Do we know what breaks and what 
doesn't?"

Dr. Crucible has thoughts. "At the Unseen University, we tested magical defences by actually attacking them. 
Controlled chaos. We should do the same with infrastructure."

"You want to break things on purpose?" Ponder looks skeptical.

"I want to know what breaks before it breaks in production."

Adora Belle approves. "But carefully. Very carefully."

## What they built

Dr. Crucible deploys [Litmus](https://github.com/litmuschaos/litmus/releases) for chaos engineering experiments. 
Start simple in staging. Graduate to production carefully.

Experiment types:

- Pod deletion (random pods killed)
- Network latency injection (add 500ms delay)
- CPU stress (max out CPU on random nodes)
- Memory stress (consume available memory)
- Node failure (drain and delete random node)
- Region failure (simulate entire datacenter offline)

Chaos schedule:

- Daily: random pod deletion in staging
- Weekly: network latency, resource stress in staging
- Weekly: pod deletion in production (low-traffic periods)
- Monthly: node failure in production
- Quarterly: region failure simulation

Hypothesis-driven: before each experiment, write hypothesis. "If we delete this pod, we expect automatic restart 
within 30 seconds and no user-facing impact."

Results documented: what happened, what broke, what worked, what needs fixing.

Recent experiment: simulate Finland datacenter complete failure (coordinated with customers, 24-hour notice).

Execution: automated failover to Germany region. All health checks fail for Finland. DNS switches over. Applications 
restart in Germany.

Results:

- Automatic failover: 4 minutes
- Customer-facing impact: 4 minutes elevated latency, no errors
- Data loss: 0 (replication lag was 0.3 seconds)
- Recovery: complete when Finland "came back online"

Issues found: DNS caching caused longer delays than expected for some users (fixed), monitoring alerts needed 
tuning (improved), runbooks updated with new timing data.

Confidence in resilience increases significantly. "We know we can survive a datacenter failure now. We've tested it."

## Runbooks

* Litmus deployment experiment design
* Hypothesis development
* Execution procedures
* Rollback processes 
* Result analysis

## Related

[Organisational risk audits & resilience assessments](https://purple.tymyrddin.dev/docs/audits/resilience/)
