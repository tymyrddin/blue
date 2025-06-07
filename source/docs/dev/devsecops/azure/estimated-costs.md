# Azure: Nice dashboard, shame about the costs

Based on this pipeline (so just a starter pipeline): [Foundation for a secure Azure deployment pipeline](pipeline.md)
, these are guesstimates for comparison.

## Best case – Clean DevSecOps setup with budget guardrails

**€160/month**

* Compute (Azure DevOps agents, Functions): €40
* Blob Storage (Cool tier mostly): €20
* Egress (build results, deploy logs): €20
* Azure DevOps pipelines: €30
* Monitoring (minimal retention): €15
* Key Vault, Resource Groups: €35

*You’ve made peace with YAML pipelines and tag your resources religiously. Azure billing weeps with boredom.*

---

### Worst case – Spaghetti pipeline, forgotten dev resources

**€380/month**

* Compute (Function triggers + test VMs): €80
* Blob Storage (some in Hot tier, oops): €35
* Egress (someone enabled CDN?): €65
* Monitoring (Log Analytics left open): €70
* Azure DevOps hosted agents scaling unchecked: €60
* Surprise Licensing (SQL Server, Premium tier): €70

*Azure: where the default setting is "Yes, bill me."*