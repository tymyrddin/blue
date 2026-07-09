# Namespace isolation

The three principal customer namespaces at Golem Trust are `royal-bank`, `patricians-office`, and `merchants-guild`. Adora Belle negotiated the contracts; Ludmilla built the technical isolation. The Royal Bank's requirements are the strictest: their namespace must be provably isolated from all other customer namespaces at the network, resource, and RBAC layers simultaneously. The Patrician's Office requires similar guarantees, and has additionally requested that their namespace not appear in any shared audit log visible to other customers. This runbook covers how each namespace is created, labelled, quota-bounded, and isolated, and how customer service accounts are scoped.

## Namespace creation and labelling

Create the namespace with the labels that Calico, Gatekeeper, and Istio policies use for targeting:

```
apiVersion: v1
kind: Namespace
metadata:
  name: royal-bank
  labels:
    golemtrust.am/customer: royal-bank
    golemtrust.am/tier: enterprise
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: v1.29
    istio-injection: enabled
```

Apply the same pattern for `patricians-office` and `merchants-guild`, substituting the appropriate customer label value.

## ResourceQuota

Each namespace has a ResourceQuota that prevents a single customer from consuming excessive cluster resources. The values below are for the `royal-bank` namespace; adjust for other customers according to their contract:

```
apiVersion: v1
kind: ResourceQuota
metadata:
  name: royal-bank-quota
  namespace: royal-bank
spec:
  hard:
    requests.cpu: "40"
    requests.memory: 80Gi
    limits.cpu: "80"
    limits.memory: 160Gi
    persistentvolumeclaims: "50"
    services.loadbalancers: "5"
    pods: "200"
```

Mr. Bent reviews the quota figures at each quarterly audit. If a customer reports pods being rejected due to quota, check the quota status before assuming there is a scheduling problem:

```
kubectl describe resourcequota royal-bank-quota -n royal-bank
```

## LimitRange for default resource limits

Even with Gatekeeper enforcing that resource limits are set, a LimitRange provides sensible defaults for any case where a developer forgets (Gatekeeper will catch the deployment, but the LimitRange acts as a backstop during the remediation window):

```
apiVersion: v1
kind: LimitRange
metadata:
  name: royal-bank-limits
  namespace: royal-bank
spec:
  limits:
    - type: Container
      default:
        cpu: "500m"
        memory: 512Mi
      defaultRequest:
        cpu: "100m"
        memory: 128Mi
      max:
        cpu: "4"
        memory: 8Gi
      min:
        cpu: "50m"
        memory: 64Mi
```

## NetworkPolicy for namespace isolation

Apply the default-deny policy first (see the calico-deployment runbook), then add explicit allow rules only for traffic that is required. The following example permits the `royal-bank` namespace to reach the shared `platform` namespace for log shipping and metrics scraping only:

```
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-to-platform
  namespace: royal-bank
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              golemtrust.am/customer: platform
      ports:
        - protocol: TCP
          port: 5044
        - protocol: TCP
          port: 9091
```

Traffic between `royal-bank` and `patricians-office` is denied by default and there is no allow rule for it. This is intentional. If a developer requests such a policy, escalate to Adora Belle before creating it.

## RBAC: customer-scoped service accounts

Each customer namespace gets its own service account with permissions scoped to that namespace. No cluster-wide roles are granted:

```
apiVersion: v1
kind: ServiceAccount
metadata:
  name: royal-bank-deployer
  namespace: royal-bank
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: royal-bank-deployer-role
  namespace: royal-bank
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: royal-bank-deployer-binding
  namespace: royal-bank
subjects:
  - kind: ServiceAccount
    name: royal-bank-deployer
    namespace: royal-bank
roleRef:
  kind: Role
  name: royal-bank-deployer-role
  apiGroup: rbac.authorization.k8s.io
```

Customer CI/CD pipelines use this service account token. They cannot read resources from other namespaces, cannot create cluster-scoped resources, and cannot modify RBAC itself.

## Verifying isolation

Carrot's post-provisioning checklist:

```
# Confirm quota is in place
kubectl get resourcequota -n royal-bank

# Confirm default-deny NetworkPolicy exists
kubectl get networkpolicy default-deny-all -n royal-bank

# Confirm pod security standard is enforced
kubectl get namespace royal-bank -o jsonpath='{.metadata.labels}' | jq .

# Attempt cross-namespace service account access (should be denied)
kubectl auth can-i get pods -n patricians-office \
  --as system:serviceaccount:royal-bank:royal-bank-deployer
```

The last command must return `no`. If it returns `yes`, there is an unintended ClusterRole or ClusterRoleBinding that needs to be removed immediately and logged as a security incident.
Last updated: 20 March 2026
