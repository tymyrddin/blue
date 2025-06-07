# AWS: The bill that never ends

Based on this pipeline (so just a starter pipeline): [Basis for a secure AWS deployment pipeline](pipeline.md)
, these are guesstimates for comparison.

## Best case – Minimal, disciplined setup

**€145/month**

* Compute (t3.small EC2, build agents): €35
* S3 (standard & infrequent access): €15
* Egress (CI/CD logs, artefacts): €25
* Lambda + API Gateway: €20
* CloudWatch (trimmed logs): €15
* IAM, Route53, etc: free\* (\*until you need them properly)

*You’ve tagged everything. You delete temp resources. You even shut down dev at night. You're either a unicorn or terrified of your CFO.*

---

## Worst case – The Dev left some EC2s up edition

**€340/month**

* Compute (EC2, Lambda, forgotten staging VMs): €95
* S3 (non-expiring buckets, versioning enabled): €35
* Egress (artifacts, preview deploys, Slack images): €75
* CloudWatch logs (left at debug): €50
* NAT Gateway: €45
* RDS test DB no one uses: €40

*Every NAT Gateway is a slow financial haemorrhage. CloudWatch stores every sneeze. Welcome to the billing dungeon.*
