# The container security stack

Container security controls fall into five layers: image security, which addresses what is in the container before it
runs; runtime confinement, which limits what the container can do once running; host protection, which prevents a
compromised container from reaching the host; network isolation, which controls what the container can reach; and
secrets management, which keeps credentials out of images and metadata. A sixth layer, detection and lifecycle, runs across all of them.

Before the layers: a distinction worth making at the outset. The container runtime provides isolation through Linux
namespaces and cgroups. Isolation prevents containers from accidentally interfering with each other. It is not the same
as security confinement. A container with default settings is isolated from its neighbours but largely unrestricted in
what it can do: it can make most system calls, run as root, and, if poorly configured, reach the host. Confinement
requires additional controls that isolation does not provide.

## Image security

A container image is the starting point for everything that runs inside the container. Vulnerabilities in the base OS
layer, in installed packages, or in application dependencies travel with the image and persist until the image is
rebuilt or replaced.

Scanning images for known CVEs before deployment catches the most common class of container vulnerability. Tools like
`trivy` or Docker Scout check image layers against vulnerability databases; running them as part of the build process
rather than after deployment shifts the discovery earlier.

Minimal base images reduce the available attack surface. An image built on Alpine or a distroless base contains far
fewer packages, and therefore fewer exploitable binaries, than one built on a full Debian or Ubuntu image. Tooling that
is useful during development (shells, curl, package managers) has no business being in a production image.

Image security and runtime security are orthogonal. A minimal, well-scanned image can still be run as root with
`--privileged`, in which case its cleanliness provides little protection. A bloated image with unpatched CVEs can be
partially contained by tight runtime controls. Both matter; neither substitutes for the other.

## Runtime confinement

By default, a container process runs as root inside the container. If the container process can escape (through a kernel
vulnerability, a misconfigured volume mount, or the Docker socket), it arrives on the host as root. Running the
container as a non-root user via `USER` in the Dockerfile or `--user` at runtime reduces the blast radius of an escape,
though it does not close the escape path itself.

Linux capabilities divide root's privileges into discrete units. A container by default retains a broad set of
capabilities it likely does not need. Dropping all capabilities with `--cap-drop=ALL` and adding back only those the
process actually requires is more precise than relying on process user alone. A non-root process with no unnecessary
capabilities has significantly less reach than a root process that has quietly retained `CAP_SYS_ADMIN`.

Seccomp profiles restrict which system calls the container process can make, independently of capabilities and user.
Docker applies a default seccomp profile that blocks around 44 system calls; applying a tighter custom profile for the
specific application closes the syscall surface further. A container that only needs to make network connections and
read files does not need access to `ptrace`, `mount`, or `kexec_load`.

AppArmor and SELinux profiles apply MAC at the container level. Like MAC on the host, they constrain what the process
can access regardless of what user it runs as or what capabilities it holds. Docker applies a default AppArmor profile (
`docker-default`) that covers basic restrictions; a profile tailored to the specific service is more effective but
requires more work to build.

The confinement controls layer on each other. A non-root user is the first barrier. Dropped capabilities are the second.
A tight seccomp profile restricts the syscall surface beneath capabilities. MAC constrains filesystem and network access
beneath all of them. Each operates independently; removing one does not disable the others, but each fills a gap the
others leave.

## Host protection

The most consequential misconfiguration in a container deployment is mounting `/var/run/docker.sock` into a container.
Any process inside that container can use the Docker socket to start new containers, mount the host filesystem, run
privileged containers, and achieve full host access. It is functionally equivalent to handing the container process an
unrestricted root shell on the host, often silently.

User namespace remapping (`--userns-remap`) maps the container's root user to an unprivileged user on the host. A
process that escapes the container as root inside arrives on the host as that unprivileged user, substantially limiting
what it can do. It is not a complete escape prevention, but it narrows the consequences significantly.

Mounting sensitive host paths into containers, `/etc`, `/proc`, or home directories, extends the host's attack surface
into the container. A container that can read `/etc/shadow` or write `/etc/cron.d` can affect the host regardless of
what other confinement is in place.

Resource limits (CPU and memory via `--memory` and `--cpus`) prevent a single container from consuming host resources
without bound. A container without limits can exhaust memory and bring down other services or trigger out-of-memory
kills, either as a side effect of a poorly written application or as a deliberate denial-of-service from a compromised
container.

## Network isolation

Docker places containers on a default bridge network where they can communicate with each other freely. Placing
containers on custom named networks restricts communication to those explicitly sharing a network, which is a more
intentional topology than the default.

`--network=host` bypasses network namespace isolation entirely. The container process sees the host's network
interfaces, can bind to any port, and can communicate with anything the host can reach. It is occasionally justified for
performance-sensitive applications; outside those cases it removes a meaningful isolation boundary.

Docker modifies iptables rules to handle container port publishing and network address translation. These rules are
applied automatically and may not match the intent of manually configured firewall rules. Reviewing the actual iptables
state after container startup, rather than assuming the configured firewall covers container traffic, reflects what is
actually in effect.

## Secrets management

Secrets baked into a Docker image are readable by anyone with access to the image, including in historical layers. A
secret added in one layer and deleted in a later layer is still present in the image history. `docker history` or layer
inspection tools can surface it.

Environment variables passed at runtime are visible in `docker inspect` output and in `/proc/<pid>/environ` inside the
container. They are not encrypted at rest in the container metadata. A secret passed as `--env DB_PASSWORD=...` is
available to any process inside the container and to anyone who can inspect the container on the host.

Docker Secrets (in Swarm mode) mount secrets as files into the container rather than environment variables, reducing
exposure in metadata. External secrets managers (HashiCorp Vault, cloud provider secret stores) provide rotation,
auditing, and fine-grained access control that Docker-native mechanisms do not.

## Detection and lifecycle

Frequent container restarts indicate instability or a process crashing against a security control. A crashing container
that restarts repeatedly may be hitting a seccomp or AppArmor denial, encountering a misconfiguration, or running an
application that has been disrupted. Monitoring restart counts surfaces these signals.

Centralised log collection from container stdout and stderr, using Loki, Fluentd, Filebeat, or similar, provides logs
that persist beyond the container lifecycle and that a compromised container process cannot trivially delete.

Images accumulate unpatched CVEs over time as the base OS and dependencies age. Long-running containers built on
outdated images carry that debt silently. Rebuilding images on a regular cycle and re-scanning after rebuild keeps the
image security layer from drifting relative to what was scanned at deployment.

## Not addressed

A compromised application inside a well-confined container can still do damage within the scope it is permitted: it can
read data it has access to, make network connections it is allowed to make, and exfiltrate through permitted egress
paths. Container security limits the blast radius; it does not protect the application from its own vulnerabilities.

All containers on a host share the host kernel. A kernel vulnerability that allows container escape bypasses namespace
isolation, capability restrictions, and user namespace remapping simultaneously. Keeping the host kernel patched is the
only control relevant to that surface.

Orchestrator security, covering Kubernetes RBAC, API server exposure, etcd encryption, and admission control, operates
at a different layer and is outside the scope of a single-host container setup.

The Docker daemon itself, if exposed over TCP without mutual TLS, provides unauthenticated access to everything the
daemon can do: run containers, mount host filesystems, inspect secrets in environment variables, and obtain a root
shell. Daemon exposure over an unprotected TCP socket is host compromise by another name.
