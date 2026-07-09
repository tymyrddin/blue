# Performance tuning

The 2-3ms per-hop overhead from Envoy proxies was measured by Dr. Crucible during the initial Istio rollout, using a controlled benchmark comparing direct pod-to-pod traffic against traffic routed through sidecars. For most services this overhead is negligible. For the Royal Bank's transaction processing pipeline, which chains six service calls to process a payment, it means up to 18ms of added latency per transaction. The bank's SLA has a 200ms p99 requirement; 18ms is within tolerance, but it leaves less headroom than Ludmilla would prefer. This runbook covers the tuning options available, from Envoy resource limits through connection pool settings to the decision of whether a service should be excluded from the mesh entirely.

## Measured baseline overhead

Dr. Crucible's benchmark results (recorded in the performance test report, December 2024):

- Envoy sidecar overhead per hop: 2-3ms at p50, 4-6ms at p99
- CPU overhead per proxy under 1,000 RPS: approximately 50m CPU (0.05 cores)
- Memory overhead per proxy at rest: 40-60 MB RSS
- Overhead is dominated by TLS handshake cost on new connections; keepalive connections add ~0.5ms per hop

## Tuning Envoy resource limits

The default sidecar resource limits (500m CPU, 256 MB memory) are appropriate for most workloads. For high-traffic services like `banking-api`, increase the limits to prevent CPU throttling under load:

```
apiVersion: networking.istio.io/v1alpha3
kind: Sidecar
metadata:
  name: banking-api-sidecar
  namespace: royal-bank
spec:
  workloadSelector:
    labels:
      app: banking-api
  ingress:
    - port:
        number: 8080
        protocol: HTTP
        name: http
      defaultEndpoint: 127.0.0.1:8080
  egress:
    - hosts:
        - "royal-bank/*"
        - "istio-system/*"
```

Narrowing the egress hosts list reduces the size of the xDS configuration Istiod sends to the proxy, which reduces memory usage and configuration processing time. A proxy with a full mesh view (the default) receives xDS updates for every service in the cluster; scoping it to only the services the workload actually calls can reduce proxy memory by 30-50% in large clusters.

## Connection pool settings

Configure connection pool settings on the `DestinationRule` to control how Envoy manages upstream connections. The defaults are conservative; for high-throughput services, increase them:

```
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: banking-api
  namespace: royal-bank
spec:
  host: banking-api.royal-bank.svc.cluster.local
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 1000
        connectTimeout: 3s
        tcpKeepalive:
          time: 7200s
          interval: 75s
      http:
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
        maxRequestsPerConnection: 100
        h2UpgradePolicy: UPGRADE
```

Setting `h2UpgradePolicy: UPGRADE` enables HTTP/2 multiplexing between sidecars, which significantly reduces the number of TCP connections needed for high-concurrency workloads and is one of the more impactful single-setting changes available.

## Circuit breaker configuration

Circuit breakers prevent cascade failures when a downstream service is slow or unavailable. Configure them on the `DestinationRule`:

```
trafficPolicy:
  outlierDetection:
    consecutiveGatewayErrors: 5
    consecutive5xxErrors: 5
    interval: 30s
    baseEjectionTime: 30s
    maxEjectionPercent: 50
    minHealthPercent: 30
```

`maxEjectionPercent: 50` ensures that at most half of the endpoints for a service are ejected at once, preserving capacity even during partial outages. Setting it to 100 risks taking a service entirely offline if a transient error affects many endpoints simultaneously.

## Access log sampling

Writing a full access log entry for every request generates significant I/O on high-traffic services. Use the Telemetry API to sample access logs at a lower rate for healthy requests:

```
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: access-log-sampling
  namespace: royal-bank
spec:
  accessLogging:
    - providers:
        - name: envoy
      filter:
        expression: "response.code >= 400 || request.duration > duration('100ms')"
```

This logs only error responses and requests taking longer than 100ms. All problematic requests are still captured for debugging; routine successful fast requests are not logged.

## Horizontal scaling of Istiod

Istiod is the central point of certificate issuance and xDS configuration distribution. Under heavy load (many pods restarting simultaneously, or a cluster with thousands of workloads), Istiod can become a bottleneck. The HorizontalPodAutoscaler is configured during installation; verify it is functioning:

```
kubectl get hpa -n istio-system
kubectl top pods -n istio-system
```

If Istiod pods are regularly at CPU limit, increase the minimum replicas in the IstioOperator resource and re-apply.

## Excluding a service from the mesh

Some services should be excluded from the mesh: jobs that run briefly and do not benefit from mTLS, or services with very tight latency requirements where even 1ms overhead is unacceptable. Use the `traffic.sidecar.istio.io/includeInboundPorts: ""` annotation to prevent sidecar injection for a specific workload:

```
spec:
  template:
    metadata:
      annotations:
        traffic.sidecar.istio.io/includeInboundPorts: ""
        traffic.sidecar.istio.io/includeOutboundIPRanges: ""
```

This excludes the pod from the mesh entirely. It will not have mTLS, will not appear in Kiali, and will not emit Istio metrics. Use this sparingly; Adora Belle and Dr. Crucible must approve mesh exclusions for any workload in a customer namespace. The exclusion must be recorded in the security exception register. Ponder has asked that every mesh exclusion include a documented justification and a review date, having found two exclusions in the `merchants-guild` namespace that were added during debugging and never removed.
Last updated: 20 March 2026
