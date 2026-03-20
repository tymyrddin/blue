# Control plane HA configuration

A single-node control plane is the sort of thing Ponder used to argue was "good enough." After the first time a control plane node needed rebooting during the merchants-guild deployment window, Ludmilla's three-node HA design stopped being optional. Each Golem Trust cluster runs three control plane nodes using stacked etcd topology, meaning etcd runs on the same machines as the API server, controller manager, and scheduler. A Hetzner load balancer distributes traffic to the API server. kube-vip provides a virtual IP for in-cluster components. This runbook covers the HA configuration, etcd health monitoring, and the backup procedure that Cheery runs automatically every six hours.

## Stacked etcd topology

In stacked etcd topology, each control plane node runs its own etcd member. kubeadm configures this automatically when `--control-plane-endpoint` is provided at init time (see the cluster-setup runbook). The result is a three-member etcd cluster with quorum requiring two of three members to be healthy.

To inspect the etcd cluster membership after setup:

```
kubectl exec -n kube-system etcd-<region>-cp-01 -- \
  etcdctl \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key \
    member list
```

All three members should appear with status `started`. If one shows `unstarted`, the kubelet on that node has likely not fully initialised the static pod yet.

## Hetzner load balancer configuration

The Hetzner load balancer is configured via the Hetzner Cloud console or API. It should have:

- A TCP listener on port 6443
- Health checks on TCP port 6443
- All three control plane nodes as targets
- Algorithm: round-robin

The load balancer IP is used as `--control-plane-endpoint` in kubeadm. It must be stable (use the reserved IP feature in Hetzner, not the auto-assigned floating IP).

## kube-vip for virtual IP

kube-vip provides a virtual IP that floats between control plane nodes for in-cluster API access, independent of the Hetzner load balancer. Deploy it as a static pod on each control plane node.

Generate the kube-vip static pod manifest on the first control plane node:

```
export VIP=<VIRTUAL_IP_ADDRESS>
export INTERFACE=eth0

docker run --network host --rm \
  ghcr.io/kube-vip/kube-vip:v0.7.0 \
  manifest pod \
    --interface $INTERFACE \
    --address $VIP \
    --controlplane \
    --services \
    --arp \
    --leaderElection \
  | tee /etc/kubernetes/manifests/kube-vip.yaml
```

Copy the resulting manifest to `/etc/kubernetes/manifests/kube-vip.yaml` on the other two control plane nodes before running `kubeadm join` for those nodes.

## etcd health monitoring

Prometheus scrapes etcd metrics from each control plane node on port 2381. The following alerts are configured in the golem-trust-alerts PrometheusRule:

```
- alert: EtcdMemberDown
  expr: up{job="etcd"} == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "etcd member {{ $labels.instance }} is down"

- alert: EtcdHighFsyncDuration
  expr: histogram_quantile(0.99, rate(etcd_disk_wal_fsync_duration_seconds_bucket[5m])) > 0.5
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "etcd WAL fsync p99 exceeds 500ms on {{ $labels.instance }}"

- alert: EtcdDatabaseSizeExceeding
  expr: etcd_mvcc_db_total_size_in_bytes > 6e+09
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "etcd database approaching 8GB limit on {{ $labels.instance }}"
```

Otto Chriek receives the PagerDuty alert for `EtcdMemberDown` outside business hours; during the day it goes to the on-call engineer first.

## etcd backup to Hetzner Object Storage

Cheery's backup script runs as a CronJob in the `kube-system` namespace every six hours. It uses `etcdctl snapshot save` and uploads the result to a Hetzner Object Storage bucket using the S3-compatible API.

```
apiVersion: batch/v1
kind: CronJob
metadata:
  name: etcd-backup
  namespace: kube-system
spec:
  schedule: "0 */6 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          hostNetwork: true
          nodeSelector:
            node-role.kubernetes.io/control-plane: ""
          tolerations:
            - key: node-role.kubernetes.io/control-plane
              effect: NoSchedule
          containers:
            - name: etcd-backup
              image: registry.golemtrust.am/infra/etcd-backup:latest
              env:
                - name: ETCDCTL_API
                  value: "3"
                - name: S3_BUCKET
                  value: golem-trust-etcd-backups
                - name: S3_ENDPOINT
                  value: https://nbg1.your-objectstorage.com
              volumeMounts:
                - name: etcd-certs
                  mountPath: /etc/kubernetes/pki/etcd
                  readOnly: true
          restartPolicy: OnFailure
          volumes:
            - name: etcd-certs
              hostPath:
                path: /etc/kubernetes/pki/etcd
```

## Restoring etcd from backup

If etcd data is lost or corrupted, restore from the most recent backup. This is a disruptive operation; coordinate with Adora Belle before proceeding.

```
# Stop kube-apiserver on all control plane nodes by moving the static pod manifest
mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/

# Restore snapshot
etcdctl snapshot restore /path/to/snapshot.db \
  --data-dir /var/lib/etcd-restore \
  --initial-cluster <cluster-init-string> \
  --initial-advertise-peer-urls https://<THIS_NODE_IP>:2380 \
  --name <THIS_NODE_NAME>

# Replace etcd data directory
mv /var/lib/etcd /var/lib/etcd.bak
mv /var/lib/etcd-restore /var/lib/etcd

# Restore kube-apiserver manifest
mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/
```

Repeat the restore procedure on all three control plane nodes before restarting any of them, using consistent snapshot data and the correct `--initial-cluster` string for all three members. Mr. Bent has requested that every restore operation is logged in the change management register with timestamps.
