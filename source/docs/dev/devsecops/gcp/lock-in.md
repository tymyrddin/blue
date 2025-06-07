# Google Cloud (GCP) lock-in assessment

## Lock-in risks

- Proprietary Databases:  
  - Cloud Spanner (globally distributed, unique SQL dialect)  
  - Firestore (Google-specific NoSQL API)  
  - BigQuery (serverless analytics with GCP-only optimizations)  
- Serverless & Compute:  
  - Cloud Functions (Google-specific triggers)  
  - Cloud Run (managed containers with GCP quirks)  
- Storage & Networking:  
  - Cloud Storage (similar to S3 but different API)  
  - Google’s global load balancer (unique to GCP)  
- Management & IaC:  
  - Deployment Manager (GCP-only)  
  - Org Policies (Google-specific governance)  

## How to check for lock-in

1. Inventory: Use Anthos Config Management for dependency mapping.  
1. API Audit: Check for `@google-cloud/*` libraries.  
1. Cost Check: Review GCP Pricing Calculator (egress: $0.08–$0.12/GB).  

## Mitigation strategies

- Use standard SQL (PostgreSQL/MySQL) instead of Spanner.  
- Replace Cloud Functions with Knative on GKE.  
- Use Terraform instead of Deployment Manager.  

