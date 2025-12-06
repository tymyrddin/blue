# Where are the backups?

The question comes during a routine meeting. Adora Belle, reviewing quarterly business items, asks: "Ponder, where are our backups?"

Silence.

"We have backups, right?"

More silence.

"PONDER."

He coughs. "Define 'backups.'"

"Copies of our data stored separately so that if something catastrophic happens to our primary systems, we can restore operations."

"Ah. Then no. Not formally. I mean, there are some snapshots on the Hetzner volumes, but those are in the same 
datacenter, and if there's a fire ..."

"A fire?"

"... or flood, or the warehouse gets knocked down by an errant dragon, or someone decides to test a very experimental 
thaumic device too close to the servers, which happened at UU once, then we'd lose everything."

Cheery Littlebottom, the new forensic accountant turned risk manager, looks up from her notes. "This is a critical 
risk. High impact, moderate probability. Unacceptable."

## What they built

Ponder deploys [Restic](https://github.com/restic/restic/releases) as their backup solution. Encrypted backups go to 
Hetzner Storage Boxes in Finland (5TB capacity). Encryption keys stored in Vault, naturally.

Backup schedule: daily incrementals at 23:00 Ankh-Morpork time, weekly fulls every Sunday at 2:00. Retention policy: 
90 days of dailies, 2 years of weeklies.

Everything backs up: databases, application data, configurations, Vault data (encrypted separately), Git repositories, 
documentation, even the Graylog indices (90-day retention).

Age encryption for backup archives. Modern, quantum-resistant by design according to Dr. Crucible. "We're planning 
for the long term."

Monitoring ensures backups complete successfully. Alert if backup hasn't run in 24 hours. Alert if backup fails. 
Alert if restore test fails.

Restore testing is quarterly. Cheery manages it personally. Last test: successfully restored the entire Merchants' 
Guild database to a separate system. Time elapsed: 47 minutes. Documentation updated with lessons learned.

They also establish DR procedures for multi-region failover, though that comes later.

## Runbooks

* Restic deployment
* Encryption configuration
* Backup scheduling
* Monitoring setup
* Restore procedures
* Testing protocols
* Disaster Recovery planning

