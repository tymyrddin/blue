# GCP: Free-tier until it is not

Based on this pipeline (so just a starter pipeline): [Foundation for a secure GCP deployment pipeline](pipeline.md)
, these are guesstimates for comparison.

## Best case – Small team, Cloud Run magic, some self-restraint

**€130/month**

* Cloud Run builds, Cloud Build: €25
* Storage (Multi-region Coldline): €10
* Egress (moderate traffic): €20
* BigQuery (used once properly): €15
* Monitoring: €10
* IAM, Pub/Sub, Functions: €50 (you’re thrifty)

*You’re billed by the micrometre. Every part is fine. Until it’s not.*

---

## Worst case – CI logs and runaway BigQuery

**€310/month**

* GKE cluster from a demo never destroyed: €80
* Coldline storage turned into hot blob: €35
* Egress from preview deploys + logs: €55
* BigQuery: €45 (accidental “SELECT \*” on prod)
* Monitoring (Ops team dumped everything): €50
* Zombie projects from hackathon days: €45

*Every GCP bill contains at least one line you can’t explain.*