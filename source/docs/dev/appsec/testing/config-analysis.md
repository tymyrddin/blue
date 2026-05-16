# Configuration analysis

Misconfiguration is consistently one of the most common root causes in cloud security incidents. S3 buckets set to public read, IAM roles with overly broad permissions, databases with no authentication bound to a public interface: these are not coding errors, and SAST tools do not catch them.

Configuration analysis examines infrastructure and service settings against known-secure baselines. The CIS Benchmarks are a widely-used reference; they cover specific versions of common platforms (Linux distributions, Kubernetes, cloud services) and provide rationale for each recommended setting.

## Cloud configuration

AWS Config evaluates AWS resource configurations against managed or custom rules and records configuration history. Common rules: S3 buckets not set to public access, IAM policies not granting `*` actions, security groups not permitting inbound access on sensitive ports from `0.0.0.0/0`, CloudTrail enabled and logging to a protected bucket.

Similar services exist in other clouds: Azure Policy, Google Cloud Organization Policy.

## Container and Kubernetes

Kube-bench tests Kubernetes cluster configurations against the CIS Kubernetes Benchmark. It runs as a pod and checks control plane and worker node settings: API server flags, etcd encryption, network policies, RBAC configuration.

Container image scanning (Trivy, Grype) checks for known CVEs in image layers. Configuration analysis and image scanning address different surfaces: a hardened image can still be deployed with insecure Kubernetes configuration, and vice versa.

## Server hardening

CIS-CAT and OpenSCAP evaluate OS-level configurations (SSH settings, kernel parameters, file permissions, service configurations) against CIS Benchmarks or SCAP content. Useful for establishing a baseline on server images before deployment, and for drift detection over time.

Specific settings worth checking: SSH `PermitRootLogin no`, `PasswordAuthentication no` (key-based only), TLS protocol version minimum (TLS 1.2 or 1.3; disable 1.0 and 1.1), and directory listing disabled on web servers.
