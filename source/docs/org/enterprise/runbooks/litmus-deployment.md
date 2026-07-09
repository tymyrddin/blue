# Litmus deployment

Ponder's objection to chaos engineering was not that breaking things is bad. Ponder understands very well that things break. His objection was that breaking things without a plan is merely vandalism, and that breaking things in production without understanding the blast radius is the kind of activity that ends careers. Dr. Crucible's response was to show him the Litmus ChaosCenter: a controlled, observable, reversible framework for introducing failures. Ponder spent thirty minutes reading the documentation, then said "all right, start with staging." That was six months ago. The production chaos schedule has been running for four months without an unplanned outage, which is itself evidence that the approach works.

## Installation

Litmus is installed via Helm in the `litmus` namespace:

```
helm repo add litmuschaos https://litmuschaos.github.io/litmus-helm/
helm repo update

helm install litmus litmuschaos/litmus \
  --namespace litmus \
  --create-namespace \
  --version 3.x \
  --values /opt/infrastructure/helm/litmus/values.yaml
```

The values file:

```
# /opt/infrastructure/helm/litmus/values.yaml

portal:
  server:
    authServer:
      enabled: true
    graphqlServer:
      enabled: true
  frontend:
    enabled: true

mongodb:
  persistence:
    size: 20Gi
    storageClass: hcloud-volumes

ingress:
  enabled: true
  ingressClassName: nginx
  host: litmus.golemtrust.am
  tls:
    - secretName: litmus-tls
      hosts:
        - litmus.golemtrust.am

adminConfig:
  DBUSER: "admin"
  DBPASSWORD: "CHANGE_ME_FROM_VAULT"
```

After installation, retrieve the initial admin credentials and change them immediately:

```
kubectl get secret litmus-admin-secret \
  -n litmus \
  -o jsonpath='{.data.ADMIN_PASSWORD}' | base64 -d

# Change via ChaosCenter UI at https://litmus.golemtrust.am
```

## Litmus components

ChaosCenter: the web UI for creating and monitoring chaos experiments. Access via Keycloak OIDC (see OIDC configuration below). URL: `https://litmus.golemtrust.am`.

ChaosOperator: the Kubernetes operator that watches for `ChaosEngine` custom resources and executes experiments. It runs as a Deployment in the `litmus` namespace and has cluster-wide RBAC permissions to manipulate pods, nodes, and network policies in all namespaces it is authorised for.

ChaosExporter: exports experiment metrics to Prometheus. Metrics include `litmuschaos_experiment_verdict` (1 for pass, 0 for fail), `litmuschaos_experiment_count`, and `litmuschaos_cluster_scoped_experiments_runs_total`.

## ChaosHub configuration

Litmus connects to two ChaosHubs. The public hub provides the standard experiment library (pod-delete, node-drain, network-chaos, and so on). The private Golem Trust hub in GitLab provides custom experiments for Golem Trust-specific scenarios.

Private hub configuration in ChaosCenter:

```
Name: Golem Trust Custom Hub
Hub Type: Remote
Repo URL: https://gitlab.golemtrust.am/infrastructure/chaos-hub.git
Branch: main
Auth Type: Token
Access Token: [GitLab deploy token, stored in Vaultwarden]
```

## Access control

Access to create `ChaosEngine` resources in production namespaces is restricted to Dr. Crucible and Ponder, enforced by an OPA Gatekeeper policy:

```
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sChaosEngineCreator
metadata:
  name: restrict-chaosengine-creators
spec:
  match:
    kinds:
      - apiGroups: ["litmuschaos.io"]
        kinds: ["ChaosEngine"]
    namespaces:
      - payments
      - royal-bank
      - core-services
      - infrastructure
  parameters:
    allowedServiceAccounts:
      - system:serviceaccount:litmus:litmus-admin
    allowedUsers:
      - dr-crucible
      - ponder-stibbons
```

Staging namespaces (`*-staging`) have a more permissive policy that allows any member of the `chaos-engineers` Keycloak group to create experiments.

## Keycloak OIDC configuration

ChaosCenter authenticates via Keycloak OIDC. The client configuration in Keycloak:

```
Client ID: litmus-chaoscenter
Client Protocol: openid-connect
Access Type: confidential
Valid Redirect URIs: https://litmus.golemtrust.am/*
Root URL: https://litmus.golemtrust.am

Roles:
  - chaos-viewer (read-only access to ChaosCenter)
  - chaos-engineer (create experiments in staging)
  - chaos-admin (create experiments in production; assigned to Dr. Crucible and Ponder only)
```

## Prometheus alerts

The ChaosExporter provides metrics that Prometheus scrapes. Two alerting rules are configured:

```
groups:
  - name: litmus-chaos
    rules:
      - alert: ChaosExperimentFailed
        expr: litmuschaos_experiment_verdict == 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Chaos experiment failed: {{ $labels.chaosresult_name }}"
          description: >
            Experiment {{ $labels.chaosresult_name }} in namespace
            {{ $labels.chaosresult_namespace }} did not pass.
            This may indicate the application did not recover as expected.

      - alert: ChaosEngineStuck
        expr: |
          kube_customresource_status_phase{customresource_kind="ChaosEngine",
            customresource_phase!~"completed|stopped"} > 0
        for: 30m
        labels:
          severity: critical
        annotations:
          summary: "ChaosEngine stuck in non-terminal state"
          description: >
            ChaosEngine {{ $labels.customresource_name }} has been in
            {{ $labels.customresource_phase }} state for more than 30 minutes.
            Manual intervention may be required.
```

The `ChaosExperimentFailed` alert fires when an experiment's verdict is "fail", meaning the application's steady-state hypothesis was not met during the experiment. This is a signal that the application needs improvement, not that Litmus has failed; however, Ponder and Dr. Crucible review all failures before the next production experiment of the same type.
Last updated: 20 March 2026
