# Gatekeeper configuration

OPA Gatekeeper extends Kubernetes with policy-aware admission control. Every resource submitted to any Golem Trust cluster passes through Gatekeeper before being accepted, and Gatekeeper's audit controller periodically scans existing resources for policy violations that predate a constraint's creation. Ludmilla describes it as "having Carrot at the city gate checking everyone's papers, except Carrot never gets tired, never accepts a bribe, and produces a written record of every rejection." This runbook covers Gatekeeper installation, the ConstraintTemplate and Constraint resource definitions, enforcement mode configuration, and the upgrade procedure.

## Installation via Helm

Add the Gatekeeper Helm repository and install into the `gatekeeper-system` namespace:

```
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts
helm repo update

helm upgrade --install gatekeeper gatekeeper/gatekeeper \
  --namespace gatekeeper-system \
  --create-namespace \
  --version 3.17.1 \
  --values gatekeeper-values.yaml
```

The `gatekeeper-values.yaml` sets resource requirements and configures the audit interval:

```
controllerManager:
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 512Mi
  replicas: 2

audit:
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  auditInterval: 60
  constraintViolationsLimit: 20

postInstall:
  labelNamespace:
    enabled: true

logLevel: INFO
```

Two controller manager replicas run in separate availability zones. The audit pod runs as a single replica; it is not in the critical path for admission and a brief outage does not affect cluster operations.

## ConstraintTemplate: defining a policy

A `ConstraintTemplate` embeds the Rego policy and defines the CRD schema for the corresponding `Constraint` resources. Below is the template for the "container must not run as root" policy:

```
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: golemtrustnoroot
spec:
  crd:
    spec:
      names:
        kind: GolemTrustNoRoot
      validation:
        openAPIV3Schema:
          type: object
          properties:
            exemptImages:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package golem_trust.kubernetes.runasroot

        import rego.v1

        violation contains {"msg": msg} if {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot
          not is_exempt(container)
          msg := sprintf(
            "Container '%s' must have securityContext.runAsNonRoot: true",
            [container.name]
          )
        }

        violation contains {"msg": msg} if {
          container := input.review.object.spec.containers[_]
          container.securityContext.runAsUser == 0
          not is_exempt(container)
          msg := sprintf(
            "Container '%s' must not run as UID 0",
            [container.name]
          )
        }

        is_exempt(container) if {
          exempt := input.parameters.exemptImages[_]
          startswith(container.image, exempt)
        }
```

## Constraint: applying a template

A `Constraint` resource instantiates a template and defines its scope. The `GolemTrustNoRoot` template is applied to all pods in all namespaces except `kube-system`:

```
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: GolemTrustNoRoot
metadata:
  name: no-root-containers
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    excludedNamespaces:
      - kube-system
      - gatekeeper-system
  parameters:
    exemptImages:
      - harbor.golems.internal/falcosecurity/falco
      - harbor.golems.internal/library/pause
```

## Enforcement actions

Gatekeeper supports three enforcement actions:

- `deny`: the admission request is rejected and the user receives the violation message; this is the default for all Golem Trust policies after the testing period
- `dryrun`: the resource is admitted but violations are recorded; used when introducing a new policy against existing workloads
- `warn`: the resource is admitted but a warning is returned to the client; used for advisory policies that are not yet mandatory

New policies are introduced with `enforcementAction: dryrun` for at least one week. Dr. Crucible and Ludmilla review the audit violations during that period to assess impact before switching to `deny`.

## Viewing audit violations

The audit controller populates a `status.violations` field on each `Constraint` resource:

```
kubectl get constraint no-root-containers -o yaml | grep -A 30 violations
```

Violations are also forwarded to Graylog via a Falcosidekick-style forwarding controller that reads the constraint statuses and ships them as structured log events. The Graylog stream `gatekeeper-violations` is the primary view for Otto Chriek's compliance reporting.

To list all constraints and their violation counts:

```
kubectl get constraints -A
```

## Managing Gatekeeper upgrades

Before upgrading, check the Gatekeeper release notes for CRD schema changes. If the CRD schema changes, apply the new CRDs before upgrading the controller:

```
helm pull gatekeeper/gatekeeper --version <new-version> --untar
kubectl apply -f gatekeeper-<new-version>/crds/
```

Then upgrade the Helm release:

```
helm upgrade gatekeeper gatekeeper/gatekeeper \
  --namespace gatekeeper-system \
  --version <new-version> \
  --values gatekeeper-values.yaml
```

The two controller manager replicas allow a rolling update with no interruption to admission webhook availability. Monitor the rollout:

```
kubectl rollout status deployment/gatekeeper-controller-manager \
  -n gatekeeper-system
```

If the new controller manager fails to start, Kubernetes will retain the previous replica and the cluster will continue enforcing policies. Roll back with:

```
helm rollback gatekeeper -n gatekeeper-system
```
Last updated: 20 March 2026
