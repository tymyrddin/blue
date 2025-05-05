# Secure on-premises CI/CD pipeline (Hetzner, Finland)

This guide provides a security-hardened CI/CD pipeline for Dockerized applications deployed on Hetzner Cloud 
(Finland, hel1) or on-premises servers. It covers:

* Self-hosted Git (Gitea) + CI (Drone/Argo Workflows)
* Private Docker Registry (Harbor)
* Kubernetes (k3s) with Zero Trust
* Secrets Management (Vault)
* Network Security (WireGuard, Cloudflare Tunnels)
* Monitoring (Prometheus, Grafana, Loki)

## Architecture Overview

Developer → Gitea (Git) → Drone CI (Build) →  
Harbor (Docker Registry) → k3s (Kubernetes) →  
Traefik (Ingress) + Cloudflare Tunnel (Zero Trust) →  
Prometheus + Grafana (Monitoring)

Key Features:

* EU Data Residency: Hosted in Hetzner Helsinki (hel1).
* Self-Hosted Everything: No reliance on SaaS (GitHub Actions, Docker Hub).
* Immutable Infrastructure: Kubernetes + GitOps (Argo CD).
* Zero Trust: Cloudflare Tunnels (no public ingress).
* Secrets Management: HashiCorp Vault.
* Security Scanning: Trivy, Falco, Clair.

## Prerequisites

* Hetzner Account (or on-premises servers).
* 3 VMs (Minimum): a git-server (Gitea + Drone) – 2 vCPU, 4GB RAM, a registry-server (Harbor) – 2 vCPU, 8GB RAM, a k3s-server (Kubernetes) – 4 vCPU, 8GB RAM
* Domain Name (e.g., yourdomain.fi) for TLS.
* Cloudflare Account (for Tunnels).

## Setting up infrastructure

### Provision servers (Hetzner CLI)

```bash
# Create servers in Helsinki (hel1)
hcloud server create \
  --name git-server \
  --type cx21 \
  --image ubuntu-22.04 \
  --location hel1 \
  --ssh-key ~/.ssh/id_ed25519.pub

hcloud server create \
  --name registry-server \
  --type cx21 \
  --image ubuntu-22.04 \
  --location hel1 \
  --ssh-key ~/.ssh/id_ed25519.pub

hcloud server create \
  --name k3s-server \
  --type cpx31 \
  --image ubuntu-22.04 \
  --location hel1 \
  --ssh-key ~/.ssh/id_ed25519.pub
```

### Install k3s (Kubernetes)

```bash
# On k3s-server
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik --disable servicelb" sh -s -
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config
```

### Install Harbor (Private Docker Registry)

```bash
# On registry-server
curl -s https://raw.githubusercontent.com/goharbor/harbor/master/contrib/install.sh | sudo bash
```

Edit `/etc/harbor/harbor.yml`:

```yaml
hostname: registry.yourdomain.fi
https:
  certificate: /etc/letsencrypt/live/registry.yourdomain.fi/fullchain.pem
  private_key: /etc/letsencrypt/live/registry.yourdomain.fi/privkey.pem
clair:
  updaters_interval: 12h # Vulnerability DB updates
trivy:
  ignore_unfixed: true # Only report fixed vulnerabilities
```

### Install Gitea (Self-hosted Git)

```bash
# On git-server
docker run -d \
  --name=gitea \
  -p 3000:3000 \
  -p 2222:22 \
  -v /var/lib/gitea:/data \
  -e GITEA__security__INSTALL_LOCK=true \
  gitea/gitea:latest
```

### Install Drone CI

```bash
# On git-server
docker run -d \
  --name=drone \
  -v /var/lib/drone:/data \
  -e DRONE_GITEA_SERVER=https://git.yourdomain.fi \
  -e DRONE_GITEA_CLIENT_ID=YOUR_GITEA_OAUTH_ID \
  -e DRONE_GITEA_CLIENT_SECRET=YOUR_GITEA_OAUTH_SECRET \
  -e DRONE_RPC_SECRET=$(openssl rand -hex 16) \
  -e DRONE_SERVER_HOST=ci.yourdomain.fi \
  -e DRONE_SERVER_PROTO=https \
  -p 80:80 \
  drone/drone:2
```

## CI/CD pipeline (Drone + Argo CD)

###  Secure CI pipeline

`.drone.yml`:

```yaml
kind: pipeline
type: docker
name: secure-app-ci

steps:
  # Step 1: Build Docker Image
  - name: build
    image: docker:20.10
    commands:
      - docker build -t registry.yourdomain.fi/app:$DRONE_COMMIT_SHA .
      - docker login registry.yourdomain.fi -u $REGISTRY_USER -p $REGISTRY_PASSWORD
      - docker push registry.yourdomain.fi/app:$DRONE_COMMIT_SHA
    environment:
      REGISTRY_USER:
        from_secret: registry_user
      REGISTRY_PASSWORD:
        from_secret: registry_password

  # Step 2: Scan for Vulnerabilities (Trivy)
  - name: scan
    image: aquasec/trivy:latest
    commands:
      - trivy image --exit-code 1 --severity CRITICAL registry.yourdomain.fi/app:$DRONE_COMMIT_SHA

  # Step 3: Deploy to k3s (via Argo CD Sync)
  - name: deploy
    image: alpine/k8s:1.25
    commands:
      - apk add --no-cache curl
      - curl -sLO https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
      - chmod +x argocd-linux-amd64
      - ./argocd-linux-amd64 app set secure-app --helm-set image.tag=$DRONE_COMMIT_SHA
      - ./argocd-linux-amd64 app sync secure-app
    environment:
      ARGOCD_SERVER: argocd.yourdomain.fi
      ARGOCD_AUTH_TOKEN:
        from_secret: argocd_token
```

### Argo CD Application (GitOps)

```yaml
# apps/secure-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: secure-app
spec:
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  source:
    repoURL: https://git.yourdomain.fi/your-repo.git
    path: k8s
    targetRevision: HEAD
    helm:
      values: |
        image:
          repository: registry.yourdomain.fi/app
          tag: latest
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Kubernetes deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: secure-app
  template:
    metadata:
      labels:
        app: secure-app
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
        - name: app
          image: registry.yourdomain.fi/app:latest
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
            readOnlyRootFilesystem: true
          ports:
            - containerPort: 8080
          envFrom:
            - secretRef:
                name: app-secrets
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
```

## Security hardening

### Network security

WireGuard VPN (for internal communication):

```bash
# On each server
curl -sSL https://raw.githubusercontent.com/angristan/wireguard-install/master/wireguard-install.sh | sudo bash
```

Cloudflare Tunnel (Zero Trust):

```bash

    docker run -d \
      --name cloudflared \
      --restart unless-stopped \
      cloudflare/cloudflared:latest \
      tunnel --no-autoupdate run --token YOUR_TUNNEL_TOKEN
```

### Secrets management (Vault)

```bash
# Install Vault
docker run -d \
  --name=vault \
  -p 8200:8200 \
  -v /var/lib/vault:/data \
  -e VAULT_ADDR=http://127.0.0.1:8200 \
  vault:latest

# Store secrets
vault kv put secret/app db_password="s3cr3t!"
```

### Runtime security (Falco)

```bash
# On k3s-server
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
  --set falco.jsonOutput=true \
  --set falco.httpOutput.enabled=true \
  --set falco.httpOutput.url=http://loki.yourdomain.fi
```

## Monitoring & logging

### Prometheus + Grafana

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --set grafana.adminPassword="$(openssl rand -hex 16)"
```

### Loki (Log aggregation)

```bash
helm install loki grafana/loki-stack \
  --set promtail.enabled=true
```

## Code Examples

### Dockerfile (Security-hardened)

```dockerfile
FROM gcr.io/distroless/nodejs:18

USER 1000
WORKDIR /app
COPY --chown=1000:1000 . .

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8080/health || exit 1

CMD ["server.js"]
```

### WireGuard config (/etc/wireguard/wg0.conf)

```
[Interface]
Address = 10.8.0.1/24
PrivateKey = YOUR_PRIVATE_KEY
ListenPort = 51820

[Peer]
PublicKey = PEER_PUBLIC_KEY
AllowedIPs = 10.8.0.2/32
```

## Security checklist

* All servers in hel1 (Hetzner Finland)
* Private Docker Registry (Harbor) + Trivy Scanning
* k3s with AppArmor + Seccomp
* WireGuard VPN + Cloudflare Tunnel (Zero Trust)
* Vault for Secrets + Argo CD for GitOps
* Falco Runtime Security + Prometheus Monitoring