# Docker

## Configuration best practices

1. Patch both Docker Engine and the underlying host operating system running Docker. The kernel is shared by the container and the host. A successful kernel exploit can enable attackers to break out of a non-privileged container and gain root access to the host.

2. The Docker daemon socket is a Unix network socket that facilitates communication with the Docker API. By default, this socket is owned by the `root` user. If anyone else obtains access to the socket, they will have permissions equivalent to `root` access to the host. Daemon sockets can be bound to a network interface for making the Docker container available remotely. Never make the daemon socket available for remote connections, unless you are using Docker's encrypted HTTPS socket, which supports authentication. Do not run Docker images with an option like `-v /var/run/docker.sock://var/run/docker.sock`, which exposes the socket in the resulting container.

3. Docker provides `rootless mode`, which allows for running Docker daemons and containers as non-root users, to mitigate vulnerabilities in daemons and container runtimes, which can grant root access of entire nodes and clusters to an attacker. Rootless mode runs Docker daemons and containers within a user namespace.

[Install Docker in root mode](https://docs.docker.com/engine/security/rootless/) and launch the Daemon when the host starts with:

```text
systemctl --user enable docker
sudo loginctl enable-linger $(whoami)
```

To run a container as rootless using Docker context:

```text
docker context use rootless
docker run -d -p 8080:80 nginx
```

4. Docker provides a privileged mode, which lets a container run as root on the local machine. Running a container in privileged mode provides the capabilities of that host. This includes Root access to all devices; The ability to tamper with Linux security modules like AppArmor and SELinux; And the ability to install a new instance of the Docker platform, using the host's kernel capabilities, and running Docker within Docker. Never use privileged containers in a production environment. Better yet, never use in any environment.

To check if the container is running in privileged mode (returns true if the container is privileged):

    docker inspect --format =''[container_id]

5. The default setting is to allow the container to access all RAM and CPU resources on the host. When a container is compromised, attackers may try to make use of the underlying host resources. Limit Docker memory and CPU usage to minimise the impact of breaches for resource-intensive containers. 

6. Docker containers require a network layer to communicate with the outside world through the network interfaces on the host. The default bridge network exists on all Docker hosts. New containers automatically connect to it.

Recommended is using custom bridge networks to control which containers can communicate between them, and to enable automatic DNS resolution from container name to IP address. Create as many networks as needed, decide which networks each container needs to connect to, and avoid connecting sensitive containers to public-facing networks. Docker provides network drivers for creating user-defined [bridge networks](https://docs.docker.com/network/network-tutorial-standalone/), [overlay networks](https://docs.docker.com/network/network-tutorial-overlay/), or [macvlan networks](https://docs.docker.com/network/network-tutorial-macvlan/).

7. Create an optimised environment to run containers. Operating systems on a container host are to protect the host kernel from container escapes and prevent mutual influence between containers. Protecting a container is exactly the same as protecting any process running on Linux. Use one or more of the following Linux security capabilities:

* Linux Namespaces make Linux processes appear to have access to their own, separate global resources. Namespaces provide an abstraction that gives the impression of running in a container on its own operating system. They are the basis of container isolation.
* For Red Hat Linux distributions, SELinux provides an additional layer of security to isolate containers from each other and from the host. It allows for applying mandatory access controls for users, applications, processes and files. A second line of defence that will stop attackers who manage to breach the namespace abstraction.
* For Debian Linux distributions, AppArmor is a Linux kernel enhancements that can limit programs in terms of the system resources they can access. It binds access control attributes to specific programs, and is controlled by security profiles loaded into the kernel at boot time. 
* Use cgroups to prevent container resources from being used by other containers on the same host, and at the same time, stop attackers from creating pseudo devices. 
* Linux allows for limiting privileges of any process, containers included. When running a container, you can deny privileges for capabilities, without affecting containerised applications.
* The secure computing mode (`seccomp`) in the Linux kernel allows for transitioning a process to a secure mode, in which it is only allowed to perform a small set of safe system calls. Setting a `seccomp` profile for a container provides one more level of defence against compromise.

8. A simple and effective security trick is to run containers with a read-only filesystem. This can prevent malicious activity such as deploying malware on the container or modifying configuration files.

9. Cloud native security requires security controls and mitigation techniques at every stage of the application lifecycle, from build to workload and infrastructure. 

* Implement vulnerability scanning to ensure clean code at all stages of the development lifecycle.
* Use a sandbox environment to QA code before it goes into production, to ensure there is nothing malicious that will deploy at runtime. 
* Implement drift prevention to ensure container immutability.
* Create an incident response process to ensure rapid response in the case of an attack.
* Apply automated patching.
* Ensure robust auditing and forensics for quick troubleshooting and compliance reporting.

10. Not all system calls are required to run a container. Monitor the container, obtain a list of all system calls made, and explicitly allow those calls and no others. Using runtime for this you can also take system calls used by the container’s components into account, and how those calls are named in the underlying operating system.

## Image best practices

1. Scan Docker container images before use, especially if they were pulled from public repositories. Any vulnerability in any component of an image will exist in all containers created from it. If you use a base image to create new images, any vulnerability in the base image will extend to the new images. When building an image from the CI pipeline, scan it before running it through the build. Images with vulnerabilities that exceed a severity threshold are to fail the build. Do not push unsafe images to a container registry accessible by production systems. 

* [Docker scout](https://docs.docker.com/scout/) can proactively find and fix vulnerabilities.
* Docker has integrated with [Snyk](https://snyk.io/learn/docker-security-scanning/) to help scan official images, which makes it easier to scan images locally and immediately after build.

2. Docker images are commonly built on top of "base images". A base image may contain components not really required for your purposes. Select base images to fit purpose, and if necessary, build your own minimal base image.

3. Docker images often require sensitive data for their normal operations, such as credentials, tokens, SSH keys, TLS certificates, database names or connection strings. And applications running in a container can generate or store sensitive data. Do not hardcode sensitive information into Dockerfiles. Such information will be copied to containers, and may be cached in intermediate container layers, even if deleted. Container orchestrators like Kubernetes and Docker Swarm provide a secrets management capability which can solve this problem. 

4. To build containerised applications in a consistent manner, use multi-stage builds. This has both operational and security advantages. A well-designed multi-stage build contains only the minimal binary files and dependencies required for the final image, with no build tools or intermediate files. This significantly reduces the attack surface. A multi-stage build also gives more control over the files and artifacts that go into a container image, making it more difficult for attackers or insiders to add malicious or untested artifacts.

5. Container registries are convenient, allowing for downloading container images automatically as part of development and testing workflows. There is no guarantee that the image being pulled from the registry can be trusted. It may unintentionally contain vulnerabilities, or may have intentionally been replaced with an image compromised by attackers. To reduce the risk of tampering, use a private registry deployed behind a firewall. To add another layer of protection, use Role Based Access Control (RBAC) to the registry to restrict which users can upload and download images from it.

6. Tags are commonly used to manage versions of Docker images. Use specific tags preferably with both version and operating system. Keep a local copy of images in a private repository, and confirm tags are the same as those in the local copy. Docker also offers a Content Trust mechanism that allows for cryptographically signing images using a private key. This guarantees the image, and its tags, have not been modified. 

## Monitoring best practices

1. It is critical to identify problems early and to be able to remediate them at the source. Put tools and practices in place that can help achieve observability ofDocker hosts, container engines, master nodes (if running an orchestrator like Kubernetes), containerised middleware and networking, and workloads running in containers. In large-scale environments, this can only be achieved with dedicated cloud-native monitoring tools.

2. At the center of the cloud native stack are workloads, always an interesting asset for hackers. The ability to stop an attack in progress is important, but only a few organisations are able to stop an attack or zero-day exploit as it happens, or before it happens. Runtime security for Docker containers involves securing your workload, so that once a container is running, drift is not possible, and any malicious action is blocked immediately. Ideally, this should be done with minimal overhead and rapid response time. In addition, use automated vulnerability patching and management to provide another layer of runtime security.

3. Logging into containers using SSH for every maintenance operation poses a security risk. Design a way to maintain containers without needing to directly access them, for example by making the logs available outside the container. 

4. Container labeling is a common practice, applied to objects like images, deployments, Docker containers, volumes, and networks. Use labels to add information to containers, such as licensing information, sources, names of authors, and relation of containers to projects or components. They can also be used to categorise containers and their contents for compliance purposes, for example labeling a container as containing protected data. Mind that when workflows rely on labels, errors in applying a label can have severe consequences. To address this concern, automate the labeling processes as much as possible, and control which users and roles are allowed to assign or modify labels.

## Resources

* [Docker security](https://docs.docker.com/engine/security/)
* [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
* [CIS Docker Community Edition Benchmark](https://www.cisecurity.org/benchmark/docker)
* [Docker Bench for Security](https://github.com/docker/docker-bench-security) is a script that checks for dozens of common best-practices around deploying Docker containers in production. The tests are all automated, and are based on the [CIS Docker Benchmark v1.5.0](https://www.cisecurity.org/benchmark/docker).