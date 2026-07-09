# OPA Gatekeeper policies

Before Gatekeeper, developers at Golem Trust could deploy containers running as root, with no resource limits, pulling images from anywhere on the internet. Ludmilla described this as "giving everyone a Burleigh Crum key and hoping they only open sensible doors." OPA Gatekeeper is the admission webhook that enforces security invariants at deploy time, before workloads ever start. It runs in audit mode first so that violations become visible without breaking existing deployments, then shifts to enforcement once the namespace has been remediated. This runbook covers the Gatekeeper installation, the four core policies in use at Golem Trust, and the procedure for testing a new policy before enabling enforcement.

## Install Gatekeeper via Helm

```
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts
helm repo update

helm install gatekeeper gatekeeper/gatekeeper \
  --namespace gatekeeper-system \
  --create-namespace \
  --set replicas=3 \
  --set auditInterval=60 \
  --set constraintViolationsLimit=100
```

Verify that the webhook configuration was created:

```
kubectl get validatingwebhookconfiguration | grep gatekeeper
kubectl get pods -n gatekeeper-system
```

## How ConstraintTemplates and Constraints work

A `ConstraintTemplate` defines the policy logic in Rego and declares what parameters the policy accepts. A `Constraint` is an instance of a template that specifies the enforcement mode, which namespaces it applies to, and the parameter values for that specific instance. You always create the template before the constraint.

## Policy: require-non-root-containers

```
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequirenonroot
spec:
  crd:
    spec:
      names:
        kind: K8sRequireNonRoot
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequirenonroot
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot
          msg := sprintf("Container %v must set runAsNonRoot: true", [container.name])
        }
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.runAsUser == 0
          msg := sprintf("Container %v must not run as UID 0", [container.name])
        }
```

```
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequireNonRoot
metadata:
  name: require-non-root-containers
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    excludedNamespaces:
      - kube-system
      - gatekeeper-system
```

## Policy: require-resource-limits

```
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequireresourcelimits
spec:
  crd:
    spec:
      names:
        kind: K8sRequireResourceLimits
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequireresourcelimits
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.cpu
          msg := sprintf("Container %v must set resources.limits.cpu", [container.name])
        }
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.memory
          msg := sprintf("Container %v must set resources.limits.memory", [container.name])
        }
```

## Policy: require-approved-registry

Only images from `registry.golemtrust.am` and `gcr.io/distroless` are permitted. This stops developers from accidentally pulling from Docker Hub in production, which caused the incident where a deprecated image with a critical CVE was deployed to the merchants-guild namespace.

```
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sapprovedregistry
spec:
  crd:
    spec:
      names:
        kind: K8sApprovedRegistry
      validation:
        openAPIV3Schema:
          properties:
            approvedRegistries:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sapprovedregistry
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          image := container.image
          not any_approved(image, input.parameters.approvedRegistries)
          msg := sprintf("Container image %v is not from an approved registry", [image])
        }
        any_approved(image, registries) {
          registry := registries[_]
          startswith(image, registry)
        }
```

```
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sApprovedRegistry
metadata:
  name: require-approved-registry
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    excludedNamespaces:
      - kube-system
  parameters:
    approvedRegistries:
      - registry.golemtrust.am
      - gcr.io/distroless
```

## Policy: require-security-context

All pods must declare a `securityContext` at the pod level with `seccompProfile` set to `RuntimeDefault` or `Localhost`.

## Audit mode versus enforcement mode

Set `enforcementAction: warn` or `enforcementAction: dryrun` when testing a new policy in a production cluster. Gatekeeper will log violations and expose them in the constraint status but will not block the admission request.

```
# Check current violations in audit mode
kubectl get k8srequirenonroot require-non-root-containers -o jsonpath='{.status.violations}' | jq .
```

Once all existing violations are remediated, switch to `enforcementAction: deny` by patching the constraint:

```
kubectl patch k8srequirenonroot require-non-root-containers \
  --type merge \
  -p '{"spec":{"enforcementAction":"deny"}}'
```

Dr. Crucible's standing rule: no new policy goes to `deny` mode without at least one full audit cycle (minimum 60 seconds after the policy is applied) showing zero violations in the target namespaces.
Last updated: 20 March 2026
