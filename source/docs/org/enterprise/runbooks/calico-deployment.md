# Calico deployment

Calico handles all pod networking across Golem Trust's three clusters. Ludmilla chose Calico specifically for its network policy support, which is considerably richer than the basic Kubernetes NetworkPolicy API. Every namespace runs under a default-deny policy; workloads must explicitly declare what traffic they will accept and originate. This is not optional: the Royal Bank's tenancy agreement requires network-level isolation between the `royal-bank` namespace and every other customer namespace, and Calico is the mechanism that enforces this. This runbook covers the Calico operator installation, CIDR allocation, BGP versus VXLAN mode selection, and the procedure for verifying that pod isolation is actually working.

## CIDR allocation per cluster

Pod CIDRs must not overlap between clusters. The current allocation is:

```
finland-cluster:   10.244.0.0/16
germany-cluster:   10.245.0.0/16
helsinki-cluster:  10.246.0.0/16
```

Service CIDRs follow the same pattern:

```
finland-cluster:   10.96.0.0/16
germany-cluster:   10.97.0.0/16
helsinki-cluster:  10.98.0.0/16
```

These ranges are recorded in the network allocation register. Do not deviate from them; overlapping CIDRs cause routing failures in the VPN tunnels that connect the clusters.

## Install Calico via the Tigera operator

Install the Tigera operator first, then apply an Installation resource that configures Calico for the cluster:

```
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/tigera-operator.yaml
```

Create the Installation resource. Replace `<POD_CIDR>` with this cluster's allocated range from the table above:

```
apiVersion: operator.tigera.io/v1
kind: Installation
metadata:
  name: default
spec:
  calicoNetwork:
    ipPools:
      - blockSize: 26
        cidr: <POD_CIDR>
        encapsulation: VXLAN
        natOutgoing: Enabled
        nodeSelector: all()
```

Apply it:

```
kubectl create -f calico-installation.yaml
```

Wait for all Calico pods to reach `Running` state:

```
kubectl get pods -n calico-system --watch
```

## BGP mode versus VXLAN mode

Golem Trust runs VXLAN encapsulation by default on all three clusters. BGP mode would offer lower overhead but requires the Hetzner network to carry BGP routes, which is not supported without additional configuration at the hypervisor level. VXLAN adds approximately 50 bytes of overhead per packet and a small CPU cost for encapsulation and decapsulation. For Golem Trust's traffic volumes this is not a concern; Dr. Crucible benchmarked it at under 0.5% CPU on worker nodes at peak load.

If a future cluster is deployed in an environment where BGP is available (for example, a co-location facility with a proper network fabric), change the `encapsulation` field in the Installation resource to `None` and configure the BGP peer resources accordingly.

## Apply default-deny NetworkPolicy

Apply a default-deny policy to every namespace immediately after creating it. This is enforced by a Gatekeeper policy (see the gatekeeper-policies runbook), but the NetworkPolicy itself must still be present:

```
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: <NAMESPACE>
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

A Helm chart in the golem-trust/infra repository applies this policy automatically when a new namespace is provisioned. Do not rely on manual application.

## Calico network policy for cross-namespace communication

Where services in different namespaces must communicate (for example, the `royal-bank` namespace consuming a shared logging service in the `platform` namespace), use a Calico `NetworkPolicy` with namespace selectors rather than a plain Kubernetes NetworkPolicy. Calico's own CRDs support richer matching:

```
apiVersion: projectcalico.org/v3
kind: NetworkPolicy
metadata:
  name: allow-platform-logging
  namespace: royal-bank
spec:
  selector: all()
  egress:
    - action: Allow
      destination:
        namespaceSelector: name == "platform"
        selector: app == "log-collector"
      ports:
        - protocol: TCP
          port: 5044
```

## Verify pod isolation

After applying default-deny policies, verify that isolation is working before handing a namespace to a customer. Carrot's standard procedure is to deploy two test pods in separate namespaces and confirm that traffic is blocked:

```
# Deploy a netcat listener in namespace-a
kubectl run test-server -n namespace-a --image=nicolaka/netshoot -- nc -lk 8080

# Attempt connection from namespace-b (should time out)
kubectl run test-client -n namespace-b --image=nicolaka/netshoot --rm -it -- \
  nc -zv test-server.namespace-a.svc.cluster.local 8080
```

The connection attempt from `namespace-b` must time out. If it succeeds, the NetworkPolicy is not correctly applied. Check that the default-deny policy exists in both namespaces and that there is no erroneous allow rule.

## Debugging Calico policy drops

When a developer reports that their service cannot reach another service and they believe there should be a policy permitting it, use the Calico policy viewer:

```
calicoctl get networkpolicy -n <NAMESPACE> -o yaml

# Check effective policy on a specific pod
calicoctl get workloadendpoint -n <NAMESPACE>

# View Felix logs for policy enforcement decisions
kubectl logs -n calico-system -l app=calico-node -c calico-node | grep -i deny
```

Ponder has a standing request that all new NetworkPolicy changes go through a pull request review before being applied to production namespaces. This caught three misconfigured policies in the first month after the migration.
