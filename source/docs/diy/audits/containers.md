# Container audit commands

Containers are convenient, but misconfigured ones extend the attack surface into the host. Here is how to audit them.

## Host configuration & isolation

```
docker info
docker version
```

Ensure the Docker daemon is not exposed over TCP without TLS (`-H tcp://0.0.0.0:2375` bypasses all authentication).

```
ps aux | grep dockerd
```

Check daemon flags. The `--userns-remap` flag enables user namespace isolation and is worth enabling.

## Running containers & permissions

```
docker ps -a
docker inspect <container>
```

Look for containers running as root (`"User": ""` indicates root) or with `--privileged` access. Both expand the blast radius of a compromise.

```
docker top <container>
```

See what processes are running inside each container. A container running a full init system suggests the image was not built with minimal scope in mind.

## Image source & trust

```
docker images
docker history <image>
```

Audit image provenance. Pulling unverified images from public registries without scanning them is a common entry point.

Use `docker scout cves <image>` (Docker Scout, available in current Docker CLI and Docker Desktop) or:

```
trivy image <image>
```

Scan for known vulnerabilities in container images.

## Network exposure & firewalls

```
docker network ls
docker network inspect <network>
```

Review container network configs. Containers on the host network bypass network isolation; keeping them off it unless there is a specific, documented reason is worth the discipline.

```
iptables -L -n
```

Check for firewall rules separating container traffic from the wider host network.

## Volume mounts & host access

```
docker inspect <container> | grep Mounts -A 10
```

Avoid mounting sensitive directories (e.g., `/etc`, `/var/run/docker.sock`, or backup directories) into containers.

## Logging & monitoring

```
docker logs <container>
```

Check for application errors, suspicious behaviour, or signs of compromise.

Centralise logs using a solution like:

* Loki with Promtail
* Fluentd
* Filebeat

And watch for container restarts:

```
docker inspect --format='{{.RestartCount}}' <container>
```

Frequent restarts are worth investigating: they can indicate instability or a process crashing against a security control.

## Resource limits & abuse prevention

```
docker inspect --format='{{.HostConfig.Memory}}' <container>
```

Containers without memory and CPU limits can consume host resources without bound. Set limits in Docker run commands or Compose files:

```
--memory=512m --cpus=1
```

## Lifecycle & orphaned resources

```
docker ps -a
docker images -a
docker volume ls
docker network ls
```

Remove unused containers, images, volumes, and networks. Unused resources are not inherently dangerous, but they expand the audit surface and can obscure what is actually in use.

```
docker system prune -a
```

This removes everything not actively in use. Run it only after a proper review (and backup).

## TL;DR

* The container runtime provides isolation, not security. Host-level controls (AppArmor, SELinux, seccomp, cgroups) are still needed.
* Audit image provenance. CVEs in base images are the most common container vulnerability.
* Update container images regularly. Long-running images on outdated base OS versions accumulate unpatched CVEs over time.
