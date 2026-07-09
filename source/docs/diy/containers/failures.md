# Container security gaps

Container security failures often compound: a gap in the image layer makes a runtime gap more exploitable; a runtime gap
makes a host protection gap catastrophic. The scenarios below describe what each gap enables, working from the most
consequential downward.

## Docker socket mounted as a volume

Any process inside the container has access to `/var/run/docker.sock`. From there it starts new containers with
`--privileged`, mounts the host filesystem at any path, reads environment variables of other running containers, and
obtains an interactive root shell on the host. The namespace isolation the container provides is irrelevant once the
socket is reachable. The container is not an attack surface; it is a stepping stone.

This pattern appears in CI runner configurations, monitoring agents, and Docker-in-Docker setups copied from tutorials.
Purpose-built alternatives exist for most use cases that do not require full socket access.

## --privileged flag

The container runs without the namespace and capability restrictions that normally apply. It can mount filesystems, load
kernel modules, access raw network interfaces, and modify host configuration. The distinction between "inside the
container" and "on the host" largely dissolves. `--privileged` is frequently used as a shortcut when a container fails
with a capabilities error rather than identifying which specific capability is actually needed.

Identifying the specific capability the application requires and granting only that, via `--cap-add`, closes this while
preserving the operational requirement.

## Container running as root with default capabilities

An application vulnerability gives the attacker code execution inside the container. As root with the default capability
set, they install tools with the package manager, write to the container filesystem, read files owned by root, and
attempt kernel-level escapes through retained capabilities such as `CAP_SYS_PTRACE` or `CAP_NET_ADMIN`. The container is
their staging environment. How far they get from there depends on what other controls are in place.

A non-root `USER` in the Dockerfile combined with `--cap-drop=ALL` at runtime and selective `--cap-add` for what the
application actually uses substantially reduces what a successful exploit can reach.

## Secrets in environment variables

A secret passed as `--env DB_PASSWORD=...` is visible in `docker inspect` output in plaintext to anyone with Docker
socket access on the host. It is visible in `/proc/<pid>/environ` to any process inside the container. It appears in
orchestrator API responses, debug logs, and crash reports that include environment dumps. Every place the container's
metadata travels, the secret travels with it.

Docker Secrets in Swarm mode, external secrets managers, or files mounted from a `tmpfs` volume keep credentials out of
the environment and out of the inspection surface.

## Image pulled without verification

A typosquatted image name (one transposed character in a common image name) installs whatever the publisher put in it. A
compromised legitimate image, the sort of supply chain incident that has occurred multiple times against popular
packages, runs with whatever was inserted between the last known-good version and the pull. Neither is detectable by
Docker before the image runs; both are indistinguishable from the intended image by name alone.

Pinning images to specific digest hashes, using a private registry with enforced scanning, and verifying image
signatures where supported closes the pull-time verification gap. A digest pin fails loudly if the image changes.

## Containers on the default bridge network

All containers on the default bridge network can reach each other by IP without any explicit routing configuration. A
compromised frontend container can attempt direct connections to the database container, the cache, and any internal API
service on the same bridge. The network topology provides no isolation between containers; everything on the bridge is
reachable from everything else on the bridge.

Custom named networks, with containers connected only to the networks they have a reason to share, enforce the intended
topology.

## No resource limits

A container running a cryptomining payload, a fork bomb, or a memory-leaking application consumes CPU and RAM without
bound. Other containers on the host are starved of resources; out-of-memory kills terminate unrelated services; the host
becomes unresponsive. The container's failure mode is not contained to itself; it becomes the host's failure mode.

`--memory` and `--cpus` limits, sized to the application's actual requirements with room for legitimate spikes, bound
what any single container can consume.

## Long-running containers on unrefreshed images

A container deployed six months ago passed a CVE scan at build time. New vulnerabilities have been discovered against
the base OS packages and application dependencies since then. The running container is not the image that was scanned;
it is the image that was scanned plus every vulnerability disclosed since the last rebuild. The scan result on record is
accurate for the past, not the present.

Rebuilding images on a regular cycle, re-scanning after rebuild, and redeploying updated containers keeps the image
security layer from drifting invisibly relative to the current vulnerability landscape.

## Related

- [Containers and Kubernetes evasion](../../counter/evasion/containers.md)
- [Supply chain hardening](../../counter/app/supply-chain.md)
Last updated: 27 May 2026
