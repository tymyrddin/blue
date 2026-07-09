# Tekton pipeline setup

After Ludmilla's warning to the development team about the JavaScript library incident, the old CI/CD system was retired and replaced with Tekton Pipelines running on Kubernetes. The central requirement was that every build should happen in an ephemeral environment, created fresh and destroyed after, with a complete chain of custody recorded from source commit to container image in Harbor. This runbook covers installing Tekton Pipelines, Triggers, Chains, and the Dashboard; defining the standard Golem Trust pipeline structure; and verifying that artefacts are being signed and pushed correctly.

## Prerequisites

- `kubectl` access to the build cluster with cluster-admin rights
- Harbor registry accessible at `harbor.golems.internal`, with the Tekton component images mirrored
- GitLab instance accessible from within the cluster for webhook delivery
- Hetzner Object Storage bucket `golemtrust-pipeline-artefacts` created and credentials available in Vault

## Install Tekton Pipelines

Apply the latest release manifest. Ludmilla's team pins specific release versions in the `golem-trust/platform` repository; do not apply an unreviewed upstream manifest directly.

```
kubectl apply -f https://storage.googleapis.com/tekton-releases/pipeline/previous/v0.59.0/release.yaml
```

Wait for all Pods in the `tekton-pipelines` namespace to reach `Running` state:

```
kubectl get pods -n tekton-pipelines --watch
```

## Install Tekton Triggers

Triggers provides the webhook receiver that translates a GitLab push event into a PipelineRun. Apply the Triggers release and the interceptors release separately:

```
kubectl apply -f https://storage.googleapis.com/tekton-releases/triggers/previous/v0.27.0/release.yaml
kubectl apply -f https://storage.googleapis.com/tekton-releases/triggers/previous/v0.27.0/interceptors.yaml
```

Confirm the Triggers controller and webhook Pods are running:

```
kubectl get pods -n tekton-pipelines -l app.kubernetes.io/part-of=tekton-triggers
```

## Install Tekton Chains

Tekton Chains is the supply chain security component that automatically signs completed TaskRuns and PipelineRuns. It is the mechanism by which Golem Trust achieves SLSA Level 3 provenance without requiring every pipeline author to implement signing manually.

```
kubectl apply -f https://storage.googleapis.com/tekton-releases/chains/previous/v0.21.0/release.yaml
```

Configure Chains to use Cosign keyless signing via Sigstore Fulcio and to store attestations as OCI artefacts in Harbor:

```
kubectl patch configmap chains-config -n tekton-chains --patch '
{
  "data": {
    "artifacts.oci.format": "simplesigning",
    "artifacts.oci.storage": "oci",
    "artifacts.taskrun.format": "slsa/v1",
    "artifacts.taskrun.storage": "oci,tekton",
    "transparency.enabled": "true",
    "transparency.url": "https://rekor.sigstore.dev"
  }
}'
```

Restart the Chains controller to pick up the configuration:

```
kubectl rollout restart deployment/tekton-chains-controller -n tekton-chains
```

## Install Tekton Dashboard

The Dashboard gives Cheery and the development teams visibility into running and completed PipelineRuns without requiring direct `kubectl` access:

```
kubectl apply -f https://storage.googleapis.com/tekton-releases/dashboard/previous/v0.44.0/release-full.yaml
```

The Dashboard is exposed internally via an Ingress with OIDC authentication through Dex. The Ingress manifest lives in `golem-trust/platform/tekton/dashboard-ingress.yaml`.

## Configure the GitLab webhook trigger

Create the EventListener namespace and ServiceAccount:

```
kubectl create namespace tekton-triggers
kubectl create serviceaccount tekton-triggers-sa -n tekton-triggers
```

Apply the ClusterRole and binding that allow the EventListener to create PipelineRuns:

```
kubectl apply -f golem-trust/platform/tekton/triggers-rbac.yaml
```

The EventListener configuration references a TriggerTemplate and TriggerBinding. The TriggerBinding extracts `git_url`, `git_revision`, and `project_name` from the GitLab webhook payload. The TriggerTemplate maps these to the PipelineRun parameters. Both resources live in `golem-trust/platform/tekton/triggers/`.

Apply them:

```
kubectl apply -f golem-trust/platform/tekton/triggers/
```

Create the EventListener Service and retrieve its external IP for GitLab configuration:

```
kubectl get service el-golemtrust-listener -n tekton-triggers
```

Register this IP in GitLab under Settings > Webhooks for each repository, using the secret token stored in Vault at `secret/tekton/webhook-token`.

## Pipeline structure

The standard Golem Trust pipeline consists of seven Tasks executed in sequence, sharing a persistent workspace volume so artefacts pass between steps without leaving the cluster.

The pipeline structure in abbreviated form:

```
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: golemtrust-build
  namespace: tekton-pipelines
spec:
  workspaces:
    - name: shared-workspace
  params:
    - name: git-url
    - name: git-revision
    - name: image-name
  tasks:
    - name: source-checkout
      taskRef:
        name: git-clone
      workspaces:
        - name: output
          workspace: shared-workspace
      params:
        - name: url
          value: $(params.git-url)
        - name: revision
          value: $(params.git-revision)

    - name: dependency-verification
      taskRef:
        name: golemtrust-verify-deps
      runAfter: [source-checkout]
      workspaces:
        - name: source
          workspace: shared-workspace

    - name: build
      taskRef:
        name: kaniko
      runAfter: [dependency-verification]
      workspaces:
        - name: source
          workspace: shared-workspace

    - name: sbom-generation
      taskRef:
        name: golemtrust-syft-sbom
      runAfter: [build]
      workspaces:
        - name: source
          workspace: shared-workspace

    - name: sign
      taskRef:
        name: golemtrust-cosign-sign
      runAfter: [sbom-generation]

    - name: push
      taskRef:
        name: crane-push
      runAfter: [sign]
      workspaces:
        - name: source
          workspace: shared-workspace

    - name: attestation
      taskRef:
        name: golemtrust-in-toto-attest
      runAfter: [push]
      workspaces:
        - name: source
          workspace: shared-workspace
```

Full Task definitions live in `golem-trust/platform/tekton/tasks/`. Ludmilla reviews changes to any Task definition via the standard PR process before they are applied to the cluster.

## Persistent workspace volume

The shared workspace uses a PersistentVolumeClaim provisioned by the Hetzner CSI driver. Each PipelineRun receives its own PVC, created by the VolumeClaimTemplate mechanism, and deleted after the PipelineRun completes:

```
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  generateName: golemtrust-build-
  namespace: tekton-pipelines
spec:
  pipelineRef:
    name: golemtrust-build
  workspaces:
    - name: shared-workspace
      volumeClaimTemplate:
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 2Gi
  params:
    - name: git-url
      value: https://gitlab.golems.internal/golem-trust/example-service
    - name: git-revision
      value: main
    - name: image-name
      value: harbor.golems.internal/golem-trust/example-service
```

## Verify a completed PipelineRun

After a PipelineRun completes, confirm that Tekton Chains has signed the TaskRun that produced the image. The annotation `chains.tekton.dev/signed=true` indicates successful signing:

```
kubectl get taskrun -n tekton-pipelines -o json | \
  jq '.items[] | select(.metadata.annotations["chains.tekton.dev/signed"] == "true") | .metadata.name'
```

Confirm the image and its attestation are present in Harbor:

```
crane ls harbor.golems.internal/golem-trust/example-service
```

The listing should show the image digest tag alongside one or more `sha256-<digest>.att` attestation tags. If attestation tags are absent, check the Chains controller logs:

```
kubectl logs -n tekton-chains deployment/tekton-chains-controller --tail=100
```

Dr. Crucible maintains a Grafana dashboard that shows the rolling 24-hour count of signed versus unsigned TaskRuns. Any unsigned TaskRun in a production pipeline is an alert condition and should be raised with Ludmilla immediately.
Last updated: 20 March 2026
