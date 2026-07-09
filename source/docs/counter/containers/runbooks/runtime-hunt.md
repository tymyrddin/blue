# Container runtime and audit log hunting

Two hunts: Kubernetes API server audit log queries for control plane anomalies, and
Falco rules for runtime signals not covered in the evasion section.

## Kubernetes audit log: privileged pod creation

Hypothesis: an attacker with API server access is creating pods with host-level
privileges as a container escape or lateral movement step.

Data source: Kubernetes API server audit log (JSON format).

```bash
# extract privileged pod creation events
grep '"verb":"create"' /var/log/kubernetes/audit.log | \
  jq -c 'select(
    .objectRef.resource == "pods" and
    .verb == "create" and
    (
      .requestObject.spec.containers[]?.securityContext.privileged == true or
      .requestObject.spec.hostPID == true or
      .requestObject.spec.hostNetwork == true or
      .requestObject.spec.hostIPC == true
    )
  ) | {
    time:      .requestReceivedTimestamp,
    user:      .user.username,
    namespace: .objectRef.namespace,
    pod:       .objectRef.name,
    sourceIP:  .sourceIPs[0]
  }'
```

## Kubernetes audit log: exec and anomalous API calls

Hypothesis: a service account is being used for interactive access or API operations
outside its documented scope.

```bash
# pod exec events
grep '"subresource":"exec"' /var/log/kubernetes/audit.log | \
  jq -c 'select(.verb == "create") | {
    time:      .requestReceivedTimestamp,
    user:      .user.username,
    namespace: .objectRef.namespace,
    pod:       .objectRef.name,
    sourceIP:  .sourceIPs[0]
  }'

# RBAC modification events
grep -E '"resource":"(clusterrolebindings|rolebindings|clusterroles)"' \
  /var/log/kubernetes/audit.log | \
  jq -c 'select(.verb | test("create|update|patch|delete")) | {
    time:      .requestReceivedTimestamp,
    user:      .user.username,
    verb:      .verb,
    resource:  .objectRef.resource,
    name:      .objectRef.name,
    namespace: (.objectRef.namespace // "cluster")
  }'

# secret access from unexpected service accounts
# adjust the exclusion pattern for known legitimate consumers
grep '"resource":"secrets"' /var/log/kubernetes/audit.log | \
  jq -c 'select(
    .objectRef.resource == "secrets" and
    (.verb == "get" or .verb == "list") and
    (.user.username | startswith("system:serviceaccount:")) and
    (.user.username | test("cert-manager|vault|external-secrets") | not)
  ) | {
    time:      .requestReceivedTimestamp,
    account:   .user.username,
    verb:      .verb,
    namespace: .objectRef.namespace
  }' | sort | uniq -c | sort -rn | head -30
```

## Falco: fileless execution and memory inspection

The following rules cover patterns not in [evasion/containers.md](../../evasion/containers.md). Add to a
custom Falco rules file alongside the shell spawn and package manager rules.

```yaml
# lists referenced by the rules below; extend as needed for the environment
- list: known_memfd_users
  items: []

- list: known_debugger_procs
  items: [gdb, lldb, strace, ltrace]

# memfd_create: fileless execution staging without writing to the filesystem
- rule: Fileless execution via memfd in container
  desc: memfd_create used to stage an in-memory payload inside a container
  condition: >
    evt.type = memfd_create
    and container
    and not proc.name in (known_memfd_users)
  output: >
    memfd_create in container (user=%user.name container=%container.name
    image=%container.image.repository proc=%proc.name cmdline=%proc.cmdline)
  priority: WARNING
  tags: [container, mitre_defense_evasion]

# ptrace from a non-debugger process: memory inspection or injection
- rule: Unexpected ptrace in container
  desc: ptrace syscall from a process with no legitimate debugging purpose
  condition: >
    evt.type = ptrace
    and container
    and evt.dir = >
    and not proc.name in (known_debugger_procs)
  output: >
    ptrace in container (user=%user.name container=%container.name
    image=%container.image.repository proc=%proc.name pid=%proc.pid)
  priority: WARNING
  tags: [container, mitre_credential_access]

# write to credential or configuration paths inside a container
- rule: Write to sensitive path in container
  desc: Process wrote to a path that should be read-only in a production container
  condition: >
    (evt.type = open or evt.type = openat)
    and evt.is_open_write = true
    and container
    and (
      fd.name startswith "/etc/passwd" or
      fd.name startswith "/etc/shadow" or
      fd.name startswith "/etc/sudoers" or
      fd.name startswith "/root/.ssh" or
      fd.name startswith "/proc/sys"
    )
  output: >
    Sensitive path written in container (user=%user.name container=%container.name
    image=%container.image.repository path=%fd.name proc=%proc.name)
  priority: ERROR
  tags: [container, mitre_persistence]
```

## Correlating runtime and control plane events

A shell spawn inside a pod followed by API calls from that pod's service account is a
high-confidence escalation indicator. Given a pod name and namespace from a Falco alert:

```bash
POD_NS="default"
POD_NAME="web-app-xyz"
ALERT_TIME="2026-01-15T14:22:00Z"
WINDOW_END="2026-01-15T14:52:00Z"

# find the service account for this pod
SA=$(kubectl get pod "$POD_NAME" -n "$POD_NS" \
  -o jsonpath='{.spec.serviceAccountName}')

# find all API calls from that service account in the 30 minutes after the alert
grep "system:serviceaccount:${POD_NS}:${SA}" /var/log/kubernetes/audit.log | \
  jq -c --arg start "$ALERT_TIME" --arg end "$WINDOW_END" \
  'select(
    .requestReceivedTimestamp >= $start and
    .requestReceivedTimestamp <= $end
  ) | {
    time:      .requestReceivedTimestamp,
    verb:      .verb,
    resource:  .objectRef.resource,
    name:      .objectRef.name,
    namespace: (.objectRef.namespace // "cluster")
  }'
```

A service account from an application namespace making RBAC modifications or secret
access calls in the window following a Falco shell spawn from the same pod is the
escalation chain worth treating as a confirmed incident.
