# Kubernetes cluster setup

Golem Trust operates three Kubernetes clusters: one in Hetzner's Helsinki region (hel1), one spanning Nuremberg and Falkenstein (nbg1/fsn1) in Germany, and a third in Finland. Ludmilla designed this layout so that no single Hetzner region failure could take down all customer workloads simultaneously. The Royal Bank of Ankh-Morpork insisted on at least two geographically separated environments; the Patrician's Office insisted on a third. This runbook covers the kubeadm-based installation procedure used to build and rebuild clusters, from bare Hetzner instances to a fully joined, production-ready cluster.

## Prerequisites

Each cluster requires:

- Three CX32 control plane nodes (4 vCPU, 8 GB RAM) in separate Hetzner availability zones within the region
- Ten CX42 worker nodes (8 vCPU, 16 GB RAM) as the initial pool; auto-scaling is configured between 5 and 20 nodes
- A Hetzner load balancer fronting the kube-apiserver on port 6443
- Private networking enabled across all nodes
- The Hetzner CSI driver for persistent volume provisioning

All nodes should be running Ubuntu 22.04 LTS. Assign hostnames following the convention `<region>-cp-01`, `<region>-cp-02`, `<region>-cp-03` for control plane nodes and `<region>-worker-01` through `<region>-worker-10` for workers.

## Prepare all nodes

Run the following on every node (control plane and workers) before running kubeadm:

```
# Disable swap
swapoff -a
sed -i '/swap/d' /etc/fstab

# Load required kernel modules
cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
modprobe overlay
modprobe br_netfilter

# Sysctl settings required by Kubernetes
cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sysctl --system

# Install containerd
apt-get update
apt-get install -y containerd
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
systemctl restart containerd

# Install kubeadm, kubelet, kubectl
apt-get install -y apt-transport-https ca-certificates curl
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key \
  | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' \
  | tee /etc/apt/sources.list.d/kubernetes.list
apt-get update
apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl
```

## Initialise the first control plane node

Replace `<LOAD_BALANCER_IP>` with the IP address of the Hetzner load balancer created for this cluster. Replace `<POD_CIDR>` with the cluster-specific CIDR assigned by Ludmilla (see the CIDR allocation table in Confluence; CIDRs must not overlap between clusters for multi-cluster routing to work correctly).

```
kubeadm init \
  --control-plane-endpoint "<LOAD_BALANCER_IP>:6443" \
  --upload-certs \
  --pod-network-cidr=<POD_CIDR> \
  --apiserver-advertise-address=<THIS_NODE_PRIVATE_IP>
```

Save the output. It contains the join commands for additional control plane nodes and for worker nodes, along with the certificate key. The certificate key is valid for two hours; if joining takes longer, regenerate it with `kubeadm init phase upload-certs --upload-certs`.

## Join the remaining control plane nodes

On each of `<region>-cp-02` and `<region>-cp-03`:

```
kubeadm join <LOAD_BALANCER_IP>:6443 \
  --token <TOKEN> \
  --discovery-token-ca-cert-hash sha256:<HASH> \
  --control-plane \
  --certificate-key <CERT_KEY> \
  --apiserver-advertise-address=<THIS_NODE_PRIVATE_IP>
```

## Join worker nodes

On each worker node, run the worker join command from the kubeadm init output:

```
kubeadm join <LOAD_BALANCER_IP>:6443 \
  --token <TOKEN> \
  --discovery-token-ca-cert-hash sha256:<HASH>
```

Label worker nodes after joining so that workloads schedule correctly and the cluster autoscaler can identify them:

```
kubectl label node <region>-worker-01 node-role.kubernetes.io/worker=worker
```

## Distribute kubeconfig

The cluster kubeconfig lives in `/etc/kubernetes/admin.conf` on the first control plane node. Copy it to the operator workstation and merge it into `~/.kube/config`. Rename the context to match the cluster name before merging to avoid collisions between the three clusters:

```
# On the control plane node
cat /etc/kubernetes/admin.conf

# On the operator workstation
KUBECONFIG=~/.kube/config:~/downloads/new-cluster.yaml \
  kubectl config view --flatten > ~/.kube/config.merged
mv ~/.kube/config.merged ~/.kube/config
```

## Install the Hetzner CSI driver

The CSI driver requires a Hetzner API token scoped to the project. Store it as a secret in the `kube-system` namespace:

```
kubectl create secret generic hcloud \
  -n kube-system \
  --from-literal=token=<HETZNER_API_TOKEN>

kubectl apply -f https://raw.githubusercontent.com/hetznercloud/csi-driver/main/deploy/kubernetes/hcloud-csi.yml
```

Verify the driver is running and that the `hcloud-volumes` StorageClass was created:

```
kubectl get pods -n kube-system | grep hcloud
kubectl get storageclass
```

## Verify cluster health

```
kubectl get nodes -o wide
kubectl get pods -A | grep -v Running | grep -v Completed
kubectl get componentstatuses
```

All control plane nodes should be `Ready`. Ponder's standing instruction: if any node shows `NotReady` for more than three minutes after setup, check `journalctl -u kubelet` on that node before proceeding. Dr. Crucible keeps a dedicated channel in the team's messaging system for cluster bootstrap failures.
Last updated: 20 March 2026
