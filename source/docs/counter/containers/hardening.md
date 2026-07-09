# Container and Kubernetes hardening

## Container image hardening

The attack surface of a running container is partly determined at build time. An image
that includes a shell, a package manager, and general-purpose utilities gives an attacker
with code execution more options than one that contains only the application binary and
its runtime dependencies.

Minimal base images reduce the tooling available inside a container without affecting
application behaviour. Distroless images contain the language runtime but not the shell,
package manager, or standard Unix utilities. Scratch-based images for statically compiled
Go or Rust binaries contain only the binary itself. Neither prevents exploitation, but
both narrow the post-exploitation surface.

A non-root USER directive in the Dockerfile sets the UID the container process runs as.
Many official images default to root (UID 0) unless the maintainer explicitly configured
otherwise. Running as root inside a container is not the same as root on the host, but
it widens several privilege escalation paths and means filesystem writes inside the
container happen as root.

Read-only root filesystem (`readOnlyRootFilesystem: true` in the pod security context)
prevents writes to the container filesystem at runtime. Applications that need writable
space mount specific directories as tmpfs volumes. Attempts to write outside those mount
points fail at the kernel level and generate a visible signal. This turns misconfigured
or exploited containers into noisy failures.

Capability stripping removes Linux capabilities the application does not need.
`capabilities.drop: ["ALL"]` removes the full set; capabilities the application
genuinely requires (e.g. `NET_BIND_SERVICE` for binding to ports below 1024) are added
back explicitly. A container with no capabilities beyond those explicitly granted cannot
perform most privilege escalation operations even if the application is exploited.

Image scanning in the build pipeline (Trivy, Grype, Snyk) checks for known CVEs in
image layers before the image reaches a registry or cluster. Scanning at build time
catches vulnerabilities before deployment; scanning continuously in a registry catches
cases where new CVEs are published against an already-deployed image. Neither approach
catches zero-days or application-layer vulnerabilities.

Image signing attaches a cryptographic signature to an image at build time. Cosign with
the Sigstore ecosystem and notation with OCI image signing are the two common approaches.
An admission webhook that verifies signatures before allowing a pod to start prevents
unsigned images from running, which is effective against image substitution and supply
chain attacks where an attacker replaces a legitimate image in a registry.

## RBAC misconfiguration patterns

Kubernetes RBAC controls what each service account can request from the API server.
Misconfigured RBAC is among the most common findings in Kubernetes security reviews.

Wildcard verbs and resources are the most permissive pattern. A Role or ClusterRole
with `verbs: ["*"]` and `resources: ["*"]` grants full control over everything in its
scope. Wildcards appear in development configurations and in controller service accounts
where the author did not scope permissions precisely.

`cluster-admin` bindings to non-system subjects deserve specific attention.
`cluster-admin` is a built-in ClusterRole granting unrestricted access to every API
resource. Legitimate subjects are few: some controllers, some Helm service accounts
during installation, cluster operators. A user account, developer service account, or
application service account bound to `cluster-admin` warrants explicit justification.

Automounted service account tokens are the default in Kubernetes. Unless
`automountServiceAccountToken: false` is set on the ServiceAccount or the pod spec,
every pod receives a mounted credential for the namespace service account at
`/var/run/secrets/kubernetes.io/serviceaccount/token`. An attacker with code execution
in a pod can use this token immediately. Applications that make no API calls have no
need for it.

Broad subject bindings: `system:authenticated` as a binding subject grants the
associated permissions to every authenticated principal in the cluster, including
service accounts from all namespaces. `system:unauthenticated` does the same for
unauthenticated requests. Both appear occasionally in clusters configured for broad
API discovery or in misconfigured admission setups.

Cross-namespace escalation: a service account in a low-privilege namespace with a
ClusterRoleBinding can access resources across all namespaces.
Applications with no reason to reach outside their namespace are candidates for
RoleBindings scoped to that namespace.

## Pod security contexts

Pod security contexts set the security posture of a pod and its containers at runtime.

`runAsNonRoot: true` rejects the pod if the container image runs as UID 0. `runAsUser`
sets a specific UID. `runAsGroup` sets the primary GID.

`allowPrivilegeEscalation: false` sets the `no_new_privs` flag, preventing the process
from acquiring privileges beyond those it started with. This blocks setuid execution
and most local privilege escalation paths inside the container.

`privileged: true` grants the container the full Linux capability set and most of the
same access as a root process on the host. Its use is rarely justified; when it appears,
the host is effectively accessible from that pod.

The Pod Security Admission controller (PodSecurityPolicy was deprecated in Kubernetes
1.21 and removed in 1.25; PSA replaced it) enforces profiles at the namespace level via
namespace labels. Three built-in
profiles: `restricted` enforces the full set of hardening fields above; `baseline`
blocks the most obvious misconfigurations (privileged containers, host namespace
sharing) without requiring all hardening fields; `privileged` applies no restrictions.
Namespaces carry a label that sets both the enforcement mode (`enforce`, `audit`, `warn`)
and the profile level.

Seccomp profiles restrict which syscalls the container process can make. The
`RuntimeDefault` profile (built into containerd and CRI-O) blocks roughly the same
set as Docker's default seccomp profile. A `Localhost` profile provides a custom
syscall allowlist. `Unconfined` removes seccomp entirely. Most production workloads
run safely under `RuntimeDefault` without modification.

## Admission controllers

Admission controllers intercept API server requests before objects are persisted.
Policy engines that run as admission webhooks allow custom policies beyond what the
built-in PSA covers.

OPA/Gatekeeper uses the Rego policy language. Policies are expressed as
ConstraintTemplates (the schema) and Constraints (the instantiated policy). A
ConstraintTemplate that rejects pods requesting host namespaces, applied cluster-wide,
enforces that restriction at admission time regardless of how the pod spec was
constructed.

Kyverno uses Kubernetes-native YAML policies. A ClusterPolicy with `validate` rules
can reject pods that mount the Docker socket, request `CAP_SYS_ADMIN`, pull from
registries outside an approved list, or omit resource limits. Kyverno also supports
`mutate` rules that add default security context fields when absent, reducing the
gap between what developers write and what the cluster enforces.

Common policies worth implementing regardless of engine:
- No privileged containers
- No host PID, network, or IPC namespace sharing
- No host path volume mounts outside narrow infrastructure exceptions
- Image pulls restricted to approved registries
- Required seccomp profile at minimum `RuntimeDefault`

## Network policies

Kubernetes network policies are enforced by the CNI plugin. Not all plugins support
them: clusters using a plugin that does not enforce network policies have no pod-level
network segmentation regardless of what policy objects are defined.

A default-deny policy for both ingress and egress in each namespace means no traffic
is permitted unless explicitly allowed. This limits the blast radius if a pod is
compromised: an attacker cannot reach other namespaces or external infrastructure
without a matching allow rule.

Egress restrictions on application pods are the less commonly implemented half. Most
configurations restrict ingress but leave egress open. A pod with no egress policy can
reach the cloud metadata service, the Kubernetes API server, and arbitrary external
infrastructure. Egress policies that explicitly allow only the destinations the
application needs remove most of that surface.
Last updated: 10 July 2026
