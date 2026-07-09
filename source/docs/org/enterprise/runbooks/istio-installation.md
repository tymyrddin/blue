# Istio installation

Mr. Bent's audit question, "how do services authenticate to each other?", is what prompted the service mesh project. Ludmilla and Dr. Crucible deployed Istio across all three clusters to answer that question with something more satisfying than silence. Every pod gets an Envoy sidecar proxy; all traffic between services goes through those proxies; mutual TLS is automatic. This runbook covers the Istio installation procedure using `istioctl`, sidecar injection configuration, and the differences between running a shared control plane across clusters versus a per-cluster Istiod instance. Golem Trust runs one Istiod per cluster, which simplifies failure isolation at the cost of some resource overhead.

## Prerequisites

Verify the Kubernetes version is compatible with the Istio version being installed. Istio maintains a support table in its release notes; as of the current deployment, Istio 1.20.x supports Kubernetes 1.26 through 1.29.

Download `istioctl` from the official release page and verify the checksum:

```
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.20.0 sh -
export PATH=$PATH:./istio-1.20.0/bin
istioctl version
```

## IstioOperator profile selection

Istio ships several installation profiles. Golem Trust uses the `default` profile, which installs Istiod and the ingress gateway. The `minimal` profile installs only Istiod (no ingress gateway) and is used in clusters where ingress is handled separately. The `demo` profile is not used in production.

```
# Inspect what the default profile installs
istioctl profile dump default
```

## Installation via IstioOperator

Create an `IstioOperator` manifest that customises the default profile for Golem Trust's resource requirements:

```
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: golemtrust-control-plane
spec:
  profile: default
  components:
    pilot:
      k8s:
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: "2"
            memory: 4Gi
        hpaSpec:
          minReplicas: 2
          maxReplicas: 5
  meshConfig:
    defaultConfig:
      proxyMetadata:
        BOOTSTRAP_XDS_AGENT: "true"
    accessLogFile: /dev/stdout
    enableTracing: true
    defaultProviders:
      tracing:
        - jaeger
  values:
    global:
      meshID: golemtrust-mesh
      multiCluster:
        clusterName: <CLUSTER_NAME>
      network: <CLUSTER_NETWORK>
```

Apply the installation:

```
istioctl install -f golemtrust-istio.yaml --verify
```

Verify that Istiod and the ingress gateway are running:

```
kubectl get pods -n istio-system
istioctl verify-install
```

## Enabling sidecar injection per namespace

Sidecar injection is controlled by a namespace label. Add the label to any namespace that should have Envoy proxies injected into its pods:

```
kubectl label namespace royal-bank istio-injection=enabled
kubectl label namespace patricians-office istio-injection=enabled
kubectl label namespace merchants-guild istio-injection=enabled
```

Injection only applies to pods created after the label is set. Existing pods must be restarted to gain a sidecar. Rolling restart a deployment:

```
kubectl rollout restart deployment -n royal-bank
```

Do not restart all deployments simultaneously. Stagger restarts by customer namespace to avoid a simultaneous disruption across all workloads.

## Verifying proxy injection

```
# Check that pods have two containers (the application + the istio-proxy sidecar)
kubectl get pods -n royal-bank -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .spec.containers[*]}{.name}{","}{end}{"\n"}{end}'

# Verify the proxy version matches Istiod
istioctl proxy-status

# Check the proxy configuration for a specific pod
istioctl proxy-config cluster <POD_NAME> -n royal-bank
```

## Sidecar resource requirements

Each Envoy sidecar consumes resources that must be accounted for in the namespace ResourceQuota. Default sidecar resource settings in Golem Trust's deployment:

```
requests:
  cpu: 100m
  memory: 128Mi
limits:
  cpu: 500m
  memory: 256Mi
```

These are set via the `meshConfig.defaultConfig.proxyMetadata` or via a `ProxyConfig` resource. If the `merchants-guild` namespace approaches its quota ceiling, review whether the sidecar limits are the cause before raising the quota; Dr. Crucible has found that the default limits are more conservative than necessary for low-traffic workloads.

## Upgrading Istio

Istio supports in-place upgrades via `istioctl upgrade`. For production clusters, use canary upgrades: install the new Istiod version alongside the old one, migrate namespaces one at a time, then remove the old version.

```
# Install new version alongside existing
istioctl install -f golemtrust-istio.yaml --set revision=1-21

# Migrate a namespace to the new version
kubectl label namespace royal-bank \
  istio.io/rev=1-21 \
  istio-injection-

# Restart pods to pick up the new sidecar
kubectl rollout restart deployment -n royal-bank

# Once all namespaces are migrated, remove the old control plane
istioctl uninstall --revision default
```

Ponder keeps a runbook checklist on the team wiki for each Istio upgrade, including the rollback procedure, which is simply relabelling the namespace back to the previous revision.
Last updated: 20 March 2026
