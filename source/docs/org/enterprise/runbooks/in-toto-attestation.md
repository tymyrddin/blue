# In-toto attestation

In-toto answers a question that provenance alone does not: not just who built the image, but what happened to the source code at every step along the way from the first `git clone` to the final `docker push`. Ludmilla describes it as "a chain of custody that a judge would accept, if judges understood container registries." Each step in the Tekton pipeline wraps its commands with `in-toto-run`, producing a cryptographically linked record of what went in and what came out. This runbook covers the in-toto framework, how Golem Trust's layout file is structured, how `in-toto-run` is integrated into Tekton Tasks, and how to verify the complete chain with `in-toto-verify`.

## In-toto framework concepts

An in-toto supply chain is described by a layout file, which defines the expected steps, the functionaries authorised to perform each step, and the rules governing what materials each step may consume and what products it may produce.

For each step, in-toto records a link file containing:

- The step name
- The functionary that performed the step (identified by their signing key)
- Materials: the files consumed, with their SHA-256 hashes
- Products: the files produced, with their SHA-256 hashes
- The command that was executed
- A return code

The final verification checks that every link file is present, signed by the correct functionary, and that materials and products satisfy the rules in the layout. A gap or inconsistency in the chain causes verification to fail.

## Layout file

The Golem Trust in-toto layout lives at `golem-trust/platform/in-toto/golemtrust-layout.json`. It defines seven steps matching the Tekton pipeline structure. The layout is signed by Ludmilla's offline signing key, which is kept in a hardware token. The corresponding public key is published at `https://golemtrust.am/.well-known/in-toto-root.pub`.

An abbreviated representation of the layout structure:

```
{
  "_type": "layout",
  "expires": "2027-01-01T00:00:00Z",
  "keys": {
    "<ludmilla-key-id>": {
      "keytype": "ed25519",
      "keyval": { "public": "<public-key>" }
    },
    "<tekton-chains-key-id>": {
      "keytype": "ed25519",
      "keyval": { "public": "<public-key>" }
    }
  },
  "steps": [
    {
      "name": "source-checkout",
      "expected_materials": [],
      "expected_products": [
        ["CREATE", "src/*"],
        ["CREATE", ".git/HEAD"]
      ],
      "pubkeys": ["<tekton-chains-key-id>"],
      "expected_command": ["git", "clone"]
    },
    {
      "name": "dependency-verification",
      "expected_materials": [
        ["MATCH", "src/*", "WITH", "PRODUCTS", "FROM", "source-checkout"]
      ],
      "expected_products": [
        ["MATCH", "src/*", "WITH", "MATERIALS", "FROM", "dependency-verification"]
      ],
      "pubkeys": ["<tekton-chains-key-id>"],
      "expected_command": ["golemtrust-verify-deps"]
    },
    {
      "name": "build",
      "expected_materials": [
        ["MATCH", "src/*", "WITH", "PRODUCTS", "FROM", "dependency-verification"]
      ],
      "expected_products": [
        ["CREATE", "image.tar"]
      ],
      "pubkeys": ["<tekton-chains-key-id>"],
      "expected_command": ["kaniko"]
    }
  ],
  "inspect": []
}
```

The full layout including all seven steps is maintained in the `golem-trust/platform` repository. Changes require a PR, two reviews, and Ludmilla's sign-off, because altering the layout is equivalent to altering what the supply chain is expected to do.

## Integrating in-toto-run into Tekton Tasks

Each Tekton Task that performs a meaningful transformation wraps its core command with `in-toto-run`. The Task receives the step name, the signing key path (mounted from a Kubernetes Secret), and the link file output directory (on the shared workspace) as parameters.

The dependency verification Task is shown as an example:

```
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: golemtrust-verify-deps
  namespace: tekton-pipelines
spec:
  workspaces:
    - name: source
      mountPath: /workspace/source
  params:
    - name: link-dir
      default: /workspace/source/.in-toto-links
  volumes:
    - name: signing-key
      secret:
        secretName: in-toto-signing-key
  steps:
    - name: run-with-intoto
      image: harbor.golems.internal/tools/in-toto:0.5.0
      volumeMounts:
        - name: signing-key
          mountPath: /etc/in-toto
      command:
        - in-toto-run
      args:
        - --step-name
        - dependency-verification
        - --signing-key
        - /etc/in-toto/step-signing.key
        - --materials
        - /workspace/source/src
        - --products
        - /workspace/source/src
        - --link-dir
        - $(params.link-dir)
        - --
        - /scripts/verify-deps.sh
        - /workspace/source
```

The `--` separator separates `in-toto-run` flags from the actual command being wrapped. The link file is written to the shared workspace so the attestation Task can collect it later.

## Collecting and attaching link files

The final attestation Task collects all link files from the shared workspace and attaches them as a Cosign attestation alongside the image in Harbor:

```
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: golemtrust-in-toto-attest
  namespace: tekton-pipelines
spec:
  workspaces:
    - name: source
      mountPath: /workspace/source
  params:
    - name: image-ref
  steps:
    - name: bundle-links
      image: harbor.golems.internal/tools/cosign:2.2.4
      script: |
        #!/bin/sh
        set -e
        LINK_DIR=/workspace/source/.in-toto-links
        BUNDLE=$(mktemp)
        tar czf ${BUNDLE} -C ${LINK_DIR} .

        cosign attest \
          --predicate ${BUNDLE} \
          --type https://golemtrust.am/attestation/in-toto-bundle/v1 \
          $(params.image-ref)
```

## Storing in-toto metadata in Harbor

Harbor stores OCI artefacts, including attestation blobs, as referrers attached to image manifests. After the attestation Task completes, list all artefacts attached to an image digest to confirm the in-toto bundle is present:

```
crane ls harbor.golems.internal/golem-trust/example-service
```

Tags of the form `sha256-<digest>.att` are Cosign attestations. Multiple attestations may be present: one from Tekton Chains (SLSA provenance), one from Syft (SBOM), and one from this step (in-toto link bundle).

To retrieve a specific attestation:

```
cosign download attestation \
  harbor.golems.internal/golem-trust/example-service@sha256:<digest> \
  --predicate-type https://golemtrust.am/attestation/in-toto-bundle/v1
```

## Verifying the complete chain with in-toto-verify

Download the layout, the link files, and the layout owner's public key, then run the verifier:

```
cosign download attestation \
  harbor.golems.internal/golem-trust/example-service@sha256:<digest> \
  --predicate-type https://golemtrust.am/attestation/in-toto-bundle/v1 \
  | jq -r '.payload' | base64 -d | tar xz -C ./links/

curl -o root.pub https://golemtrust.am/.well-known/in-toto-root.pub

in-toto-verify \
  --layout golemtrust-layout.json \
  --layout-keys root.pub \
  --link-dir ./links/
```

A successful verification prints `The software product passed all verification.` Any failure describes the specific step or rule that was violated. Verification failures on production images should be escalated to Ludmilla and, if the failure suggests tampering rather than a tooling issue, to Sam Vimes Jr. immediately.

## Rotating the step signing key

The step signing key (used by Tekton Tasks for `in-toto-run`) should be rotated annually. The new key must be registered in the layout file before the old key is removed from the Kubernetes Secret, because link files signed under the old key must remain verifiable until all images built with them are retired from production. Ludmilla coordinates key rotations through the standard change request process.
Last updated: 20 March 2026
