# Kubernetes troubleshooting

Ponder once said that Kubernetes makes the easy things easy and the hard things inscrutably difficult. He was not wrong, but after working through enough failures Ludmilla's team has catalogued the common ones. Most production incidents at Golem Trust fall into a small set of categories: pods that will not start, nodes that go unhealthy, network policies that silently drop traffic, and etcd that accumulates too much history. This runbook covers the diagnostic approach for each, along with the specific commands that Cheery has verified actually work on the Golem Trust cluster configuration.

## CrashLoopBackOff

A pod in `CrashLoopBackOff` has started, failed, and is being restarted repeatedly. The kubelet backs off the restart interval exponentially, up to five minutes between attempts.

```
# Get the current state and recent events
kubectl describe pod <POD_NAME> -n <NAMESPACE>

# Read logs from the current (failing) container
kubectl logs <POD_NAME> -n <NAMESPACE>

# Read logs from the previous crashed container
kubectl logs <POD_NAME> -n <NAMESPACE> --previous
```

Common causes: the application process exits immediately due to a missing environment variable or misconfigured secret; the container command is wrong; the application fails its own startup validation. The `--previous` flag is essential; without it you are reading logs from the current (possibly just-started) container rather than the one that crashed.

## OOMKilled

A pod with exit code 137 was killed by the Linux kernel's out-of-memory killer because it exceeded its memory limit.

```
kubectl describe pod <POD_NAME> -n <NAMESPACE> | grep -A5 "OOMKilled\|Last State"
```

Short-term fix: raise the memory limit in the Deployment spec. Long-term fix: profile the application's actual memory usage and set the limit to 1.5x the p99 resident set size under production load. Ludmilla keeps a spreadsheet of actual versus requested memory for all customer workloads; check it before raising limits blindly, as the `merchants-guild` namespace has been close to its ResourceQuota ceiling.

## ImagePullBackOff

The kubelet cannot pull the container image. Check the pod events:

```
kubectl describe pod <POD_NAME> -n <NAMESPACE> | grep -A10 Events
```

Common causes:

- Image tag does not exist in the registry (a typo, or a CI pipeline that failed to push)
- The image is from an unapproved registry (Gatekeeper will block the pod at admission, but occasionally a policy gap allows it through and the image is simply absent)
- The node cannot reach the registry (network policy or firewall issue)

```
# Verify the image exists
crane digest registry.golemtrust.am/<IMAGE>:<TAG>

# Check if the node can reach the registry
kubectl debug node/<NODE_NAME> -it --image=nicolaka/netshoot -- curl -I https://registry.golemtrust.am/v2/
```

## Node NotReady

```
# Check node conditions
kubectl describe node <NODE_NAME> | grep -A20 Conditions

# Check kubelet status on the node itself
ssh <NODE_IP> journalctl -u kubelet -n 100

# Check available disk space and memory
kubectl top node <NODE_NAME>
ssh <NODE_IP> df -h && free -h
```

The most common cause in Golem Trust's clusters is disk pressure on the node's root filesystem caused by accumulated container image layers. The kubelet's image garbage collection should handle this automatically, but if the filesystem fills faster than GC can run, kubelet sets the node to `DiskPressure` and eventually `NotReady`.

## Diagnosing Gatekeeper admission rejections

When a developer reports that their `kubectl apply` returns a policy violation error:

```
# The error message will name the constraint; get its current violations
kubectl describe <CONSTRAINT_KIND> <CONSTRAINT_NAME>

# For example
kubectl describe k8srequirenonroot require-non-root-containers
```

The violation message will specify which field is missing or incorrect. Direct the developer to the relevant section of the security configuration guide. Do not disable or relax the policy; Dr. Crucible and Adora Belle must approve any policy exceptions, and they are granted as namespace-scoped exclusions on the Constraint resource, not as policy relaxations.

## Calico network policy debugging

When a service cannot reach another service and a NetworkPolicy is suspected:

```
# Check which policies apply to the source pod
calicoctl get networkpolicy -n <NAMESPACE> -o wide

# Enable temporary packet capture on a Calico node
# (requires host network access, coordinate with Ludmilla)
kubectl debug node/<NODE_NAME> -it --image=nicolaka/netshoot -- \
  tcpdump -i any host <POD_IP> -n

# Check Felix's deny log (requires debug log level to be enabled first)
kubectl set env daemonset/calico-node -n calico-system FELIX_LOGSEVERITYSCREEN=debug
kubectl logs -n calico-system -l k8s-app=calico-node -c calico-node | grep "DENY\|DROP"
# Remember to revert the log level afterwards
```

## etcd compaction and disk pressure

etcd retains all historical revisions by default, which causes the database to grow without bound. Kubernetes runs etcd compaction automatically, but if the cluster was heavily loaded during a period when compaction was delayed, manual compaction may be needed:

```
# Check current database size
kubectl exec -n kube-system etcd-<region>-cp-01 -- \
  etcdctl \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key \
    endpoint status --write-out=table

# Compact to current revision
REV=$(kubectl exec -n kube-system etcd-<region>-cp-01 -- \
  etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key \
    endpoint status --write-out=json | jq '.[0].Status.header.revision')

etcdctl compact $REV
etcdctl defrag
```

## Node drain and cordon

Before any maintenance on a worker node (OS patching, hardware work, CSI driver upgrade):

```
# Prevent new pods from scheduling on the node
kubectl cordon <NODE_NAME>

# Evict all pods gracefully (respects PodDisruptionBudgets)
kubectl drain <NODE_NAME> \
  --ignore-daemonsets \
  --delete-emptydir-data \
  --grace-period=60

# After maintenance, return the node to service
kubectl uncordon <NODE_NAME>
```

Never drain more than one node at a time in the same cluster without verifying that PodDisruptionBudgets permit it. Sam Vimes Jr. once drained three nodes simultaneously and lost quorum on a customer's Kafka deployment. The `merchants-guild` namespace still has a Jira ticket open about it.
Last updated: 20 March 2026
