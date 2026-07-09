# Harbor deployment

Runbook for deploying Harbor as the private container registry. Harbor is the single entry point for all container images used at Golem Trust. An image that is not in Harbor does not run in production. This applies to base images, application images, third-party images, and images whose names suggest they are not malware.

## Instance and storage

Harbor runs on a dedicated Hetzner CX41 instance at `registry.golemtrust.am` (`10.0.6.1`). A Hetzner volume of 500GB is attached at `/data` for image storage. The volume can be resized without reprovisioning the instance.

```
mkfs.ext4 /dev/sdb
echo "/dev/sdb /data ext4 defaults 0 2" >> /etc/fstab
mount -a
```

## Prerequisites

- A Hetzner CX41 instance running Debian 12
- A Hetzner volume of 500GB attached at `/dev/sdb`
- DNS A record for `registry.golemtrust.am`
- TLS certificate (Certbot with Cloudflare DNS)
- Docker and Docker Compose installed
- PostgreSQL database `harbor` and user `harbor` on `db.golemtrust.am`
- Redis available (Harbor uses it for caching; a small Redis container colocated on the Harbor instance is acceptable)

## Installation

Harbor does not have a Debian package. Install via the official installer:

```
HARBOR_VERSION="2.11.0"
wget "https://github.com/goharbor/harbor/releases/download/v${HARBOR_VERSION}/harbor-online-installer-v${HARBOR_VERSION}.tgz"
tar xzf "harbor-online-installer-v${HARBOR_VERSION}.tgz"
cd harbor
```

Edit `harbor.yml` before running the installer. Key settings:

```
hostname: registry.golemtrust.am

https:
  port: 443
  certificate: /etc/letsencrypt/live/registry.golemtrust.am/fullchain.pem
  private_key: /etc/letsencrypt/live/registry.golemtrust.am/privkey.pem

harbor_admin_password: <generate and store in Vaultwarden>

database:
  type: external
  external:
    host: db.golemtrust.am
    port: 5432
    db_name: harbor
    username: harbor
    password: <retrieve from Vaultwarden, collection: Infrastructure>
    ssl_mode: require

data_volume: /data

storage_service:
  ca_bundle:
  filesystem:
    rootdirectory: /data/registry

trivy:
  ignore_unfixed: false
  skip_update: false
  security_check: vuln,config,secret

jobservice:
  max_job_workers: 10

notification:
  webhook_job_max_retry: 3

log:
  level: warning
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor
```

Run the installer:

```
./install.sh --with-trivy
```

The `--with-trivy` flag enables the built-in Trivy vulnerability scanner. Harbor downloads the Trivy binary and vulnerability database during installation.

## Project structure

Harbor organises images into projects. Create the following projects after installation:

`golemtrust-prod`: production images. Immutable tags enabled. Vulnerability scanning required before push. Content trust (Cosign signature verification) required.

`golemtrust-staging`: staging images. Vulnerability scanning required. Content trust optional.

`base-images`: curated base images (Debian, Python, Node, etc.) pulled from upstream and rescanned weekly. Teams pull base images from here.

`third-party`: vetted third-party images (Redis, PostgreSQL, etc.) that have been reviewed and signed. Ludmilla approves additions.

Create projects via the Harbor web interface at `https://registry.golemtrust.am` or via the CLI:

```
curl -s -u "admin:<password>" \
  -X POST "https://registry.golemtrust.am/api/v2.0/projects" \
  -H "Content-Type: application/json" \
  -d '{"project_name":"golemtrust-prod","public":false,"metadata":{"enable_content_trust":"true","prevent_vul":"true","severity":"high","auto_scan":"true","reuse_sys_cve_allowlist":"false"}}'
```

## Immutable tags

Enable immutable tags on the `golemtrust-prod` project to prevent production images from being overwritten. In the Harbor web interface, navigate to the project, then Tag Immutability, then Add Rule:

- Repositories: `**` (all repositories)
- Tags: `**` (all tags)
- Action: Immutable

With this rule, any attempt to push an image with a tag that already exists in `golemtrust-prod` is rejected. Production images are never overwritten; a new tag must be used for each version.

## Registry mirror

Configure Harbor to mirror Docker Hub and the major public registries. This means that when a developer pulls `docker.io/library/debian:bookworm`, the request goes to Harbor first, which pulls and caches the image from Docker Hub if not already present. Subsequent pulls are served from Harbor, reducing dependency on external registries.

Navigate to Administration, then Registries, then New Endpoint. Create endpoints for:

- Docker Hub: `https://hub.docker.com`
- GitHub Container Registry: `https://ghcr.io`
- Quay.io: `https://quay.io`

Create proxy cache projects for each:

- `dockerhub-cache`: proxies Docker Hub
- `ghcr-cache`: proxies GitHub Container Registry
- `quay-cache`: proxies Quay.io

Configure pull-through on each proxy project. Images are cached in Harbor on first pull. The cache is scanned by Trivy automatically.

## Authentication

Harbor authenticates via Keycloak OIDC. Navigate to Administration, then Configuration, then Authentication.

Set Auth Mode to OIDC. Configure:

- Provider Name: `Golem Trust Keycloak`
- Endpoint: `https://auth.golemtrust.am/realms/golemtrust-internal`
- Client ID: `harbor` (create this client in Keycloak)
- Client Secret: retrieve from Vaultwarden
- Scope: `openid profile email`
- Username Claim: `preferred_username`
- Groups Claim: `groups`

In Keycloak, create a `harbor` client and map Keycloak groups to Harbor roles:

- `devs` group maps to Developer role in each project
- `security` group maps to Maintainer role in `base-images` and `third-party`
- `sysadmin` group maps to Project Admin in all projects

## Verification

Push a test image:

```
docker login registry.golemtrust.am
docker pull debian:bookworm
docker tag debian:bookworm registry.golemtrust.am/golemtrust-staging/debian:bookworm
docker push registry.golemtrust.am/golemtrust-staging/debian:bookworm
```

In the Harbor web interface, confirm the image appears and that a vulnerability scan has been triggered automatically. Wait for the scan to complete and verify the results are visible.
