# Troubleshooting

Falco is a low-level security tool that sits close to the kernel and consumes a meaningful share of system resources. When something goes wrong, the symptoms range from a pod that fails to start through to alert floods that obscure genuine threats. This runbook collects the failure modes Dr. Crucible and Cheery have encountered in production, along with the resolution steps. It also documents the developer debugging shell incident from the first week of operation, which is now used as a reference case for what a Falco alert actually looks like in practice.

## Falco pod not starting: driver loading failure

If a Falco pod is in `CrashLoopBackOff` or `Error` state, the most common cause is that the eBPF probe failed to load.

Check the pod logs first:

```
kubectl logs -n falco <pod-name> --previous
```

Then check `dmesg` on the node the pod was scheduled to:

```
kubectl get pod -n falco <pod-name> -o wide
# note the node name, then SSH to it
ssh <node>
dmesg | tail -100 | grep -i bpf
```

BPF verifier errors appear as `bpf: Permission denied` or `bpf: Invalid argument`. The most common causes and their fixes are:

- Kernel below 5.8: re-provision the node with Ubuntu 22.04 LTS
- BTF not available: confirm `/sys/kernel/btf/vmlinux` exists; if absent, the kernel was built without `CONFIG_DEBUG_INFO_BTF=y`
- Missing capabilities: check that no Gatekeeper policy stripped `CAP_BPF` or `CAP_PERFMON` from the pod; see the eBPF configuration runbook for required capabilities

## High CPU from Falco

Falco watching high-throughput workloads (build systems, CI runners, log aggregators) can consume significant CPU due to the volume of syscalls processed. Tune the buffer size preset downwards first:

```
syscall_buf_size_preset: 2
```

Then identify which rules are firing most frequently. Noisy rules inflate CPU not because of the detection itself but because of output serialisation. Query the Falcosidekick metrics:

```
kubectl port-forward -n falco svc/falcosidekick 2801:2801
curl -s http://localhost:2801/metrics | grep falcosidekick_inputs_total | sort -t= -k2 -rn | head -20
```

For rules generating thousands of events per hour with no operational value, either add a macro exception or set the priority to `DEBUG` so the event is suppressed:

```
- rule: Some chatty default rule
  override:
    condition: append
  condition: and not k8s.ns.name = ci-runners
```

## False positive rules

False positives are almost always caused by a legitimate process that matches a condition written for a narrower scope. The fix is always to extend the condition via `override: append` rather than disabling the rule outright.

To identify the fields of a specific event, enable JSON output and watch the log file:

```
kubectl exec -n falco <pod-name> -- tail -f /var/log/falco/events.log | python3 -m json.tool
```

Find the false positive event, note the distinguishing field values (for example `proc.name`, `container.image.repository`, or `k8s.ns.name`), then add an exception:

```
- macro: golem_trust_allowed_write_etc
  condition: proc.name = my-init-container

- rule: Write below etc
  override:
    condition: append
  condition: and not golem_trust_allowed_write_etc
```

Test the change with `falco --dry-run` before deploying. Submit the change as a merge request to `golem-trust/falco-rules`; it requires approval from either Dr. Crucible or Cheery.

## Testing whether a specific syscall is detected

To confirm that a rule catches the intended behaviour, use a test container with `nsenter` to run a command in the target container's namespaces, or simply exec into an existing container:

```
kubectl run falco-test \
  --image=harbor.golems.internal/library/ubuntu:22.04 \
  --restart=Never \
  --rm -it \
  -- /bin/bash
```

Inside the container, perform the action the rule targets (for example, reading `/etc/shadow`). Watch Falco logs on the node running the test pod:

```
kubectl logs -n falco <falco-pod-on-same-node> -f | grep "falco-test"
```

If no alert fires, confirm the pod is running on the same node as the Falco pod you are watching, and that the rule is loaded:

```
kubectl exec -n falco <falco-pod> -- falco --list | grep "your rule name"
```

## Upgrade procedure

Falco upgrades follow the DaemonSet rolling update pattern. Before upgrading, check the driver compatibility matrix in the Falco release notes: a new Falco version sometimes requires a driver update that is not backwards compatible with the previous Helm chart.

Update the image tag in `falco-values.yaml`, then apply:

```
helm upgrade falco falcosecurity/falco \
  --namespace falco \
  --values falco-values.yaml \
  --version <new-chart-version>
```

Monitor the rollout. There is a brief detection gap on each node as its pod restarts:

```
kubectl rollout status daemonset/falco -n falco --timeout=10m
```

If the rollout stalls, check the pod events on the new pod version:

```
kubectl describe pod -n falco <new-pod-name>
```

A stalled rollout most commonly means the new driver version failed to load on some node types. Roll back immediately if more than one node loses coverage for longer than two minutes:

```
helm rollback falco -n falco
```

## The developer debugging shell incident

During the first week of Falco's operation, a developer had left an active `bash` process running inside a production payments container. The container image had been built with `bash` installed and the developer had used `kubectl exec` to investigate a query performance issue, then left the session running.

The alert that fired was:

```
{
  "output": "Shell spawned in production database container (ns=production pod=payments-db-6f7c9d-mn4xp image=harbor.golems.internal/golem-trust/payments-db:2.1.4 cmd=/bin/bash user=root)",
  "priority": "CRITICAL",
  "rule": "Shell spawned in production database container",
  "time": "2025-10-02T11:42:03Z",
  "output_fields": {
    "k8s.ns.name": "production",
    "k8s.pod.name": "payments-db-6f7c9d-mn4xp",
    "container.image.repository": "harbor.golems.internal/golem-trust/payments-db",
    "proc.cmdline": "/bin/bash",
    "user.name": "root"
  }
}
```

The response controller killed the pod within three seconds of alert generation. The pod was replaced by its ReplicaSet controller within eight seconds. The developer was contacted by Cheery and reminded that `kubectl exec` sessions in production containers must be approved in advance and must use a dedicated debug image rather than the production image. The production database image was subsequently rebuilt without a shell binary, and a Dockerfile linting rule was added to the CI pipeline to catch shell installation in database images at build time.
