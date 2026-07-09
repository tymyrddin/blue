# Container and Kubernetes detection

The detection surface for containers and Kubernetes splits between runtime signals
inside the pod and control plane signals in the API server audit log. Both are
necessary. An attacker who exploits a pod but makes no API calls appears only in
runtime telemetry. An attacker moving through the API server using a stolen service
account token may produce no runtime anomalies at all.

## Kubernetes audit log

The API server generates an audit log entry for every API request, recording the verb,
resource, requesting principal, namespace, source IP, and optionally the request and
response objects. The audit policy controls which events are logged and at what detail
level; a minimal policy logs metadata for most verbs and full request objects for
sensitive operations.

Events worth alerting on:

Privileged pod creation: a create request on the `pods` resource where the request
object contains `securityContext.privileged: true`, `hostPID: true`, `hostNetwork: true`,
or `hostIPC: true`. These are rare in production workloads and common in container
escape attempts.

Pod exec: a create request on the `pods/exec` subresource. Legitimate uses include
debugging and one-off administrative commands. High-frequency exec events, exec into
production pods from non-CI service accounts, or exec from unexpected source IPs are
anomalous.

RBAC escalation: create or patch requests on `clusterrolebindings` or `rolebindings`,
particularly binding a subject to a high-privilege role. Modification of `clusterroles`
to add wildcard permissions is a related signal.

Secret enumeration: list or get requests on `secrets` from a service account that
normally has no reason to access secrets, particularly from an application namespace.

Service account token creation: create requests on `serviceaccounts/token` outside
expected CI or operator contexts.

A useful audit policy excerpt for sensitive operations:

```yaml
rules:
  - level: RequestResponse
    verbs: ["create", "update", "patch", "delete"]
    resources:
      - group: "rbac.authorization.k8s.io"
        resources: ["clusterrolebindings", "rolebindings", "clusterroles", "roles"]
  - level: Request
    verbs: ["create"]
    resources:
      - group: ""
        resources: ["pods"]
        subresources: ["exec", "portforward"]
      - group: ""
        resources: ["serviceaccounts"]
        subresources: ["token"]
  - level: Metadata
    verbs: ["list", "get", "watch"]
    resources:
      - group: ""
        resources: ["secrets"]
```

## Runtime signals

eBPF-based instrumentation (Falco, Tracee, Tetragon) captures syscall events from all
processes on the host, including containerised ones, with container context attached.
This layer is container-runtime-agnostic: it works regardless of whether an agent is
installed inside the container.

Shell spawns inside containers that have no legitimate use for a shell are a reliable
high-signal indicator. The baseline for each image determines what is expected. A
Python web application that never runs bash or sh produces a shell spawn event only
when something unexpected is happening. The Falco rule structure for shell spawn
detection is covered in `evasion/notes/containers.md`; the detection value is in
per-image baselines.

The `memfd_create` syscall creates an anonymous in-memory file not backed by the
filesystem. Combined with `execveat`, it allows payload execution without writing
to disk. Application containers have few legitimate uses for `memfd_create`. An explicit
Falco rule for this syscall in container context catches fileless execution attempts
that process-based rules miss.

`ptrace` from an unexpected process inside a container indicates memory inspection or
injection. Legitimate uses are confined to debuggers; application containers running in
production have no reason to call ptrace.

Writes to sensitive paths (`/etc/passwd`, `/etc/shadow`, `/etc/sudoers`,
`/root/.ssh/*`, `/proc/sys/*`) inside a container have few legitimate uses in a
production image. When combined with `readOnlyRootFilesystem: true`, such writes
fail at the kernel level and produce a denial event; on containers without that
setting, they succeed silently unless a runtime rule fires.

Package manager execution (`apt`, `yum`, `apk`, `pip`, `npm`) inside a running
container suggests tool installation. Immutable container images do not run package
managers after build. Falco rules for this pattern are covered in `evasion/notes/containers.md`.

## Unexpected outbound connections

Network policy violation logs from Calico or Cilium record dropped outbound connections
from pods that are subject to egress restrictions. Even in the absence of egress
restrictions, outbound connections to external IPs on uncommon ports from database or
internal-service pods are anomalous and worth correlating with runtime events from the
same container.

An outbound connection to port 443 from a pod that has never made external connections,
occurring within minutes of a shell spawn or sensitive file access in the same container,
is a strong combined indicator.

## Image pull monitoring

Admission webhook logs record every attempted pod creation including image references.
Pulls from registries outside the approved list appear at admission time. At the runtime
level, container runtime logs record image pull operations; a pull from an unexpected
registry outside of a deployment event may indicate direct API server access by an
attacker creating a pod without going through normal deployment tooling.

Image pull events from an unexpected registry alongside ClusterRoleBinding creation
from the same service account within a short time window is the signal for automated
control plane lateral movement.

## Correlating layers

The highest-confidence container compromise indicators combine runtime and control plane
signals. A shell spawn inside an application pod followed by Kubernetes API calls from
that pod's service account, followed by a new ClusterRoleBinding created by that same
service account, is a clear escalation chain. Neither the shell spawn alone nor the API
calls alone are definitive; the sequence across both layers is.

Correlating Kubernetes audit log events with Falco events requires a shared identifier.
The pod name and namespace appear in both; a SIEM or log aggregator that joins on these
fields across the two log sources makes the correlation practical.

## Standing up the sensor

The runtime signals above, shell spawns inside pods, unexpected exec, and drift from the image, are
produced by Falco. Golem Trust Computing's deployment of it is in
[Falco deployment](../../org/enterprise/runbooks/falco-deployment.md).
Last updated: 10 July 2026
