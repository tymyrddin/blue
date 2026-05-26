# Securing containers

## Security by design

Hardened images reduce the attack surface before a container ever runs. Minimal base images (Alpine, Distroless) include
fewer binaries and fewer vulnerabilities. Removing shells and debug tools limits what an attacker can do after gaining
access; if no shell exists in the image, a shell cannot be spawned.

Pre-deployment scanning with Trivy or Grype identifies known CVEs in base images and application layers before they
reach production:

```bash
trivy image --severity CRITICAL my-app:latest
```

Configuration lockdown at run time:

```bash
docker run --read-only --cap-drop=ALL --user nobody my-safe-app
```

Running as non-root (`USER nobody`) removes a significant class of privilege escalation paths. `--cap-drop=ALL` removes
all Linux capabilities by default; individual capabilities can be added back selectively with `--cap-add`. `--read-only`
prevents the container from modifying its own filesystem.

## Runtime protection

Falco and Tracee detect unexpected process activity inside containers (shell spawns, network connections to unexpected
destinations, privilege changes) by instrumenting kernel system calls:

```bash
falco -r rules/container_abuse.yaml
```

Network policies (Cilium, Calico) can restrict which pods communicate with which, reducing the lateral movement surface
after a compromise. Resource limits (`--memory=500m`, `--cpus=1`) constrain the impact of cryptomining or
denial-of-service payloads.

Immutability is a practical containment strategy: containers in production are not debugged live. When a container
behaves unexpectedly, it is terminated and a fresh one is deployed. The anomalous container can be preserved for
forensic analysis before teardown if the environment supports it.

## Scanning

Layers accumulate over time. New vulnerabilities emerge against packages that were clean at build time, which means
images that passed a scan at deployment may be vulnerable weeks later. Periodic re-scanning (weekly is a common cadence)
catches this drift. Embedding the scan into the CI/CD pipeline and blocking deployments on critical findings catches it
at the gate.

## Containment when prevention fails

Service meshes (Istio with mTLS) encrypt and authenticate traffic between services, making it harder for a compromised
container to intercept traffic from adjacent ones. Network policies that block cross-pod traffic by default and permit
only required flows limit what a compromised container can reach.

Audit trails of container lifecycle events (start, stop, exec, image pulls) provide the baseline for post-incident
analysis.

## Further reading

- [NSA Container Hardening Guide](https://media.defense.gov/2022/Jan/26/2002929608/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220126.PDF)
- [Google's Distroless Containers](https://github.com/GoogleContainerTools/distroless)

## Related

- [Containers and Kubernetes evasion](../../../counter/evasion/containers.md)
- [Container security gaps](../../../diy/containers/failures.md)
