# AWS lock-in assessment

## Lock-in risks  

- Proprietary databases:  
  - Aurora (PostgreSQL/MySQL-compatible but with AWS extensions)  
  - DynamoDB (NoSQL with unique API)  
  - Redshift (custom data warehouse format)  
- Serverless & Compute:  
  - Lambda (AWS-specific event triggers, runtime environments)  
  - Fargate (proprietary container orchestration)  
- Storage & Networking:  
  - S3 (API is standard, but egress costs apply)  
  - EBS snapshots (AWS-specific format)  
  - VPC (AWS-only networking constructs)  
- Management & IaC:  
  - CloudFormation (not portable to other clouds)  
  - AWS IAM (custom policy language)  

## How to check for lock-in  

1. Inventory: Use AWS Trusted Advisor or AWS Migration Hub to list dependencies.  
1. Cost Analysis: Check AWS Cost Explorer for egress fees ($0.09/GB for inter-region).  
1. API Audit: Scan code for AWS SDK calls (e.g., `boto3`, `aws-sdk`).  

## Mitigation strategies

- Use Terraform instead of CloudFormation.  
- Migrate Aurora → PostgreSQL RDS (more portable).  
- Replace Lambda with containers (ECS/EKS) for easier migration.  

