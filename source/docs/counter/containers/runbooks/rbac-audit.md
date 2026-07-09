# Kubernetes RBAC misconfiguration audit

Four queries: cluster-admin bindings to non-system subjects, Roles and ClusterRoles
with wildcard permissions, bindings granting access to all authenticated principals,
and service accounts with automounted tokens that have no API access requirement.

## Cluster-admin bindings to non-system subjects

Hypothesis: a service account, user, or group has been bound to cluster-admin without
a legitimate operational requirement.

```bash
kubectl get clusterrolebindings -o json | \
  jq -r '.items[] |
    select(.roleRef.name == "cluster-admin") |
    .metadata.name as $binding |
    .subjects[]? |
    select(
      (.namespace != "kube-system") and
      (.name | startswith("system:") | not)
    ) |
    [$binding, .kind, .name, (.namespace // "cluster-scoped")] |
    @tsv' | \
  column -t
```

Any subject appearing here warrants documentation of why cluster-admin is needed.
Service accounts bound to cluster-admin outside kube-system, and any user account
binding, are high priority.

## Wildcard permissions in Roles and ClusterRoles

Hypothesis: a Role or ClusterRole grants unrestricted access via wildcard verbs or
resources, beyond what any specific workload requires.

```bash
# ClusterRoles with wildcard verbs or resources (excluding built-in system roles)
kubectl get clusterroles -o json | \
  jq -r '.items[] |
    select(.metadata.name | startswith("system:") | not) |
    .metadata.name as $role |
    .rules[]? |
    select((.verbs[]? == "*") or (.resources[]? == "*")) |
    [$role, (.verbs | join(",")), (.resources | join(","))] |
    @tsv' | \
  column -t

# namespace-scoped Roles with wildcard permissions
kubectl get roles -A -o json | \
  jq -r '.items[] |
    .metadata.namespace as $ns |
    .metadata.name as $role |
    .rules[]? |
    select((.verbs[]? == "*") or (.resources[]? == "*")) |
    [$ns, $role, (.verbs | join(",")), (.resources | join(","))] |
    @tsv' | \
  column -t
```

## Bindings to system:authenticated or system:unauthenticated

Hypothesis: permissions have been granted cluster-wide to all authenticated or
unauthenticated principals, rather than to specific service accounts.

```bash
kubectl get clusterrolebindings,rolebindings -A -o json | \
  jq -r '.items[] |
    .metadata.name as $binding |
    (.metadata.namespace // "cluster") as $ns |
    .subjects[]? |
    select(
      .name == "system:authenticated" or
      .name == "system:unauthenticated"
    ) |
    [$ns, $binding, .name] |
    @tsv' | \
  column -t
```

## Service accounts with automounted tokens

Hypothesis: service accounts have not opted out of token automounting, creating mounted
credentials in every pod using the account, including pods that make no API calls.

```bash
kubectl get serviceaccounts -A -o json | \
  jq -r '.items[] |
    select(
      .automountServiceAccountToken != false and
      .metadata.namespace != "kube-system" and
      (.metadata.name | startswith("system:") | not)
    ) |
    [.metadata.namespace, .metadata.name] |
    @tsv' | \
  column -t
```

The output includes service accounts that have not explicitly opted out. Many are
expected: applications that legitimately call the Kubernetes API. The review question
is whether workloads that make no API calls have tokens mounted unnecessarily. Setting
`automountServiceAccountToken: false` on the ServiceAccount object, or on individual
pod specs, removes the token from pods that do not use it.

## Roles permitting secret access

Hypothesis: more service accounts than expected have been granted permission to read
secrets, widening the impact of a pod compromise.

```bash
# identify which roles and clusterroles grant secret read access
kubectl get clusterroles,roles -A -o json | \
  jq -r '.items[] |
    .metadata.name as $name |
    (.metadata.namespace // "cluster") as $ns |
    .rules[]? |
    select(
      (any(.resources[]?; . == "secrets" or . == "*")) and
      (any(.verbs[]?; . == "get" or . == "list" or . == "*"))
    ) |
    [$ns, $name] |
    @tsv' | \
  sort -u | column -t
```

Cross-reference this output with the binding queries above to identify which service
accounts hold secret read access in practice.
