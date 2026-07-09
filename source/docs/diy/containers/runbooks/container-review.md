# Container security review

Assurance runbook. Reviews running containers for the misconfigurations that extend the attack surface onto the host, and acts on what it finds. Container risk is mostly visible in configuration, so this is a look-and-act review rather than an incident response.

## Cadence

Quarterly. After deploying a new container or changing the Docker setup. After a [public exposure review](../../incidents/runbooks/exposure-review.md) flags a Docker-published port.

## What the review covers

Four questions: what privilege the containers run with, what they can reach on the host, where their images came from, and what host-level confinement is applied. Each section below is a check and the finding to act on.

## Daemon exposure

```
docker info
ps aux | grep dockerd
```

The most serious finding: the Docker daemon exposed over TCP without TLS. A `-H tcp://0.0.0.0:2375` in the daemon flags means any host that can reach that port controls the daemon, and through it the host, with no authentication. Treat it as host compromise waiting to happen: close the TCP socket or put mutual TLS in front of it before anything else in this review.

`--userns-remap` in the flags is the good sign: user namespace remapping is on, so a container escape arrives on the host as an unprivileged user. Note its absence as a missing isolation layer rather than an immediate finding.

## Container privileges

```
docker ps -a
docker inspect <container>
docker top <container>
```

`"User": ""` means the container runs as root. Root alone is not the finding; `--privileged` is. A privileged container has nearly all host capabilities and no default seccomp or AppArmor profile, which makes it effectively a root shell on the host. For each privileged container, establish why, and remove the flag unless there is a documented reason.

A container running a full init system or several unrelated services (visible in `docker top`) was not built to minimal scope. Note it for rebuilding smaller.

## Host access through mounts

```
docker inspect <container> | grep Mounts -A 20
```

`/var/run/docker.sock` mounted into a container gives it control of the daemon, equivalent to root on the host. Management and CI tools mount it deliberately, so the action is to confirm each container that has it needs it, and remove it from those that do not.

Mounts of `/etc`, `/root`, `/home`, or backup directories give read and often write access to host configuration and credentials. These are usually quick fixes left in place. Remove the ones no longer needed; scope the rest to a specific subdirectory.

## Image provenance

```
docker images
docker history <image>
trivy image <image>
```

`trivy image` (or `docker scout cves`) scans the installed packages against known CVEs. A stale base image is the most common container vulnerability; rebuild and re-scan images that show significant findings. Long-running containers drift further from current package versions the longer they run, so age is itself a flag.

`docker history` reveals secrets baked into a layer through an `ENV` or `RUN` instruction, readable by anyone who can pull the image even if a later layer removes the file. A secret found here is rotated (see [secret rotation](../../access/runbooks/secret-rotation.md)) and the image rebuilt without it.

## Network exposure

```
docker network ls
docker inspect <container> | grep -i networkmode
iptables -t nat -L -n
```

`--network=host` drops network isolation: the container shares the host's network stack and can bind any port. Justified occasionally for performance, more often left from a quick test. Move such containers onto a named network unless there is a reason not to.

Docker writes its own iptables rules ahead of the host firewall's INPUT chain, so a published container port can be reachable even when the firewall appears to block it. Read the Docker NAT rules alongside the declared port mappings to see what is actually reachable; the [firewall overview](../../server/firewall.md) covers the interaction.

## Resource limits and restarts

```
docker inspect --format='{{.HostConfig.Memory}}' <container>
docker inspect --format='{{.RestartCount}}' <container>
```

A `0` for memory or CPU means no limit, so the container can exhaust host resources and take others down with it. Set `--memory` and `--cpus` limits on anything unbounded.

A restart count above zero warrants a look at `docker logs <container>`: frequent restarts sometimes mean a process crashing against a seccomp filter or the out-of-memory killer, sometimes plain resource exhaustion.

## Host-level confinement

```
docker inspect <container>     # AppArmorProfile and SecurityOpt fields
```

The runtime provides isolation, not security. AppArmor, seccomp, and SELinux are the controls that still hold if a container is compromised. A container with no profile and no seccomp filter runs with default kernel access, which is less than `--privileged` but more than a scoped profile allows. Note containers running without any profile as candidates for one.

## All clear when

No daemon exposed over plaintext TCP. Every `--privileged` container and every `docker.sock` mount has a documented reason. No sensitive host paths mounted without need. Image scans show no significant unaddressed CVEs and no secrets in image history. Host-network containers are deliberate. Resource limits set. Findings either remediated or recorded with a rationale.

## Follow-up

- Record the review: date, containers checked, findings, what was fixed or accepted. This is the baseline for the next review.
- A compromised privileged container is a candidate for [the first hour](../../incidents/first-hour.md).
- The [container stack](../stack.md) and [failures](../failures.md) pages cover why each of these controls is in place.
