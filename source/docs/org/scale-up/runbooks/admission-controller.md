# Admission controller configuration

Runbook for configuring Kubernetes admission controllers to enforce image signing and vulnerability policies at the point of deployment. An admission controller intercepts pod creation requests and rejects any that do not meet policy requirements. This is the final enforcement layer: even if a developer bypasses Harbor's pull restrictions somehow, the admission controller prevents unsigned or vulnerable images from running.

## Policy engine

Golem Trust uses [Kyverno](https://github.com/kyverno/kyverno/releases) as the Kubernetes policy engine. Kyverno is a CNCF project, open source under the Apache 2.0 licence, and policies are written in YAML rather than a custom language. It runs as a set of pods in the `kyverno` namespace and intercepts admission webhook requests from the Kubernetes API server.

## Installing Kyverno

Install via Helm:

```
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno \
  --namespace kyverno \
  --create-namespace \
  --set admissionController.replicas=3 \
  --set backgroundController.replicas=2 \
  --set reportsController.replicas=2
```

Three admission controller replicas provide high availability. A single replica creates a single point of failure that would block all pod creation if the Kyverno pod goes down.

Verify the installation:

```
kubectl get pods -n kyverno
```

All pods should be running. If any are not, check `kubectl describe pod -n kyverno <pod-name>` for events.

## Image signature verification policy

Create the policy that requires all images in the production namespace to be signed:

```
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-image-signature
  annotations:
    policies.kyverno.io/title: Require Image Signature
    policies.kyverno.io/category: Software Supply Chain
    policies.kyverno.io/severity: high
    policies.kyverno.io/description: >
      All images in production must be signed by an authorised Cosign key or
      by a verified Gitea Actions pipeline identity.
spec:
  validationFailureAction: Enforce
  background: false
  rules:
    - name: verify-pipeline-signature
      match:
        any:
          - resources:
              kinds:
                - Pod
              namespaces:
                - production
                - staging
      verifyImages:
        - imageReferences:
            - "registry.golemtrust.am/golemtrust-prod/*"
            - "registry.golemtrust.am/golemtrust-staging/*"
          attestors:
            - count: 1
              entries:
                - keyless:
                    subject: "https://github.com/golemtrust/*"
                    issuer: "https://token.actions.githubusercontent.com"
                    rekor:
                      url: https://rekor.sigstore.dev

    - name: verify-manual-signature
      match:
        any:
          - resources:
              kinds:
                - Pod
              namespaces:
                - production
      verifyImages:
        - imageReferences:
            - "registry.golemtrust.am/base-images/*"
            - "registry.golemtrust.am/third-party/*"
          attestors:
            - count: 1
              entries:
                - keys:
                    publicKeys: |-
                      -----BEGIN PUBLIC KEY-----
                      <contents of cosign/golemtrust.pub>
                      -----END PUBLIC KEY-----
```

Apply the policy:

```
kubectl apply -f require-image-signature.yaml
```

`validationFailureAction: Enforce` means violations are blocked, not just logged. Start with `Audit` mode during the initial rollout to understand what would be blocked before switching to `Enforce`.

## Require images from Harbor only

Prevent pods from using images from any registry other than Harbor:

```
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-harbor-registry
  annotations:
    policies.kyverno.io/title: Require Harbor Registry
    policies.kyverno.io/severity: high
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: check-registry
      match:
        any:
          - resources:
              kinds:
                - Pod
              namespaces:
                - production
                - staging
      validate:
        message: >
          Images must be pulled from the Golem Trust Harbor registry at
          registry.golemtrust.am. Direct pulls from Docker Hub, ghcr.io,
          or other public registries are not permitted.
        pattern:
          spec:
            containers:
              - image: "registry.golemtrust.am/*"
            =(initContainers):
              - image: "registry.golemtrust.am/*"
            =(ephemeralContainers):
              - image: "registry.golemtrust.am/*"
```

This policy would have blocked `totally-not-malware:latest` at the deployment stage even if it had somehow reached the cluster.

## Block latest tags in production

The `latest` tag is mutable and provides no version guarantee. Block it in production:

```
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-latest-tag
  annotations:
    policies.kyverno.io/title: Disallow Latest Tag
    policies.kyverno.io/severity: medium
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: require-image-tag
      match:
        any:
          - resources:
              kinds:
                - Pod
              namespaces:
                - production
      validate:
        message: "Using 'latest' or no tag is not permitted in production. Use a specific image digest or version tag."
        pattern:
          spec:
            containers:
              - image: "!*:latest"
            =(initContainers):
              - image: "!*:latest"
```

## Monitoring policy violations

Kyverno reports policy violations as Kubernetes events and as `PolicyReport` resources. View current violations:

```
kubectl get policyreport -A
kubectl describe policyreport -n production
```

Add Kyverno metrics to Prometheus. Kyverno exposes a metrics endpoint on port 8000 in the `kyverno` namespace:

```
- job_name: kyverno
  static_configs:
    - targets: ['kyverno-svc-metrics.kyverno.svc.cluster.local:8000']
```

Create a Grafana dashboard for Kyverno policy violations. Alert if any `Enforce` mode policy has violations; this should not happen in a working cluster and indicates either a misconfigured deployment or a policy that is too restrictive.

## Rollout procedure

When deploying these policies to an existing cluster:

1. Deploy in `Audit` mode first: set `validationFailureAction: Audit` for all policies
2. Review `PolicyReport` resources for one week to identify what would have been blocked
3. Remediate any legitimate deployments that would be blocked (update image references to use Harbor, add missing signatures)
4. Switch policies to `Enforce` mode one at a time, starting with the least disruptive
5. Monitor for unexpected blocks after each switch

Do not switch all policies to `Enforce` simultaneously. If something breaks, it is easier to identify the cause when policies are switched one at a time.
