# Foundation for a secure GCP deployment pipeline

This guide provides the foundation for a security-hardened CI/CD pipeline for Dockerised applications on Google 
Cloud Platform (GCP) in Europe (e.g., europe-west1, europe-west4). It includes infrastructure-as-code (Terraform), 
Cloud Build CI/CD, Artifact Registry, Cloud Run (or GKE for Kubernetes), Secret Manager, and security best practices 
with detailed explanations.

## Architecture overview

Developer → Cloud Source Repositories → Cloud Build (CI) →  
Artifact Registry (Docker) → Cloud Run / GKE (Staging/Prod) →  
Cloud Armor (WAF) + IAP (Zero Trust) → Cloud Monitoring + Security Command Center

Key Features:

* EU Data Residency: All resources deployed in europe-west1 (Belgium) or europe-west4 (Netherlands).
* Immutable Docker Images: Stored in Artifact Registry with vulnerability scanning.
* Least Privilege IAM: Service accounts with minimal permissions.
* Secret Management: Secrets stored in Secret Manager (encrypted with KMS).
* Zero Trust: Identity-Aware Proxy (IAP) for secure access.
* Automated Security Scanning: Container Analysis + Cloud Security Scanner.

## Prerequisites

* GCP Account with Billing Enabled.
* Google Cloud SDK (gcloud) installed and authenticated.
* Terraform (for IaC).
* Docker installed locally.
* A Dockerised application (e.g., a simple Flask/Node.js app).

## Setting Up GCP infrastructure

### Enable required GCP APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  container.googleapis.com \
  cloudkms.googleapis.com \
  iap.googleapis.com \
  compute.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  securitycenter.googleapis.com
```

### Terraform setup (Infrastructure-as-Code)

`main.tf` (Base setup):

```
terraform {
  required_version = ">= 1.3.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.65" # Latest stable
    }
  }
}

provider "google" {
  project = "your-gcp-project-id"
  region  = "europe-west1"
  zone    = "europe-west1-b"
}

# Service Account for CI/CD Pipeline (Least Privilege)
resource "google_service_account" "cicd_sa" {
  account_id   = "cicd-pipeline-sa"
  display_name = "CI/CD Pipeline Service Account"
}

# Grant minimal permissions to CI/CD SA
resource "google_project_iam_member" "cicd_roles" {
  for_each = toset([
    "roles/cloudbuild.builds.builder",
    "roles/artifactregistry.writer",
    "roles/run.developer",
    "roles/secretmanager.secretAccessor",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ])
  project = "your-gcp-project-id"
  role    = each.key
  member  = "serviceAccount:${google_service_account.cicd_sa.email}"
}

# Artifact Registry for Docker Images (with Vulnerability Scanning)
resource "google_artifact_registry_repository" "docker_repo" {
  location      = "europe-west1"
  repository_id = "secure-app-repo"
  description   = "Docker repository for secure app"
  format        = "DOCKER"
  kms_key_name  = google_kms_crypto_key.artifact_registry_key.id
}

# KMS Key for Encryption
resource "google_kms_key_ring" "key_ring" {
  name     = "secure-app-keyring"
  location = "europe-west1"
}

resource "google_kms_crypto_key" "artifact_registry_key" {
  name            = "artifact-registry-key"
  key_ring        = google_kms_key_ring.key_ring.id
  rotation_period = "90d" # Auto-rotate every 90 days
}

# Cloud Run (Serverless) or GKE (Kubernetes)
resource "google_cloud_run_service" "prod" {
  name     = "secure-app-prod"
  location = "europe-west1"

  template {
    spec {
      containers {
        image = "europe-west1-docker.pkg.dev/your-gcp-project-id/secure-app-repo/app:latest"
        env {
          name = "DB_PASSWORD"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.db_password.secret_id
              key  = "latest"
            }
          }
        }
      }
      service_account_name = google_service_account.cloud_run_sa.email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_iam_member.cloud_run_sa]
}

# Secret Manager for DB Password
resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"
  replication {
    automatic = true
  }
  encryption_key = google_kms_crypto_key.secret_key.id
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = "initial-password" # Rotate after first deploy!
}

# IAP (Identity-Aware Proxy) for Zero Trust
resource "google_iap_client" "oauth_client" {
  display_name = "Secure App IAP"
  brand        = "projects/your-gcp-project-id/brands/your-brand"
}
```

## CI/CD Pipeline with cloud build

`cloudbuild.yaml` (Secure CI/CD Pipeline)

```yaml
steps:
  # Step 1: Build Docker Image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--no-cache' # Ensure no cached layers with vulnerabilities
      - '-t'
      - 'europe-west1-docker.pkg.dev/$PROJECT_ID/secure-app-repo/app:$COMMIT_SHA'
      - '-t'
      - 'europe-west1-docker.pkg.dev/$PROJECT_ID/secure-app-repo/app:latest'
      - '.'
    id: 'build'

  # Step 2: Vulnerability Scan with Trivy
  - name: 'aquasec/trivy'
    args:
      - 'image'
      - '--exit-code=1'
      - '--severity=CRITICAL'
      - 'europe-west1-docker.pkg.dev/$PROJECT_ID/secure-app-repo/app:$COMMIT_SHA'
    id: 'vulnerability-scan'

  # Step 3: Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'europe-west1-docker.pkg.dev/$PROJECT_ID/secure-app-repo/app:$COMMIT_SHA'
    id: 'push'

  # Step 4: Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - 'gcloud'
      - 'run'
      - 'deploy'
      - 'secure-app-prod'
      - '--image=europe-west1-docker.pkg.dev/$PROJECT_ID/secure-app-repo/app:$COMMIT_SHA'
      - '--region=europe-west1'
      - '--platform=managed'
      - '--quiet'
    id: 'deploy'

# Security Options
options:
  logging: CLOUD_LOGGING_ONLY # No local logs
  machineType: 'E2_HIGHCPU_8' # Faster builds
  env:
    - 'DOCKER_BUILDKIT=1' # Secure build mode

# Artifacts (for auditing)
artifacts:
  images:
    - 'europe-west1-docker.pkg.dev/$PROJECT_ID/secure-app-repo/app:$COMMIT_SHA'
```

Triggering the pipeline

```bash
# Submit build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=europe-west1,_SERVICE_NAME=secure-app-prod
```

## Security hardening

IAM Best practices:

* Least Privilege: Only grant necessary roles (roles/run.developer, roles/secretmanager.secretAccessor).
* Workload Identity: Use Service Accounts instead of user accounts.
* Conditional IAM: Restrict access by IP, VPC-SC, or IAM conditions.

Network security:

* VPC-SC (VPC Service Controls): Prevent data exfiltration.
* Cloud Armor (WAF): Block SQLi, XSS, DDoS.
* Private Cloud Run / GKE: Disable public ingress if possible.

Secrets management:

* Never store secrets in Git → Use Secret Manager.
* Auto-rotate secrets using KMS.

Container security:

* Immutable Tags: Use COMMIT_SHA instead of latest.
* Distroless Images: Use minimal base images.
* Rootless Containers: Run as non-root (USER 1000 in Dockerfile).


## Monitoring & compliance

### Cloud monitoring & logging

```
# Alert on failed deployments
resource "google_monitoring_alert_policy" "failed_deployments" {
  display_name = "Cloud Build Failures"
  combiner     = "OR"

  conditions {
    display_name = "Build Failure"
    condition_threshold {
      filter     = "resource.type=\"build\" AND metric.type=\"logging.googleapis.com/user/cloudbuild_build\" AND severity=\"ERROR\""
      comparison = "COMPARISON_GT"
      duration   = "60s"
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}
```

### Security command center (SCC)

* Enable Security Health Analytics.
* Enable Container Threat Detection.

```bash
gcloud services enable securitycenter.googleapis.com
gcloud scc notifications create secure-app-alerts \
  --organization=YOUR_ORG_ID \
  --description="Security alerts for secure-app" \
  --pubsub-topic=projects/YOUR_PROJECT/topics/security-alerts
```

## Code examples

Dockerfile (Security-Hardened)

```dockerfile
# Use distroless base image
FROM gcr.io/distroless/nodejs:18 as runtime

# Run as non-root
USER 1000

# Copy app files
WORKDIR /app
COPY --chown=1000:1000 . .

# Expose port (HTTPS only)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/health || exit 1

# Start app
CMD ["server.js"]
```

Terraform outputs

```
output "cloud_run_url" {
  value = google_cloud_run_service.prod.status[0].url
}

output "artifact_registry_url" {
  value = google_artifact_registry_repository.docker_repo.repository_url
}
```

## Security checklist 

* All resources in europe-west1 (GDPR compliant).
* Immutable Docker images (no latest in production).
* Least Privilege IAM (no broad roles).
* Secrets in Secret Manager (encrypted with KMS).
* Vulnerability scanning (Artifact Registry + Trivy).
* Zero Trust with IAP (no public access if possible).
* Monitoring + Alerts (Cloud Monitoring + SCC).