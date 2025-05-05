# Securing Containers: preventing pompromise and pontaining breaches

## Security by design (Pre-Deployment)

Build hardened images:

* Start with minimal base images (Alpine, Distroless)
* Remove unnecessary tools (no shells, debug binaries)
* Scan for vulnerabilities before deployment (Trivy, Grype)

Lock down configurations:

* Run as non-root (USER nobody)
* Drop unneeded kernel capabilities (--cap-drop=ALL)
* Make filesystems read-only (--read-only)

Example:
```bash
docker run --read-only --cap-drop=ALL --user nobody my-safe-app
```

## Runtime protection

Monitor for suspicious activity:

* Detect unexpected processes (Falco, Tracee)
* Block anomalous network connections (Cilium, Calico)
* Limit resource usage to prevent crypto-mining (--memory=500m)

Enforce immutability:

* No live debugging in production
* Terminate and redeploy instead of patching

Tooling:

```bash
falco -r rules/container_abuse.yaml  # Alert on shell spawns in containers
```

## Scan everything, always

Layers matter: Scan base images and application layers. Check for:

* Known CVEs
* Embedded secrets
* Malicious packages

Automate checks:

* Block deployments if critical issues found
* Re-scan weekly (new vulnerabilities emerge constantly)

Example:

```bash
trivy image --severity CRITICAL my-app:latest
```

## When prevention fails: containment

1. Network segmentation:
   * Service meshes (Istio mTLS)
   * Network policies (block cross-pod traffic)
2. Forensic readiness:
   * Preserve compromised containers for analysis
   * Audit trails of container lifecycle events

## More

* [NSA Container Hardening Guide](https://media.defense.gov/2022/Jan/26/2002929608/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220126.PDF)
* [Google's Distroless Containers](https://github.com/GoogleContainerTools/distroless)
* [Container Security for development teams - 2022](https://snyk.io/learn/container-security/)


