# Best Practices for securing AWS services

AWS security follows the Shared Responsibility Model: AWS secures the cloud infrastructure, while customers secure 
their data, configurations, and access controls.

1. Identity & access management (IAM)
   * Enforce MFA for all users and roles.
   * Use IAM policies with least privilege (avoid * permissions).
2. Network security
   * Segment VPCs with private subnets and NACLs.
   * Restrict S3 buckets with bucket policies (block public access).
3. Logging & monitoring
   * Enable AWS CloudTrail (API logging) and GuardDuty (threat detection).
   * Centralise logs in S3 + Athena or a SIEM.
4. Data protection
   * Encrypt EBS volumes, S3 (SSE-KMS), and RDS with AWS KMS.
   * Use Macie for sensitive data discovery.
5. Automated compliance
   * Enforce rules with AWS Config and remediate via Lambda.

## How?

* [Basis for a secure AWS deployment pipeline](pipeline.md)

