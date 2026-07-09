# Runner configuration

Runbook for deploying and configuring GitLab CI/CD runners. Runners are the machines that execute pipeline jobs. They must be isolated from production infrastructure, capable of building container images, and configured to handle secrets safely. Shared runners provided by GitLab.com are not used; all pipeline jobs run on Golem Trust-managed runners so that build artefacts, source code, and secrets never leave infrastructure under Golem Trust's control.

## Runner architecture

Two categories of runner are deployed:

Shared runners: three instances (Hetzner CX22, 4 vCPU, 8GB RAM each) registered at the GitLab group level. These run most pipeline jobs: linting, testing, SAST, dependency scanning, secret detection.

Privileged runners: two instances (Hetzner CX32, 8 vCPU, 16GB RAM each) used for Docker-in-Docker container builds. These require elevated privileges and are isolated on a dedicated Hetzner private network segment that cannot reach production services directly.

All runners run Debian 12. Runners are registered to the `golemtrust` group in GitLab.

## Installing the GitLab Runner

Install the runner binary on each runner instance:

```
curl -sS https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | bash
apt install -y gitlab-runner docker.io
usermod -aG docker gitlab-runner
```

Verify the installation:

```
gitlab-runner --version
```

## Registering shared runners

Retrieve the group runner registration token from GitLab. Navigate to the `golemtrust` group, then Settings, then CI/CD, then Runners. Copy the registration token and store it temporarily (it is single-use; after registration the token is no longer needed).

Register the runner:

```
gitlab-runner register \
  --url https://gitlab.golemtrust.am \
  --token <registration-token> \
  --executor docker \
  --docker-image debian:bookworm-slim \
  --description "shared-runner-01" \
  --tag-list shared \
  --run-untagged true \
  --locked false
```

The `docker` executor runs each job in a fresh container, providing isolation between jobs and between tenants. The default image `debian:bookworm-slim` is pulled from Harbor (the Golem Trust Harbor mirror of Docker Hub).

Edit `/etc/gitlab-runner/config.toml` after registration to set resource limits and pull policy:

```
concurrent = 4

[[runners]]
  name = "shared-runner-01"
  url = "https://gitlab.golemtrust.am"
  executor = "docker"
  [runners.docker]
    image = "registry.golemtrust.am/dockerhub-cache/library/debian:bookworm-slim"
    pull_policy = ["always"]
    allowed_images = ["registry.golemtrust.am/*"]
    allowed_services = []
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/cache"]
    shm_size = 0
    memory = "4g"
    memory_swap = "4g"
    cpus = "2"
```

The `allowed_images` restriction limits runners to pulling images from Harbor only. Jobs cannot pull arbitrary images from public registries.

Enable and start the runner:

```
systemctl enable --now gitlab-runner
```

## Registering privileged runners

Privileged runners are needed for Docker-in-Docker builds (building container images within a pipeline). They are marked with the `docker-build` tag so only pipelines that explicitly request them receive them.

Register with the `--docker-privileged` flag:

```
gitlab-runner register \
  --url https://gitlab.golemtrust.am \
  --token <registration-token> \
  --executor docker \
  --docker-image docker:27-dind \
  --docker-privileged \
  --description "privileged-runner-01" \
  --tag-list docker-build \
  --run-untagged false \
  --locked false
```

In `/etc/gitlab-runner/config.toml` for privileged runners, add the Docker-in-Docker service and network isolation:

```
[[runners]]
  name = "privileged-runner-01"
  tags = ["docker-build"]
  [runners.docker]
    privileged = true
    image = "docker:27-dind"
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
    allowed_images = ["registry.golemtrust.am/*", "docker:*"]
    network_mode = "build-net"
```

The `network_mode = "build-net"` restricts build containers to an isolated Docker bridge network with no route to the Headscale private network or production services.

## Secrets in pipelines

Pipelines access secrets via GitLab CI/CD variables and via Vault. Do not store secrets as plaintext in `.gitlab-ci.yml` files or as unmasked GitLab variables.

For Vault-backed secrets, pipelines authenticate using JWT tokens issued by GitLab. Configure the GitLab JWT issuer in Vault:

```
vault write auth/jwt/config \
  jwks_url="https://gitlab.golemtrust.am/-/jwks" \
  bound_issuer="https://gitlab.golemtrust.am"
```

Create a Vault role that allows pipelines from the `golemtrust` group to read specific secrets:

```
vault write auth/jwt/role/gitlab-ci \
  role_type="jwt" \
  bound_claims='{"group_path": "golemtrust"}' \
  bound_claims_type="glob" \
  user_claim="sub" \
  policies="gitlab-ci-read" \
  ttl="1h"
```

In the pipeline job, authenticate to Vault and retrieve the secret:

```
before_script:
  - export VAULT_ADDR=https://vault.golemtrust.am
  - export VAULT_TOKEN=$(vault write -field=token auth/jwt/login role=gitlab-ci jwt=$CI_JOB_JWT_V2)
  - export DB_PASSWORD=$(vault kv get -field=password kv/golemtrust/database)
```

Masked GitLab CI/CD variables (set in the project or group settings) are used for values that do not need Vault-level auditing: Harbor credentials, non-sensitive configuration flags.

## Runner maintenance

Runners accumulate Docker image layers and build caches. Schedule a weekly cleanup:

```
0 3 * * 0 docker system prune -af --volumes >> /var/log/runner-cleanup.log 2>&1
```

Monitor runner health via GitLab. Navigate to the `golemtrust` group, then Settings, then CI/CD, then Runners. Runners that have not contacted GitLab within 10 minutes are shown as offline. Add a Prometheus alert for offline runners using the GitLab Prometheus exporter.

GitLab Runner version should be kept within one major version of the GitLab server version. Check `gitlab-runner --version` against the GitLab server version in Admin Area, then Settings, then General.
