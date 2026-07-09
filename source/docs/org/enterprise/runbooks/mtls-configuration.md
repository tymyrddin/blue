# mTLS configuration

Mutual TLS is the mechanism by which Golem Trust services prove their identity to one another. Without it, a compromised service inside the cluster could impersonate any other service, as Mr. Bent pointed out in terms that left Ponder unusually quiet for several minutes. With Istio's automatic mTLS, every workload receives an X.509 certificate encoding a SPIFFE identity (for example, `spiffe://cluster.local/ns/royal-bank/sa/banking-api`), and all service-to-service traffic is authenticated and encrypted without any application code changes. This runbook covers the cluster-wide STRICT mode configuration, certificate issuance mechanics, rotation, and how to diagnose a mTLS handshake failure.

## Cluster-wide STRICT mode

Istio supports three mTLS modes: `PERMISSIVE` (accepts both plaintext and mTLS), `STRICT` (requires mTLS), and `DISABLE`. Golem Trust runs `STRICT` on all customer namespaces. The platform namespace runs `PERMISSIVE` during migration windows only; it reverts to `STRICT` once all workloads have sidecars.

Apply a `PeerAuthentication` resource at the mesh level to set the default:

```
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
```

This applies to all namespaces in the mesh. To verify it is in effect:

```
kubectl get peerauthentication -A
```

## How Istio issues workload certificates

When a pod with an Envoy sidecar starts, the sidecar agent sends a Certificate Signing Request to Istiod's CA. The CSR includes the pod's Kubernetes service account token, which Istiod validates against the Kubernetes API server. If valid, Istiod issues an X.509 certificate with the SPIFFE URI `spiffe://cluster.local/ns/<NAMESPACE>/sa/<SERVICE_ACCOUNT>` in the Subject Alternative Name field. The certificate has a 24-hour TTL and is rotated automatically before expiry.

This means no engineer ever manually manages a workload certificate. The certificate rotation every 24 hours limits the blast radius of a compromised certificate to at most one day, which was one of the explicit requirements from Mr. Bent's zero-trust review.

## Verifying mTLS between services

```
# Check the mTLS status of all workloads in a namespace
istioctl authn tls-check <POD_NAME>.<NAMESPACE>

# Check mTLS status for a specific destination
istioctl authn tls-check <POD_NAME>.<NAMESPACE> <DESTINATION_SERVICE>.<DESTINATION_NAMESPACE>.svc.cluster.local

# Inspect the certificate a proxy is currently using
istioctl proxy-config secret <POD_NAME> -n <NAMESPACE>

# Show the SPIFFE identity in the certificate
istioctl proxy-config secret <POD_NAME> -n <NAMESPACE> -o json \
  | jq -r '.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' \
  | base64 -d | openssl x509 -noout -text | grep URI
```

The URI SAN must match the expected SPIFFE identity for the service account.

## Permissive mode for migration

When migrating a workload into the mesh, it briefly has no sidecar (between when the namespace label is applied and when the pod is restarted). During this window, `STRICT` mode will cause traffic to the un-sidecarred pods to fail. Use `PERMISSIVE` mode scoped to the specific workload during migration:

```
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: banking-api-migration
  namespace: royal-bank
spec:
  selector:
    matchLabels:
      app: banking-api
  mtls:
    mode: PERMISSIVE
```

Delete this resource immediately once the pod has been restarted with the sidecar. Do not leave `PERMISSIVE` resources in place after migration; Angua runs a weekly audit that flags any `PERMISSIVE` policy that has been in place for more than seven days.

## Diagnosing mTLS handshake failures

When a service reports connection errors that may be related to mTLS, the sidecar proxy logs are the first place to look:

```
# Enable debug logging on the proxy temporarily
istioctl proxy-config log <POD_NAME> -n <NAMESPACE> --level tls:debug

# Read the proxy logs
kubectl logs <POD_NAME> -n <NAMESPACE> -c istio-proxy | grep -i "tls\|handshake\|ssl"

# Revert log level
istioctl proxy-config log <POD_NAME> -n <NAMESPACE> --level tls:warning
```

Common causes of mTLS failures:

- Source service has a sidecar but destination does not (destination pod not restarted after label was applied). Solution: restart the destination deployment.
- Destination namespace is set to `STRICT` but source is in a namespace without a sidecar. Solution: either inject the sidecar into the source namespace or use a `PeerAuthentication` exception scoped to the destination workload.
- Certificate has expired due to Istiod being unavailable for more than 24 hours. Check Istiod health: `kubectl get pods -n istio-system`. A certificate that cannot be renewed will cause the proxy to reject traffic.
- Source and destination are in different clusters and cross-cluster trust has not been configured. See Ludmilla's multi-cluster trust configuration notes in the team wiki.

Dr. Crucible maintains a Grafana dashboard (Golem Trust / mTLS Health) that shows the percentage of cluster traffic currently encrypted with mTLS. It should be at 100% for `royal-bank` and `patricians-office` at all times.
Last updated: 20 March 2026
