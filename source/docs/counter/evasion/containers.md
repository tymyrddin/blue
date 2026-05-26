# Containers and Kubernetes evasion

Host-based detection agents operate on the host OS. A containerised workload runs inside Linux namespaces that separate its process and filesystem view from the host, but the underlying syscalls still pass through the same kernel. The detection surface is not absent; it has moved.

The question for defenders is which signals escape the container boundary and which stay inside it.

## Where EDR stops and kernel visibility begins

An EDR agent that instruments processes by injecting into userspace cannot easily reach processes inside containers without explicit container-aware support. Host EDR sees the container runtime process; it may or may not see the processes that runtime spawns.

Kernel-level instrumentation with eBPF (Falco, Tracee) is container-agnostic: syscalls from every process on the host, including containerised ones, pass through the same probe points. Container context (namespace ID, container name, pod name) is recoverable from kernel metadata. This is the detection layer that works uniformly regardless of what the container runtime is doing.

## Attacker behaviour inside containers

An attacker with code execution inside a container has several options that avoid touching the host filesystem or spawning processes that look anomalous.

Living off the container: using only binaries present in the image. An image with curl, python, and bash provides enough tooling for most post-exploitation activity. A shell spawned from a web process stands out; using the same process to make an outbound HTTP call through a built-in library does not.

In-memory execution: loading a payload into memory without writing to disk. This has the same detection challenges as fileless execution on a managed endpoint, compounded by the fact that memory forensics of a running container is harder to perform.

Service account token abuse: every pod in a Kubernetes cluster has a service account token mounted at `/var/run/secrets/kubernetes.io/serviceaccount/token` by default. An attacker with code execution in a pod can use that token to make API calls to the Kubernetes API server. The reach depends on what RBAC permissions the service account holds, which is frequently broader than the application requires.

## The Kubernetes audit log

API server calls appear in the Kubernetes audit log regardless of where they originate. A pod using its mounted service account token to list secrets, create new pods, or modify RBAC bindings generates audit events with the service account name and namespace.

Events worth monitoring:

```
# Privileged pod creation
verb: create
resource: pods
requestObject.spec.containers[].securityContext.privileged: true

# Shell into a running pod
verb: create
subresource: exec
resource: pods

# Service account token requested from unexpected namespace
verb: create
resource: serviceaccounts/token

# ClusterRoleBinding modification
verb: create|update|patch
resource: clusterrolebindings
```

A service account from a standard application namespace appearing in API calls that reach beyond that namespace warrants investigation before assuming it is the application behaving unexpectedly.

## Falco rules for container evasion patterns

Falco rules fire on syscall patterns. Shell spawns inside containers that do not normally run shells are a reliable signal:

```yaml
- rule: Shell spawned in non-shell container
  desc: A shell was spawned inside a container not designed to run one
  condition: >
    spawned_process
    and container
    and shell_procs
    and not proc.pname in (shell_procs)
    and not container.image.repository in (known_shell_images)
  output: >
    Shell spawned in container (user=%user.name container=%container.name
    image=%container.image.repository cmd=%proc.cmdline)
  priority: WARNING
```

Package manager execution inside a running container suggests tool installation, which is either diagnostic access or an attacker establishing tooling:

```yaml
- rule: Package manager in container
  desc: Package manager used inside a running container
  condition: >
    spawned_process
    and container
    and proc.name in (package_mgmt_binaries)
  output: >
    Package manager used (user=%user.name container=%container.name
    cmd=%proc.cmdline)
  priority: WARNING
```

## Falco's blind spots

eBPF-based execution that loads a program into kernel context bypasses userspace process monitoring. An attacker with sufficient privilege to load an eBPF program inside a container can run code at the kernel level without triggering process-based Falco rules. Restricting `CAP_BPF` and `CAP_SYS_ADMIN` capabilities and setting seccomp profiles that block `bpf()` and `perf_event_open()` syscalls closes most of this surface.

In-memory execution via `memfd_create` followed by `execveat` does not write to the filesystem. Some Falco rules target the `memfd_create` syscall specifically; the default ruleset may not include these. An explicit rule for `memfd_create` in container context is worth adding to a custom ruleset.

Ephemeral containers (`kubectl debug`) run alongside an existing pod and share its process namespace. Falco 0.32 and later handle these as standard container events. Earlier versions may not attribute the process tree correctly.

## Hardening that creates detection signal

Immutable containers: setting `readOnlyRootFilesystem: true` in the pod security context means any write attempt to the container filesystem generates a kernel error and, with Falco, a rule violation. An attacker who tries to write a tool or establish a backdoor produces a visible event rather than silently succeeding.

Network policies: unexpected egress from a container with no legitimate reason for external connections is a clear signal. A network policy engine (Calico, Cilium) that blocks and logs violations provides the baseline for anomaly detection.

Admission controller violations: a pod spec requesting capabilities outside the approved set, or pulling from an unapproved registry, triggers a policy violation log entry. These often surface supply chain attempts or lateral movement before the container starts.

## Related

- [Serverless evasion](serverless.md)
- [Securing containers](../../dev/appsec/lockdown/containers.md)
- [Container security gaps](../../diy/containers/failures.md)
- [Supply chain hardening](../app/supply-chain.md)
