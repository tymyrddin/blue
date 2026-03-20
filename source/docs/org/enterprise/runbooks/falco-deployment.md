# Falco deployment

Falco runs on every Kubernetes node at Golem Trust as a DaemonSet, watching system calls from every container on every host. Dr. Crucible describes it as "Angua on every corner, and she never sleeps." This runbook covers the Helm-based installation procedure, the standard configuration file, output channel configuration, and how to verify that the DaemonSet is healthy across all nodes. Images are pulled from the internal Harbor registry rather than directly from Docker Hub, in line with Ludmilla's supply chain policy.

## Prerequisites

- Helm 3 installed on the operator workstation
- `kubectl` access to the target cluster with cluster-admin rights
- Harbor registry accessible at `harbor.golems.internal`, with the `falcosecurity/falco` image already mirrored (see the Harbor synchronisation schedule managed by Dr. Crucible)
- All worker nodes running kernel 5.15 or later (Hetzner CX42 instances with Ubuntu 22.04 LTS satisfy this)

## Add the Falco Helm repository

```
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update
```

## Create the namespace and values file

Create the `falco` namespace before installing:

```
kubectl create namespace falco
```

Create a `falco-values.yaml` file. This configures the modern eBPF driver, sets the image to pull from Harbor, defines resource limits appropriate for CX42 nodes, and enables the gRPC output channel for Falcosidekick:

```
image:
  registry: harbor.golems.internal
  repository: falcosecurity/falco
  tag: "0.38.2"

driver:
  kind: modern_ebpf

falco:
  grpc:
    enabled: true
    bind_address: "unix:///run/falco/falco.sock"
    threadiness: 8
  grpc_output:
    enabled: true
  file_output:
    enabled: true
    keep_alive: false
    filename: /var/log/falco/events.log
  stdout_output:
    enabled: true
  log_level: info
  syscall_buf_size_preset: 4

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 512Mi

tolerations:
  - effect: NoSchedule
    operator: Exists
```

The `syscall_buf_size_preset: 4` value is a balance between memory consumption and the risk of event loss under high syscall rates. Preset 4 allocates 8 MB per CPU ring buffer. Ponder's standing guidance is not to exceed preset 6 on the CX42 nodes without first checking with him, as higher values cause kernel memory pressure at scale.

## Install Falco

```
helm upgrade --install falco falcosecurity/falco \
  --namespace falco \
  --values falco-values.yaml \
  --version 4.6.0
```

## Verify the DaemonSet

All nodes should run exactly one Falco pod. The `DESIRED` and `READY` counts must match the total node count:

```
kubectl get daemonset falco -n falco
kubectl get pods -n falco -o wide
```

Check the logs on a sample pod to confirm Falco started cleanly and the eBPF probe loaded:

```
kubectl logs -n falco -l app.kubernetes.io/name=falco --tail=50
```

Look for a line containing `Falco initialized` and another confirming the driver type. If the modern eBPF probe loaded correctly you will see `Driver: modern_ebpf`. If instead you see `kmod` or `ebpf`, review the eBPF configuration runbook.

## Falco configuration file reference

The core runtime configuration lives in `falco.yaml`, which the Helm chart renders from values. The most operationally significant parameters are:

```
# Output channels
json_output: true
json_include_output_property: true

# Rules files loaded at startup
rules_file:
  - /etc/falco/falco_rules.yaml
  - /etc/falco/falco_rules.local.yaml
  - /etc/falco/golem_trust_rules.yaml

# gRPC server for Falcosidekick
grpc:
  enabled: true
  bind_address: "unix:///run/falco/falco.sock"
  threadiness: 8

# Syscall buffer tuning
syscall_buf_size_preset: 4
```

The `golem_trust_rules.yaml` file is mounted via a ConfigMap that is managed through the GitLab repository `golem-trust/falco-rules`. Changes to that repository trigger a pipeline that updates the ConfigMap and performs a rolling restart of the DaemonSet.

## Image update procedure

When a new Falco image is available, Dr. Crucible first synchronises it into Harbor, then updates the `tag` value in `falco-values.yaml` and runs:

```
helm upgrade falco falcosecurity/falco \
  --namespace falco \
  --values falco-values.yaml \
  --version 4.6.0
```

The DaemonSet performs a rolling update, replacing pods one node at a time. Monitor progress with:

```
kubectl rollout status daemonset/falco -n falco
```

There will be a brief detection gap on each node as its pod restarts. Cheery from the security team keeps an eye on Graylog during upgrades to confirm alerts resume on each node after the pod comes back up.
