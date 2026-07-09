# Response automation

Detecting a malicious container is useful; killing it automatically within seconds is better. Golem Trust operates a response controller that receives Falco alert webhooks from Falcosidekick and acts on them without human intervention for a defined set of high-confidence rules. Dr. Crucible designed the safeguards carefully: the controller never kills pods in `kube-system`, never kills DaemonSet pods, and operates only in the `production` and `staging` namespaces. Ludmilla reviewed the design and added the requirement that every automated action be logged to the Graylog audit stream, so that Mr. Bent can account for any container termination in the compliance records.

## Architecture

The response controller is a small Go service deployed as a Deployment (two replicas) in the `falco` namespace. Falcosidekick sends a webhook to the controller for rules tagged `autoresponse: true`. The controller inspects the alert, identifies the pod, applies the configured action, and writes a structured audit log entry.

Falcosidekick webhook output configuration in `falcosidekick-values.yaml`:

```
config:
  webhook:
    address: http://falco-response-controller.falco.svc.cluster.local:8080/alert
    minimumpriority: critical
    customheaders: "X-Falco-Token: <token-from-secret>"
```

## Response controller configuration

The controller reads its configuration from a ConfigMap:

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: response-controller-config
  namespace: falco
data:
  config.yaml: |
    dryrun: false

    allowed_namespaces:
      - production
      - staging

    denied_namespaces:
      - kube-system
      - falco
      - monitoring
      - cert-manager

    protected_owners:
      - DaemonSet
      - StatefulSet

    rules:
      - name: "Crypto mining process detected"
        action: kill_pod
        audit_reason: "Crypto miner process detected by Falco; automated termination"

      - name: "Shell spawned in production database container"
        action: kill_pod
        audit_reason: "Shell in production DB container; automated termination per Ludmilla policy GTR-014"

      - name: "Network connection to known mining pool"
        action: kill_pod
        audit_reason: "Mining pool network connection; automated termination"
```

## Pod kill logic

When the controller receives a webhook for a rule with `action: kill_pod`, it executes the following sequence:

1. Extract `k8s.ns.name` and `k8s.pod.name` from the alert output fields.
2. Check that the namespace is in `allowed_namespaces` and not in `denied_namespaces`.
3. Look up the pod's owner references. If the top-level owner is a DaemonSet or is in `protected_owners`, abort and log a warning.
4. Delete the pod: `kubectl delete pod <name> -n <namespace> --grace-period=0`.
5. Write a structured audit log entry to Graylog.

The controller uses the Kubernetes API directly via in-cluster credentials bound to a ServiceAccount with the minimum required RBAC:

```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: falco-response-controller
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "delete"]
  - apiGroups: ["apps"]
    resources: ["daemonsets", "replicasets", "statefulsets"]
    verbs: ["get"]
```

## NetworkPolicy auto-update

For rules that indicate malicious outbound connections, the controller can add a NetworkPolicy to isolate the pod's namespace rather than simply killing the pod. This is configured per rule:

```
      - name: "Network connection to known mining pool"
        action: isolate_namespace
        audit_reason: "Mining pool connection; namespace isolated pending investigation"
```

The isolation action creates a deny-all egress NetworkPolicy in the affected namespace:

```
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: falco-emergency-isolation
  namespace: <affected-namespace>
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress: []
```

Cheery is automatically paged when an isolation policy is applied, as this affects all workloads in the namespace.

## Dry-run mode

When a new rule is tagged for automated response, set `dryrun: true` in the ConfigMap and redeploy. In dry-run mode, the controller logs what it would have done without taking action:

```
kubectl logs -n falco -l app=falco-response-controller | grep DRY_RUN
```

Leave new rules in dry-run mode for at least one week of production operation, reviewing the logs to confirm there are no false positives before enabling live termination.

## Audit log format

Every automated action writes a JSON entry to the Graylog audit stream `falco-automated-response`:

```
{
  "timestamp": "2025-11-14T03:22:17Z",
  "action": "kill_pod",
  "namespace": "production",
  "pod": "payments-api-7d9f4b-xkp2m",
  "rule": "Crypto mining process detected",
  "dry_run": false,
  "reason": "Crypto miner process detected by Falco; automated termination",
  "operator": "falco-response-controller",
  "falco_priority": "CRITICAL",
  "falco_output": "Crypto miner process started (ns=production pod=payments-api-7d9f4b-xkp2m ...)"
}
```

Mr. Bent reviews these entries weekly as part of the change management reconciliation process. Any automated pod kill that affected a customer-facing service must be annotated in the incident register within 24 hours.
