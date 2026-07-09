# Docker

## Configuration

Patching both Docker Engine and the underlying host OS is necessary because the kernel is shared between the container
and the host. A successful kernel exploit can break out of a non-privileged container and reach root on the host.

The Docker daemon socket is a Unix socket owned by `root`. Anything that obtains access to the socket has permissions
equivalent to root on the host. Daemon sockets can be bound to a network interface for remote access, but the socket
should not be available for remote connections without Docker's encrypted HTTPS socket and authentication. Running
containers with `-v /var/run/docker.sock:/var/run/docker.sock` exposes the socket inside the container, which is a
common container escape vector.

Docker's rootless mode runs both the Docker daemon and containers within a user namespace, mitigating vulnerabilities in
daemon and container runtimes that would otherwise grant root access to the host:

```text
systemctl --user enable docker
sudo loginctl enable-linger $(whoami)
```

To run a container in rootless context:

```text
docker context use rootless
docker run -d -p 8080:80 nginx
```

Privileged containers run as root with access to all host devices and the ability to modify Linux security modules (
AppArmor, SELinux). Running containers in privileged mode in production exposes the host to the full set of capabilities
the container process holds. The check:

```bash
docker inspect --format='{{.HostConfig.Privileged}}' [container_id]
```

returns `true` if the container is privileged.

Resource limits (`--memory`, `--cpus`) constrain the impact of resource abuse. The default is unlimited access to host
RAM and CPU; a compromised container can starve other containers or degrade the host.

Custom bridge networks control inter-container communication and provide automatic DNS resolution from container name to
IP address. The default bridge network connects all containers on the host; custom networks limit which containers can
reach each other.
Docker's [bridge](https://docs.docker.com/network/network-tutorial-standalone/), [overlay](https://docs.docker.com/network/network-tutorial-overlay/),
and [macvlan](https://docs.docker.com/network/network-tutorial-macvlan/) drivers cover the main use cases.

The Linux kernel provides several isolation mechanisms relevant to containers:

- Linux Namespaces: the foundation of container isolation; each container sees its own view of global resources (PIDs,
  network, filesystems)
- SELinux (Red Hat distributions): mandatory access controls for processes, files, and network; a second containment
  layer if namespace isolation is bypassed
- AppArmor (Debian distributions): per-program security profiles loaded at boot; restricts what system resources a
  program can access
- cgroups: limit and account for resource usage per container; prevent one container's resources from being consumed by
  another
- seccomp: limits which system calls a container process can make to a defined allowlist

Running containers with a read-only filesystem (`--read-only`) prevents malware deployment and configuration
modification inside the container.

seccomp profiles limit system calls to those the container actually uses. Profiling a container under normal operation
to obtain its system call list, then building an explicit allowlist, reduces the kernel attack surface available to a
compromised container.

## Images

Any vulnerability in an image component exists in every container created from it. Images pulled from public registries
may contain vulnerabilities or may have been tampered with; scanning before use and before pushing to a
production-accessible registry catches this. Images with CVEs above a configured severity threshold can be made to fail
the build.

[Docker Scout](https://docs.docker.com/scout/) and [Snyk](https://snyk.io/learn/docker-security-scanning/) both
integrate with Docker to scan images locally and at build time.

Base images often include components not needed for the application's purpose. Selecting a minimal base image, or
building a purpose-specific one (Distroless, Alpine), reduces both the image size and the CVE surface.

Sensitive data (credentials, SSH keys, TLS certificates, connection strings) hardcoded in Dockerfiles is copied into
image layers. Intermediate layers that delete secrets still retain them in the layer history. Container orchestrators (
Kubernetes, Docker Swarm) provide secrets management that injects secrets at runtime without embedding them in the
image.

Multi-stage builds produce final images that contain only the runtime artefacts. A well-structured multi-stage build significantly reduces the attack surface and limits what an
attacker who modifies the build process can include in the final image.

Private registries behind a firewall with RBAC on push and pull access reduce the risk of pulling a tampered image.
Content Trust (cryptographic signing of images with a private key) verifies that an image and its tags have not been
modified since signing.

Pinning image tags to a specific version and digest prevents unexpected behaviour when the
underlying image changes. Using digests (`image@sha256:...`) provides a stronger guarantee, since tags
can be overwritten.

## Monitoring and observability

Observability of Docker hosts, container engines, Kubernetes master nodes, containerised middleware, and workloads
running in containers requires dedicated tooling at scale. Individual `docker stats` and `docker logs` commands are not
sufficient for multi-host environments.

Runtime security tools (Falco, Tracee) detect anomalous behaviour in running containers (unexpected process spawns,
network connections to unusual destinations, privilege changes) by instrumenting kernel system calls. The goal is
detecting active attacks; the practical limitation is that most attacks are only visible in hindsight if runtime
monitoring is not in place before the incident.

SSH access into containers for maintenance operations is a security risk: it requires maintaining SSH keys, managing
access, and means the container is effectively a persistent VM. Externalising logs
and metrics removes most of the need for direct container access.

Container labels provide metadata about images, deployments, and containers. Labels can record licensing information,
source references, author names, component membership, and data classification (for compliance). Automating label
application reduces the risk of errors when labelling is a manual step.

## Resources

- [Docker security](https://docs.docker.com/engine/security/)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Docker Bench for Security](https://github.com/docker/docker-bench-security): automated checks based on the CIS Docker
  Benchmark v1.5.0

## Related

- [AWS: Basis for a secure AWS deployment pipeline](../aws/pipeline.md)
- [Azure: Foundation for a secure Azure deployment pipeline](../azure/pipeline.md)
- [GCP: Foundation for a secure GCP deployment pipeline](../gcp/pipeline.md)
- [On-prem: Secure on-premises CI/CD pipeline (Hetzner, Finland)](../on-prem/pipeline.md)
