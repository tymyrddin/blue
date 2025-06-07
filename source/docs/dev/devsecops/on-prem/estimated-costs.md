# On-Prem @ Hetzner cloud costs *“DIY, but actually sane”*

Based on this pipeline (so just a starter pipeline): [Secure on-premises CI/CD pipeline (Hetzner, Finland)](pipeline.md)
, these are guesstimates for comparison.

## Best case – Ubuntu VMs, discipline, and cron jobs

**€80/month**

* Dedicated vCPU cloud instance: €30
* Storage (Volume + backups): €20
* Egress: €10
* CI/CD runner + firewall rules: €5
* Monitoring with Grafana, self-hosted: €10
* Misc (Ubuntu updates, small DNS costs): €5

*Hetzner: like having your own datacentre, but with fewer forklifts. Everything is under your control. Gloriously cheap.*

---

## Worst case – Forgotten volumes and no firewall

**€155/month**

* Over-provisioned cloud instance: €45
* Unattached volumes still billing: €25
* Egress from open IPs and test scripts: €30
* Backups of backups of backups: €20
* No auto-shutdown: €15
* Monitoring VM left running: €20

*You’re still saving money, but now you’re also worried about botnet scans and SSH brute force attempts at 3am.*