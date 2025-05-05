# Foundation for a secure Azure deployment pipeline

This pipeline provides a foundation for a security-focused deployment process for Dockerized applications on Azure in 
Europe, incorporating the latest security best practices at each layer of the stack.

## Architecture Overview

The secure deployment pipeline follows this architecture:

Developer → Azure Repos (Git) → Azure Pipelines (CI) → 
Azure Container Registry (ACR) → Azure Kubernetes Service (AKS) → 
Azure Monitor + Security Center

All resources will be deployed in a European region (e.g., West Europe or North Europe) for GDPR compliance.

## Prerequisites

* Azure account with sufficient permissions
* Azure DevOps organization
* Dockerized application code in a Git repository
* Azure CLI installed locally
* kubectl and Helm for Kubernetes deployments

## Setting up Azure resources

1. Create Resource Group in Europe

```bash
az group create --name SecureAppRG --location westeurope
```

2. Create Azure Container Registry (ACR)

```bash
az acr create --resource-group SecureAppRG --name SecureAppRegistryEU --sku Premium --location westeurope
```

Premium SKU includes geo-replication, content trust, and private link capabilities.

3. Create Azure Kubernetes Service (AKS)

```bash
az aks create \
  --resource-group SecureAppRG \
  --name SecureAppCluster \
  --node-count 3 \
  --enable-cluster-autoscaler \
  --min-count 3 \
  --max-count 10 \
  --enable-aad \
  --enable-azure-rbac \
  --enable-private-cluster \
  --network-plugin azure \
  --network-policy azure \
  --generate-ssh-keys \
  --location westeurope
```

Security features enabled:

* Private cluster (no public API endpoint)
* Azure AD integration
* Azure RBAC
* Network policies for pod isolation

4. Enable Azure Defender for Containers

```bash
az security pricing create --name Containers --tier standard
```

## Configuring Azure DevOps

1. Create Service Connections

* Navigate to Project Settings → Service connections
* Create an Azure Resource Manager service connection using "Workload Identity federation" (recommended) or Service Principal
* Create a connection to your ACR

2. Configure Variable Groups

Create a variable group named "SecureApp-Prod" with:

* `ACR_NAME`: SecureAppRegistryEU
* `AKS_NAME`: SecureAppCluster
* `RESOURCE_GROUP`: SecureAppRG
* `DEPLOY_REGION`: westeurope
* `IMAGE_NAME`: secureapp

Mark these as "Secret" where appropriate.

## Building the pipeline

Use an `azure-pipelines.yml` with security best practices along these lines:

```yaml
# Starter pipeline with security best practices
# Targets European Azure region with Docker + AKS

trigger:
- main

resources:
- repo: self

variables:
- group: SecureApp-Prod
- name: dockerfilePath
  value: '**/Dockerfile'
- name: tag
  value: '$(Build.SourceVersion)'
- name: imageRepo
  value: '$(ACR_NAME).azurecr.io/$(IMAGE_NAME):$(tag)'

stages:
- stage: Build
  displayName: Build and Push Container
  jobs:
  - job: Build
    displayName: Build Docker Image
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: DockerAuthenticate@0
      displayName: 'Authenticate with ACR'
      inputs:
        azureSubscription: 'AzureConnection' # Your service connection name
        containerRegistry: '$(ACR_NAME)'
    
    - task: Docker@2
      displayName: 'Build and Push'
      inputs:
        command: buildAndPush
        repository: $(IMAGE_NAME)
        dockerfile: $(dockerfilePath)
        containerRegistry: $(ACR_NAME)
        tags: |
          $(tag)
          latest
        arguments: '--pull' # Always pull base images to ensure latest patches
    
    - task: WhiteSourceBolton@20
      displayName: 'Open Source Security Scan'
      inputs:
        cwd: '$(Build.SourcesDirectory)'
        scanMode: 'incremental'
    
    - script: |
        echo "Scanning for vulnerabilities in built image..."
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
          aquasec/trivy image --exit-code 1 --severity CRITICAL $(imageRepo)
      displayName: 'Container Vulnerability Scan'
      continueOnError: false

- stage: Deploy
  displayName: Deploy to AKS
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: Deploy
    displayName: Deploy to AKS
    environment: 'Production-WEU'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: KubernetesManifest@0
            displayName: 'Create imagePullSecret'
            inputs:
              action: createSecret
              namespace: 'default'
              secretName: 'acr-auth'
              dockerRegistryEndpoint: 'AzureConnection'
              
          - task: KubernetesManifest@0
            displayName: 'Deploy to AKS'
            inputs:
              action: 'deploy'
              namespace: 'default'
              manifests: |
                $(System.DefaultWorkingDirectory)/manifests/deployment.yaml
                $(System.DefaultWorkingDirectory)/manifests/service.yaml
                $(System.DefaultWorkingDirectory)/manifests/network-policy.yaml
              imagePullSecrets: 'acr-auth'
              containers: '$(imageRepo)'
              
          - task: Kubernetes@1
            displayName: 'Enable Network Policies'
            inputs:
              command: 'apply'
              arguments: '--validate=true'
              useConfigurationFile: true
              configurationType: 'inline'
              inline: |
                kind: NetworkPolicy
                apiVersion: networking.k8s.io/v1
                metadata:
                  name: default-deny-all
                spec:
                  podSelector: {}
                  policyTypes:
                  - Ingress
                  - Egress
```

## Sample Kubernetes deployment manifest with security context

Create a `manifests/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secureapp-deployment
  labels:
    app: secureapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: secureapp
  template:
    metadata:
      labels:
        app: secureapp
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: secureapp
        image: secureappregistryeu.azurecr.io/secureapp:latest
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
          readOnlyRootFilesystem: true
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      imagePullSecrets:
      - name: acr-auth
```

## Security hardening

### Infrastructure as Code (IaC) with Bicep

Create a `infra/main.bicep` file for reproducible, secure infrastructure:

```
param location string = 'westeurope'
param clusterName string = 'SecureAppCluster'
param acrName string = 'SecureAppRegistryEU'

resource acr 'Microsoft.ContainerRegistry/registries@2021-06-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: 'Premium'
  }
  properties: {
    adminUserEnabled: false // Never enable admin user
    policies: {
      quarantinePolicy: {
        status: 'enabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'enabled'
      }
      retentionPolicy: {
        days: 30
        status: 'enabled'
      }
    }
  }
}

resource aks 'Microsoft.ContainerService/managedClusters@2021-07-01' = {
  name: clusterName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    kubernetesVersion: '1.24.3' // Use latest stable version
    enableRBAC: true
    dnsPrefix: clusterName
    agentPoolProfiles: [
      {
        name: 'nodepool1'
        count: 3
        vmSize: 'Standard_D2s_v3'
        osType: 'Linux'
        mode: 'System'
        enableAutoScaling: true
        minCount: 3
        maxCount: 10
        nodeLabels: {
          'environment': 'production'
        }
      }
    ]
    networkProfile: {
      networkPlugin: 'azure'
      networkPolicy: 'azure'
      serviceCidr: '10.0.0.0/16'
      dnsServiceIP: '10.0.0.10'
      dockerBridgeCidr: '172.17.0.1/16'
    }
    apiServerAccessProfile: {
      enablePrivateCluster: true
    }
    addonProfiles: {
      azurepolicy: {
        enabled: true
      }
      omsAgent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalytics.id
        }
      }
    }
    autoUpgradeProfile: {
      upgradeChannel: 'stable'
    }
  }
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2020-08-01' = {
  name: 'secureapp-logs-${uniqueString(resourceGroup().id)}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}
```

### Azure policy for compliance

Apply built-in policies:

```bash
# Enable Azure Policy add-on for AKS
az aks enable-addons --addons azure-policy --name SecureAppCluster --resource-group SecureAppRG

# Assign built-in policies
az policy assignment create \
  --name 'aks-https-ingress' \
  --display-name 'Enforce HTTPS ingress' \
  --scope $(az aks show --name SecureAppCluster --resource-group SecureAppRG --query id -o tsv) \
  --policy '/providers/Microsoft.Authorization/policyDefinitions/1a5b4dca-0b6f-4cf5-907c-56316bc1bf3d'

az policy assignment create \
  --name 'aks-pod-security-policies' \
  --display-name 'Enforce pod security policies' \
  --scope $(az aks show --name SecureAppCluster --resource-group SecureAppRG --query id -o tsv) \
  --policy '/providers/Microsoft.Authorization/policyDefinitions/a6c2f930-1d1e-4c1e-9e5f-5c64f413a411'
```

### Network security

Configure NSG rules for AKS:

```bash
az network nsg rule create \
  --resource-group SecureAppRG \
  --nsg-name SecureAppClusterNSG \
  --name AllowHttpsOnly \
  --access Allow \
  --protocol Tcp \
  --direction Inbound \
  --priority 100 \
  --source-address-prefix Internet \
  --source-port-range '*' \
  --destination-address-prefix '*' \
  --destination-port-range 443
```

## Monitoring and maintenance

### Azure monitor alerts

Set up critical alerts:

```bash
# CPU alert
az monitor metrics alert create \
  -n 'High CPU Alert' \
  --resource-group SecureAppRG \
  --scopes $(az aks show --name SecureAppCluster --resource-group SecureAppRG --query id -o tsv) \
  --condition "avg Percentage CPU > 80" \
  --description "High CPU utilization detected" \
  --severity 2

# Memory alert
az monitor metrics alert create \
  -n 'High Memory Alert' \
  --resource-group SecureAppRG \
  --scopes $(az aks show --name SecureAppCluster --resource-group SecureAppRG --query id -o tsv) \
  --condition "avg WorkingSet > 85" \
  --description "High memory utilization detected" \
  --severity 2
```

### Regular maintenance tasks

* Image Scanning: Set up weekly scans of ACR images
* Secret Rotation: Rotate ACR and AKS credentials quarterly
* Kubernetes Upgrades: Follow AKS stable channel for upgrades
* Vulnerability Scanning: Run monthly penetration tests

## Security checklist

* All resources deployed in European region
* Private AKS cluster with RBAC enabled
* ACR with content trust and retention policies
* Non-root container execution
* Read-only root filesystem in containers
* Network policies applied
* Resource quotas and limits defined
* Regular vulnerability scanning integrated
* HTTPS enforced for all ingress
* Audit logging enabled for all components
