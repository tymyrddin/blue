# Container audit commands

Containers are convenient, but left unchecked, they’re a bit like unattended camping stoves in the server room—
isolated until they’re not. Here’s how to audit them properly before they burn down your infrastructure.

## Host configuration & isolation

```
docker info
docker version
```

Ensure the Docker daemon isn't exposed over TCP without TLS (-H tcp://0.0.0.0:2375 is an open door to doom).

```
ps aux | grep dockerd
```

Check daemon flags: are you using --userns-remap for user namespace isolation? You should be.

## Running containers & permissions

```
docker ps -a
docker inspect <container>
```

Look for containers running as root ("User": "" means root—bad sign), or with --privileged access (even worse).

```
docker top <container>
```

See what processes are running inside each container. If it looks like a full OS, someone’s missed the point.

## Image source & trust

```
docker images
docker history <image>
```

Audit image provenance. Avoid pulling random images from Docker Hub like it’s the App Store of broken dreams.

Use docker scan (powered by Snyk) or:

```
trivy image <image>
```

Scan for known vulnerabilities in container images.

## Network exposure & firewalls

```
docker network ls
docker network inspect <network>
```

Review container network configs. Containers should not be on the host network unless there’s a very good reason.

```
iptables -L -n
```

Check for firewall rules separating container traffic from the wider host network.

## Volume mounts & host access

```
docker inspect <container> | grep Mounts -A 10
```

Avoid mounting sensitive directories (e.g., /etc, /var/run/docker.sock, or your backups folder) into containers.

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

Frequent restarts are a red flag—not just for uptime, but possibly for resilience against intrusion detection.

## Resource limits & abuse prevention

```
docker inspect --format='{{.HostConfig.Memory}}' <container>
```

Ensure containers have memory and CPU limits set. Otherwise, one rogue process could bring down the host.

Use:

```
--memory=512m --cpus=1
```

...in your Docker run commands or Compose files.

## Lifecycle & orphaned resources

```
docker ps -a
docker images -a
docker volume ls
docker network ls
```

Remove unused containers, images, volumes, and networks. Less clutter = less attack surface.

```
docker system prune -a
```

Careful: this removes everything not actively in use. Run it only after a proper review (and backup).

## TL;DR

* Don’t trust the container runtime to do your security for you. It's a convenience tool, not a security boundary.
* Audit host-level protections (AppArmor, SELinux, seccomp, cgroups).
* Update your container images regularly. If you’re still running Ubuntu 18.04 in containers, the clock’s ticking.