# Sigstore integration

Signing an artefact is only useful if the verification is enforced. Golem Trust uses Sigstore's Cosign for image signing, Fulcio for keyless certificate issuance tied to the Tekton pipeline's OIDC identity, and Rekor for transparency log entries. Kyverno enforces all three requirements at admission time: an image must carry a valid pipeline signature, a SLSA Level 3 provenance attestation, and an SBOM attestation, or it does not enter the production namespace. Mr. Teatime, reviewing the design from the red team perspective, approved it with a note: "The transparency log is particularly good. It means we would notice if someone signed something they shouldn't have." This runbook covers Cosign configuration in the Tekton pipeline, keyless signing, the Kyverno admission policy, and Rekor considerations.

## How keyless signing works

Traditional Cosign signing uses a long-lived private key stored as a secret. Keyless signing replaces this with a short-lived certificate issued by Sigstore Fulcio, bound to the OIDC identity of the signer. In Golem Trust's pipeline, the signer is the Tekton Chains controller's Kubernetes ServiceAccount. Fulcio issues a certificate proving that the signing event was performed by that ServiceAccount identity, and records the certificate in the Rekor transparency log. The certificate expires after ten minutes; verification uses the Rekor log entry.

The OIDC issuer is the build cluster's Kubernetes OIDC endpoint. This must be registered with Fulcio. For the public Sigstore instance this registration is automatic; for a self-hosted instance it requires explicit configuration.

## Cosign signing in the Tekton pipeline

Tekton Chains performs signing automatically after a TaskRun completes. Manual signing via the Cosign CLI is available for operator use and testing. To sign an image manually as the pipeline would:

```
cosign sign \
  --identity-token $(cat /var/run/secrets/kubernetes.io/serviceaccount/token) \
  --oidc-issuer https://kubernetes.golems.internal \
  harbor.golems.internal/golem-trust/example-service@sha256:<digest>
```

To sign with an explicit key (for operator-controlled artefacts such as the in-toto layout file):

```
cosign sign-blob \
  --key k8s://tekton-chains/signing-secrets \
  --output-signature layout.json.sig \
  golemtrust-layout.json
```

## Verifying image signatures

Verify that a given image carries the expected pipeline signature:

```
cosign verify \
  --certificate-identity-regexp "https://kubernetes.golems.internal/namespaces/tekton-chains/serviceaccounts/tekton-chains-controller" \
  --certificate-oidc-issuer https://kubernetes.golems.internal \
  harbor.golems.internal/golem-trust/example-service@sha256:<digest>
```

A successful verification prints the certificate subject and the Rekor log index. The log index can be used to retrieve the full transparency log entry for audit purposes.

To verify a SLSA provenance attestation is present and valid:

```
cosign verify-attestation \
  --type slsaprovenance \
  --certificate-identity-regexp "https://kubernetes.golems.internal/namespaces/tekton-chains/serviceaccounts/tekton-chains-controller" \
  --certificate-oidc-issuer https://kubernetes.golems.internal \
  harbor.golems.internal/golem-trust/example-service@sha256:<digest>
```

To verify the SBOM attestation:

```
cosign verify-attestation \
  --type cyclonedx \
  --certificate-identity-regexp "https://kubernetes.golems.internal/namespaces/tekton-chains/serviceaccounts/tekton-chains-controller" \
  --certificate-oidc-issuer https://kubernetes.golems.internal \
  harbor.golems.internal/golem-trust/example-service@sha256:<digest>
```

## Cosign policy file

The Cosign policy file documents the full set of requirements for a Golem Trust production image. It is used both by Kyverno and as a reference document for manual audits. The policy lives at `golem-trust/platform/cosign/policy.yaml`:

```
apiVersion: policy.sigstore.dev/v1alpha1
kind: ClusterImagePolicy
metadata:
  name: golemtrust-production-policy
spec:
  images:
    - glob: "harbor.golems.internal/golem-trust/**"
  authorities:
    - name: pipeline-signature
      keyless:
        url: https://fulcio.sigstore.dev
        identities:
          - issuer: https://kubernetes.golems.internal
            subjectRegExp: "https://kubernetes.golems.internal/namespaces/tekton-chains/serviceaccounts/tekton-chains-controller"
      attestations:
        - name: slsa-provenance
          predicateType: slsaprovenance
          policy:
            type: cue
            data: |
              predicateType: "https://slsa.dev/provenance/v0.2"
              predicate: builder: id: =~"https://tekton.golems.internal/chains/"
        - name: sbom-cyclonedx
          predicateType: cyclonedx
```

Apply the policy with `kubectl apply -f`. Kyverno reads ClusterImagePolicy resources and enforces them at admission time for any Pod in a namespace carrying the label `sigstore-policy: enforce`.

## Kyverno admission enforcement

The `production` namespace carries the label that enables Sigstore policy enforcement:

```
kubectl label namespace production sigstore-policy=enforce
```

When a Pod is admitted to the `production` namespace, Kyverno evaluates it against the ClusterImagePolicy. If any of the three requirements (pipeline signature, SLSA provenance, SBOM) is missing or invalid, admission is denied with an error message identifying which check failed.

To test the policy without affecting a live deployment, use a dry-run:

```
kubectl apply --dry-run=server -f deployment.yaml -n production
```

Angua and Sam Vimes Jr. review Kyverno admission denial events in Graylog under the `kyverno-admission` source. A spike in denials may indicate a pipeline issue or, less commonly, an attempt to deploy an image that bypassed the pipeline.

## Rekor transparency log

Every signing event produces a Rekor log entry. To look up the log entry for a specific image:

```
rekor-cli search --sha $(cosign triangulate harbor.golems.internal/golem-trust/example-service@sha256:<digest>)
```

Retrieve the full entry by its log index:

```
rekor-cli get --log-index <index>
```

The entry contains the signing certificate, the signed payload, and the log inclusion proof. This record is immutable; even Golem Trust cannot delete it from the public Rekor instance.

## Self-hosted Rekor considerations

Golem Trust currently uses the public Sigstore Rekor instance. For compliance with any future data residency requirements from the Patrician's Office, a self-hosted Rekor instance can be deployed. The Rekor Helm chart is available in the `golem-trust/platform` repository under `charts/rekor/`. A self-hosted instance requires:

- A separate Trillian log server with a PostgreSQL backend
- A TLS certificate for the Rekor API server
- Updated `COSIGN_REKOR_URL` environment variable in the Tekton Chains configuration
- The Rekor public key published so that external parties can verify entries

Dr. Crucible has a draft deployment plan for the self-hosted Rekor instance. The decision to proceed rests with Adora Belle, pending a formal data residency assessment from legal.
Last updated: 10 July 2026
