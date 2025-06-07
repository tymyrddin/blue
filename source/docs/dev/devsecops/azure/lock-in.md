# Microsoft Azure lock-in assessment

## Lock-in risks

- Proprietary Databases:  
  - Azure Cosmos DB (multi-model, Microsoft’s API extensions)  
  - Azure SQL Database (SQL Server with Azure-only features)  
- Serverless & Compute:  
  - Azure Functions (Microsoft-specific triggers/bindings)  
  - Logic Apps (low-code workflows tied to Azure)  
- Storage & Networking:  
  - Blob Storage (similar to S3 but different API)  
  - Azure AD (deep integration with Microsoft ecosystem)  
- Management & IaC:  
  - ARM Templates (Azure-only)  
  - Azure Policy (custom compliance rules)  

## How to check for lock-in  

1. Inventory: Use Azure Migrate to assess dependencies.  
1. API Audit: Look for `Microsoft.Azure.*` SDK calls.  
1. Cost Check: Review Azure Pricing Calculator for egress fees ($0.087/GB).  

## Mitigation strategies  

- Use PostgreSQL Flexible Server instead of Cosmos DB where possible.  
- Replace ARM with Terraform/Bicep (more portable).  
- Avoid Logic Apps in favor of Kubernetes-based workflows.  
