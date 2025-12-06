# Multi-cloud & on-prem CI/CD deployment how-to

A guide for deploying secure Dockerised apps on AWS, Azure, GCP, and on-prem (Hetzner)

This guide references the complete code examples provided earlier and explains where to implement each component 
across the four environments.

## Infrastructure setup

| Component	          | AWS	                   | Azure	                 | GCP	                     | On-Prem (Hetzner)             |
|---------------------|------------------------|------------------------|--------------------------|-------------------------------|
| Compute	            | ECS Fargate / EKS	     | AKS	Cloud Run / GKE	   | k3s (Kubernetes)         |
| Container Registry	 | ECR	                   | ACR	                   | Artifact Registry	       | Harbor                        |
| Networking	         | VPC + WAF	             | VNet + Azure Firewall	 | VPC + Cloud Armor	       | WireGuard + Cloudflare Tunnel |
| Secrets Management	 | Secrets Manager + KMS	 | Key Vault	             | Secret Manager + KMS	    | HashiCorp Vault               |
| Identity	           | IAM Roles	             | Azure AD + RBAC	       | IAM + Workload Identity	 | Gitea OAuth + k3s RBAC        |

Action Items:

* AWS: Use Terraform to create ECR, EKS, and WAF (see AWS code).
* Azure: Deploy AKS with main.bicep (Azure code).
* GCP: Run gcloud commands to enable APIs and Terraform for Artifact Registry (GCP code).
* On-Prem: Provision Hetzner VMs and install k3s/Harbor (On-Prem code).

## CI/CD pipeline configuration

| Component	         | AWS	               | Azure	            | GCP	                        | On-Prem       |
|--------------------|--------------------|-------------------|-----------------------------|---------------|
| Source Control	    | CodeCommit	        | Azure Repos	      | Cloud Source Repos	         | Gitea         |
| CI Tool	           | CodeBuild	         | Azure Pipelines	  | Cloud Build	                | Drone CI      |
| CD Tool	           | CodePipeline	      | Azure Pipelines	  | Cloud Deploy	Argo CD        |
| Security Scanning	 | Trivy + Inspector	 | Trivy + Defender	 | Trivy + Container Analysis	 | Trivy + Falco |

Action Items:

* AWS: Configure buildspec.yml for CodeBuild (AWS pipeline).
* Azure: Set up azure-pipelines.yml (Azure pipeline.
* GCP: Deploy cloudbuild.yaml (GCP pipeline).
* On-Prem: Use .drone.yml for Drone CI (On-Prem pipeline).

## Security hardening

| Control	          | AWS	                       | Azure	                   | GCP	                        | On-Prem                |
|-------------------|----------------------------|--------------------------|-----------------------------|------------------------|
| Image Security	   | ECR Scanning + Distroless	 | ACR Content Trust	       | Artifact Registry Scanning	 | Harbor + Clair         |
| Runtime Security	 | GuardDuty + AppMesh	       | Defender for Containers	 | Security Command Center	    | Falco + AppArmor       |
| Network Security	 | WAF + PrivateLink	         | NSG + Private Endpoints	 | Cloud Armor + IAP	          | WireGuard + Cloudflare |
| Secrets	          | Secrets Manager	           | Key Vault	               | Secret Manager	             | Vault                  |

Action Items:

All Clouds:

* Use distroless/base images (see Dockerfile examples).
* Enable vulnerability scanning (ECR/ACR/Artifact Registry/Harbor).

On-Prem:

* Deploy WireGuard (wg0.conf) and Cloudflare Tunnel.
* Install Falco for runtime monitoring.

## Monitoring & compliance

| Tool	       | AWS	                       | Azure	                          | GCP	                     | On-Prem               |
|-------------|----------------------------|---------------------------------|--------------------------|-----------------------|
| Logging	    | CloudWatch	                | Azure Monitor	                  | Cloud Logging	           | Loki                  |
| Monitoring	 | CloudWatch Alarms	         | Azure Monitor Alerts	           | Cloud Monitoring	        | Prometheus + Grafana  |
| Compliance	 | AWS Config + Security Hub	 | Azure Policy + Security Center	 | Security Command Center	 | Manual Audits + Falco |

Action Items:

* AWS/Azure/GCP: Enable cloud-native monitoring (see AWS, Azure, GCP).
* On-Prem: Deploy Prometheus stack:

```bash
helm install prometheus prometheus-community/kube-prometheus-stack
```

## Deployment workflow

* Develop → Push code to Git (CodeCommit/Azure Repos/Cloud Source/Gitea).
* Build → CI pipeline builds, scans, and pushes images (CodeBuild/Azure Pipelines/Cloud Build/Drone).
* Secure → Scan images and enforce policies (Trivy, Falco, WAF).
* Deploy → CD tool deploys to production (CodePipeline/Argo CD).

## Maintenance checklist

Weekly:

* Rotate secrets (AWS Secrets Manager/Azure Key Vault/GCP Secret Manager/Vault).
* Update base images (Distroless/Alpine).

Monthly:

* Review IAM roles/service accounts.
* Audit network policies.

Quarterly:

* Penetration testing.
* Compliance review (GDPR/SOC 2).

## When to use which solution?

| Scenario	          | Recommended Platform	 | Why?                            |
|--------------------|-----------------------|---------------------------------|
| Enterprise Hybrid	 | Azure	                | Seamless AD integration         |
| Serverless Focus	  | AWS	                  | Mature ECS Fargate + Lambda     |
| Google Ecosystem	  | GCP	                  | Native Kubernetes + Anthos      |
| Data Sovereignty	  | On-Prem (Hetzner)	    | Full control, EU data residency |

## Next steps

* Implement Terraform/IaC for the chosen platform.
* Deploy the CI/CD pipeline (reference code samples).
* Enable security controls (WAF, scanning, zero trust).
* Set up monitoring (Prometheus/CloudWatch/Azure Monitor).
