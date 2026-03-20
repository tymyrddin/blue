# Observability setup

Before the service mesh, diagnosing latency problems between services required coordinating with three different teams to get logs from three different systems, which Ponder described as "asking three different guild secretaries to find the same document." Istio's telemetry pipeline changes this: every hop between services emits metrics, traces, and access logs automatically, with no instrumentation required from application developers. This runbook covers the full observability stack: Prometheus scraping Istio metrics, Grafana dashboards, Kiali for topology visualisation, Jaeger for distributed tracing, and Graylog integration for access logs.

## Istio telemetry v2 and Envoy stats

Istio's telemetry v2 (also called Telemetry API) uses the Envoy stats filter to emit metrics directly from the proxy, rather than going through a Mixer component. This is the default since Istio 1.8 and is what Golem Trust runs.

Prometheus discovers Istio metrics by scraping each Envoy sidecar on port 15090 and Istiod on port 15014. The Prometheus operator ServiceMonitor resources for this are deployed as part of the Istio installation.

Key metrics emitted by each proxy:

```
# Request volume and outcome
istio_requests_total{destination_service, source_workload, response_code}

# Latency distribution
istio_request_duration_milliseconds_bucket{destination_service, source_workload}

# TCP bytes transferred
istio_tcp_sent_bytes_total
istio_tcp_received_bytes_total
```

## Prometheus scrape configuration

If not using the Prometheus operator, add the following scrape jobs to `prometheus.yaml`:

```
scrape_configs:
  - job_name: istio-mesh
    kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
            - istio-system
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: istio-telemetry;prometheus

  - job_name: envoy-stats
    metrics_path: /stats/prometheus
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_container_port_name]
        action: keep
        regex: http-envoy-prom
```

## Grafana dashboards

Golem Trust uses the three official Istio dashboards, imported from the Istio release assets:

- Istio Mesh Dashboard: cluster-wide request rates, error rates, and latency for all services
- Istio Service Dashboard: per-service breakdown with inbound and outbound request metrics
- Istio Workload Dashboard: per-pod metrics including CPU, memory, and proxy performance

Import them into Grafana:

```
# Download the dashboard JSON files from the Istio release
curl -L https://raw.githubusercontent.com/istio/istio/release-1.20/manifests/addons/grafana/dashboards/istio-mesh-dashboard.json \
  -o istio-mesh-dashboard.json

# Import via the Grafana API
curl -X POST http://grafana.platform.svc.cluster.local:3000/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @istio-mesh-dashboard.json
```

Cheery has set the default time range on the Istio dashboards to the last 15 minutes and configured alert annotations so that fired alerts appear as vertical lines on the latency graphs.

## Kiali service graph

Kiali provides a live service topology graph showing which services are communicating, the request rates between them, and health indicators. It reads from Prometheus and the Kubernetes API.

```
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml

# Access via port-forward (or configure an Ingress)
kubectl port-forward svc/kiali 20001:20001 -n istio-system
```

Kiali's most useful feature for Golem Trust is the security view, which shows which service-to-service connections are using mTLS and which are not. During migration periods, any connection shown as plaintext requires immediate attention.

## Jaeger distributed tracing

Istio forwards trace spans to Jaeger using the Zipkin protocol. Configure the Jaeger endpoint in the mesh configuration:

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio
  namespace: istio-system
data:
  mesh: |
    enableTracing: true
    defaultConfig:
      tracing:
        zipkin:
          address: jaeger-collector.tracing.svc.cluster.local:9411
        sampling: 10.0
```

The `sampling` value of 10.0 means 10% of requests generate traces. This is Golem Trust's production setting; increasing it to 100% is useful for debugging a specific service but will significantly increase Jaeger's storage consumption. The current Jaeger deployment uses Elasticsearch for trace storage, with a 14-day retention window.

Querying traces:

```
# Access Jaeger UI
kubectl port-forward svc/jaeger-query 16686:16686 -n tracing
```

In the Jaeger UI, search by service name (which maps to the Kubernetes workload name) and filter by minimum duration to find slow requests.

## Access log format and Graylog forwarding

Envoy access logs are written to stdout in the following JSON format, configured via the Telemetry API:

```
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: access-log-format
  namespace: istio-system
spec:
  accessLogging:
    - providers:
        - name: envoy
      filter:
        expression: "response.code >= 400"
```

Filtering to only log 4xx and 5xx responses reduces log volume significantly. For full access logging on a specific service, apply a namespace-scoped Telemetry resource that overrides this filter.

The Fluentd daemonset collects container stdout from all nodes and forwards to Graylog. No additional configuration is needed for Istio access logs; they arrive in Graylog alongside application logs. Otto Chriek has configured Graylog stream rules that separate Istio proxy logs (identified by the `x_forwarded_for` field) from application logs.
