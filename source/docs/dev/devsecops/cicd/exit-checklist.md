# Big tech cloud exit checklist

## Phase 1: Reality check

☐ **Audit your current cloud usage**

* Inventory services, dependencies, regions, and lurking Lambda functions.
* Identify critical workloads vs vanity projects.

☐ **Estimate total cloud cost**

* Include hidden gremlins: egress fees, storage tiers, and zombie VMs.
  * [](../aws/estimated-costs.md)
  * [](../azure/estimated-costs.md)
  * [](../gcp/estimated-costs.md)
  * [](../on-prem/estimated-costs.md)
* Compare with realistic on-prem or hybrid costs (include staff, power, hardware).

☐ **Check for vendor lock-in**

* Look for managed services with no easy exit (e.g., proprietary databases, serverless traps).
  * [](../aws/lock-in.md)
  * [](../azure/lock-in.md)
  * [](../gcp/lock-in.md)
  * [](../on-prem/lock-in.md)
* Document migration blockers (formats, APIs, service contracts).

☐ **Assess compliance risk**

* Are you GDPR-compliant or just spiritually so?
* Know where your data physically lives and under which jurisdiction.
  * [](../aws/gdpr-compliance.md)
  * [](../azure/gdpr-compliance.md)
  * [](../gcp/gdpr-compliance.md)
  * [](../on-prem/gdpr-compliance.md)

---

## Phase 2: Plan your escape

☐ **Choose your model**

* Cloud-on-prem: full local hosting with cloud-like tools.
* Hybrid: local core + hyperscale for bursts or AI training.
* Multicloud: diversify, but be ready to juggle.

☐ **Select your toolkit**

* **Orchestration**: Kubernetes, Nomad, or a stiff gin.
* **IaaS replacement**: OpenStack, Proxmox, Harvester.
* **CI/CD + secrets**: GitLab, ArgoCD, HashiCorp Vault.

☐ **Pick a European provider (if applicable)**

* [Hetzner](https://www.hetzner.com/) for power-efficient, no-nonsense infra.
* [UpCloud](https://upcloud.com/) for low-latency EU edge.
* [Greenhost](https://greenhost.net/) or [1984.is](https://1984.hosting/) if you fancy civil liberties with your compute.

☐ **Pilot and test**

* Start with dev/test environments.
* Benchmark latency, throughput, and your team’s morale.

---

## Phase 3: Migrate like a professional

☐ **Move core workloads**

* Prioritise data sovereignty: HR, healthcare, legal, anything that screams “breach me”.
* Document every step. The future will be grateful.

☐ **Refactor or replace cloud-native services**

* Replace proprietary functions (e.g., AWS Lambda) with open equivalents.
* Use containers, not Stockholm Syndrome.

☐ **Set up proper monitoring and alerting**

* Grafana > guessing.
* Avoid outages caused by a silent disk filling up since last Christmas.

☐ **Implement backup & disaster recovery**

* Test restores, not just backups.
* Store backups somewhere Uncle Sam doesn’t have keys.

---

## Phase 4: Post-migration hygiene

☐ **Decommission responsibly**

* Delete unused cloud resources (don't just *think* you did).
* Watch final invoices like a hawk with trust issues.

☐ **Update policies and documentation**

* New infrastructure = new responsibilities.
* Train staff. Resist eye-rolls.

☐ **Monitor for regression**

* Don’t slide back into “just this one AWS S3 bucket…”
* Build cloud repatriation into your tech strategy.

☐ **Celebrate with your team**

* Cake, if budget allows.
* Stickers for the sysadmins.
* Inner peace from no longer funding data surveillance.

---

## Phase 5: Tell your compliance officer

* They’ll sleep better knowing your backups don’t reside under the [CLOUD Act](https://www.justice.gov/criminal/cloud-act-resources).
* And you might just avoid explaining your infrastructure to a [Data Protection Authority](https://en.wikipedia.org/wiki/National_data_protection_authority) with a grudge.
