# Certificate management

Istio's built-in CA (historically called Citadel, now part of Istiod) handles workload certificate issuance automatically. For most workloads this is sufficient: Istiod is the root of trust, certificates rotate every 24 hours, and no engineer needs to touch a certificate under normal operation. However, the Royal Bank's security requirements include that all TLS certificates must chain to a certificate authority that the bank's own audit team can inspect and verify. This means plugging an external CA into Istio via Vault PKI, with cert-manager managing the integration. Dr. Crucible and Adora Belle negotiated this architecture; this runbook documents how it is configured, monitored, and how to recover from certificate-related failures.

## Istio's Citadel CA

By default, Istiod acts as a self-signed root CA. It issues short-lived X.509 certificates to workloads, rotates them automatically, and maintains a certificate chain that all proxies trust. The default TTL is 24 hours, configurable via the `proxyConfig.proxyMetadata.SECRET_TTL` mesh configuration value.

To inspect the Istiod CA certificate:

```
kubectl get secret istio-ca-secret -n istio-system -o jsonpath='{.data.ca-cert\.pem}' \
  | base64 -d | openssl x509 -noout -text
```

## Plugging in an external CA via Vault PKI

Replace Istiod's self-signed CA with an intermediate CA issued by Vault. This gives the Royal Bank a certificate chain that terminates at a root CA they control.

Create the `cacerts` secret that Istiod reads at startup:

```
kubectl create secret generic cacerts \
  -n istio-system \
  --from-file=ca-cert.pem=<PATH_TO_INTERMEDIATE_CERT> \
  --from-file=ca-key.pem=<PATH_TO_INTERMEDIATE_KEY> \
  --from-file=root-cert.pem=<PATH_TO_ROOT_CERT> \
  --from-file=cert-chain.pem=<PATH_TO_CERT_CHAIN>
```

Restart Istiod to pick up the new CA material:

```
kubectl rollout restart deployment/istiod -n istio-system
```

All existing workload certificates are still valid until they expire. New certificates issued after the restart will chain to the Vault-issued intermediate CA.

## cert-manager integration

cert-manager manages the renewal of the intermediate CA certificate itself. It requests a new intermediate certificate from Vault PKI before expiry and updates the `cacerts` secret, triggering an Istiod restart via a custom controller.

The `Certificate` resource for the intermediate CA:

```
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: istio-ca
  namespace: istio-system
spec:
  secretName: cacerts
  duration: 720h
  renewBefore: 168h
  isCA: true
  subject:
    organisations:
      - Golem Trust
    countries:
      - AM
  commonName: Golem Trust Istio CA
  issuerRef:
    name: vault-issuer
    kind: ClusterIssuer
    group: cert-manager.io
```

The intermediate CA renews every 30 days, with a 7-day advance renewal window. cert-manager handles this automatically; engineers are only involved if a Prometheus alert fires indicating the renewal failed.

## Certificate TTL configuration

Workload certificate TTL is controlled in the mesh configuration:

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio
  namespace: istio-system
data:
  mesh: |
    defaultConfig:
      proxyMetadata:
        SECRET_TTL: 86400s
        SECRET_GRACE_PERIOD_RATIO: "0.5"
```

The `SECRET_GRACE_PERIOD_RATIO` of 0.5 means Envoy requests a new certificate when the current one is halfway through its TTL (at 12 hours), well before expiry.

## Monitoring certificate expiry

Prometheus tracks certificate issuance via the `citadel_server_csr_count` metric and certificate expiry via proxy secret metrics. The following alert fires if Istiod is failing to issue certificates:

```
- alert: IstioCertificateIssuanceFailure
  expr: increase(citadel_server_csr_count{error!=""}[5m]) > 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Istio CA is failing to issue certificates"

- alert: IstioProxyCertificateExpiringSoon
  expr: (envoy_server_days_until_first_cert_expiring < 2) > 0
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Envoy proxy on {{ $labels.pod }} has a certificate expiring within 48 hours"
```

Otto Chriek receives the critical alert outside business hours.

## Manual certificate rotation

Under normal operation, certificate rotation is automatic and requires no intervention. If a workload's certificate needs to be rotated manually (for example, following a compromise), delete the Envoy secret and the proxy will request a new one:

```
# Force certificate regeneration for a specific pod
kubectl delete secret -n <NAMESPACE> <POD_NAME>-istio-proxy-tls
kubectl rollout restart deployment/<DEPLOYMENT_NAME> -n <NAMESPACE>
```

## Root CA rotation

Rotating the root CA is a disruptive operation that requires coordination across all clusters. The procedure requires running both the old and new root CAs simultaneously for a period sufficient for all workload certificates (issued under the old CA) to have been rotated to the new CA. This window is at minimum 24 hours.

The full root CA rotation procedure is documented separately in the security operations runbook (rootca-rotation.md). Do not attempt root CA rotation without scheduling a maintenance window, notifying Adora Belle, and having Ponder available for the duration. Dr. Crucible has a printed copy of the procedure on his desk for the occasion when it is needed and the documentation system is unreachable.
Last updated: 20 March 2026
