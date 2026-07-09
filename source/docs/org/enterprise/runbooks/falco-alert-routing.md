# Alert routing

Falco emits alerts as structured JSON events, but by itself it does not know what to do with them beyond writing to a file or stdout. Falcosidekick sits alongside Falco and fans those alerts out to every destination Golem Trust cares about: Graylog for long-term retention and correlation, PagerDuty for out-of-hours escalation of critical events, and Slack so the security team knows what is happening during working hours. Cheery manages the Falcosidekick configuration and describes it as "the post office of the security system: everything arrives, gets sorted, and goes where it belongs." This runbook covers deployment, output configuration, rate limiting, and the Grafana dashboard that tracks alert volumes.

## Deploying Falcosidekick

Falcosidekick is deployed in the same `falco` namespace as Falco, also via the Falcosecurity Helm chart:

```
helm upgrade --install falcosidekick falcosecurity/falcosidekick \
  --namespace falco \
  --values falcosidekick-values.yaml \
  --version 0.7.14
```

The `falcosidekick-values.yaml` file configures all output channels and rate limiting:

```
config:
  graylog:
    protocol: http
    address: graylog.golems.internal
    port: 12201
    minimumpriority: notice

  pagerduty:
    routingkey: ""  # set via secret, see below
    minimumpriority: critical

  slack:
    webhookurl: ""  # set via secret, see below
    channel: "#security-alerts"
    minimumpriority: warning
    outputformat: all
    messageformat: >
      Falco alert on `{{.Hostname}}`: *{{.Rule}}* ({{.Priority}})
      in namespace `{{index .OutputFields "k8s.ns.name"}}`

  customfields:
    environment: production
    team: security
    source: falco

  alertmanager:
    hostport: http://alertmanager.monitoring.svc.cluster.local:9093
    minimumpriority: warning

replicaCount: 2

resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi
```

## Storing credentials as Kubernetes secrets

PagerDuty routing keys and Slack webhook URLs must not appear in the values file. Store them as secrets and reference them via environment variables:

```
kubectl create secret generic falcosidekick-secrets \
  --namespace falco \
  --from-literal=PAGERDUTY_ROUTINGKEY=<your-routing-key> \
  --from-literal=SLACK_WEBHOOKURL=https://hooks.slack.com/services/...
```

Add the following to the Helm values to inject these secrets as environment variables:

```
extraEnv:
  - name: PAGERDUTY_ROUTINGKEY
    valueFrom:
      secretKeyRef:
        name: falcosidekick-secrets
        key: PAGERDUTY_ROUTINGKEY
  - name: SLACK_WEBHOOKURL
    valueFrom:
      secretKeyRef:
        name: falcosidekick-secrets
        key: SLACK_WEBHOOKURL
```

## Rate limiting

Without rate limiting, a single misbehaving container can flood Slack with hundreds of identical alerts per minute. Falcosidekick includes a throttling mechanism per rule:

```
config:
  bracketduration: 2m
  bracketmaxevents: 10
```

This allows at most 10 alerts per rule per 2-minute window to pass through to outputs. Events beyond that threshold are counted but not forwarded. The counts are visible in the Falcosidekick UI and in the Prometheus metrics endpoint. Adjust these values with care: too aggressive a throttle risks hiding a genuine alert storm during an active incident.

## Falcosidekick UI

The UI is deployed as a companion to Falcosidekick. Enable it in the values file:

```
webui:
  enabled: true
  replicaCount: 1
  redis:
    storageEnabled: true
    storageSize: 1Gi
    storageClass: hcloud-volumes
```

Access the UI via port-forward during incidents:

```
kubectl port-forward -n falco svc/falcosidekick-ui 2802:2802
```

Then open `http://localhost:2802` in a browser. The UI shows a real-time event feed, priority breakdown, top triggered rules, and a timeline of alert volumes.

## Graylog HTTP input configuration

Graylog receives Falco alerts via a GELF HTTP input. Create a GELF HTTP input in Graylog on port 12201, then verify that Falcosidekick is delivering events:

```
curl -s http://graylog.golems.internal:12201/gelf \
  -H "Content-Type: application/json" \
  -d '{"version":"1.1","host":"test","short_message":"falco test","level":1}'
```

In Graylog, the events appear under the stream `falco-alerts`. Cheery has configured a saved search and two alert conditions on that stream: one that triggers if no Falco events have arrived for 10 minutes (which suggests Falco itself may be down), and one that triggers if more than 50 critical events arrive in a 5-minute window.

## Grafana dashboard

A Grafana dashboard named "Falco Alert Rates" is deployed from the `golem-trust/dashboards` repository. It reads from the Prometheus metrics that Falcosidekick exposes on port 2801. The key panels are:

```
# Events total by priority (PromQL)
sum by (priority) (falcosidekick_inputs_total)

# Events per rule (top 10)
topk(10, sum by (rule) (falcosidekick_inputs_total))

# Throttled events (potential alert storm indicator)
falcosidekick_outputs_total{output="THROTTLING"}
```

The dashboard is provisioned automatically via Grafana's configmap-based provisioning. If the panels show no data, verify that Prometheus is scraping the `falcosidekick` service on port 2801 by checking the Prometheus targets page.
Last updated: 20 March 2026
