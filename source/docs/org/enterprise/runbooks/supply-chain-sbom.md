# SBOM generation in Tekton

A Software Bill of Materials is the container image equivalent of an ingredient list. Golem Trust generates one for every image it builds, in both CycloneDX and SPDX formats, because different customers and regulatory frameworks prefer different formats, and because generating both costs almost nothing compared to being asked for one you do not have. The SBOM generation step runs immediately after the image build, before signing or pushing, so that the SBOM can be co-signed and co-attested with the image itself. Licence compliance checking runs at the same time, and a build with a forbidden licence fails before it ever reaches Harbor. This runbook covers the Syft Task, SBOM attestation with Cosign, licence compliance checking, and the monthly archive to Hetzner Object Storage.

## Syft Task definition

Syft runs as a dedicated Tekton Task after the `build` Task. It receives the image reference as a parameter and writes both CycloneDX JSON and SPDX JSON to the shared workspace:

```
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: golemtrust-syft-sbom
  namespace: tekton-pipelines
spec:
  workspaces:
    - name: source
      mountPath: /workspace/source
  params:
    - name: image-ref
  results:
    - name: cyclonedx-sbom-path
    - name: spdx-sbom-path
  steps:
    - name: generate-cyclonedx
      image: harbor.golems.internal/tools/syft:1.4.1
      command:
        - syft
      args:
        - packages
        - $(params.image-ref)
        - --output
        - cyclonedx-json=/workspace/source/sbom.cyclonedx.json
        - --scope
        - all-layers

    - name: generate-spdx
      image: harbor.golems.internal/tools/syft:1.4.1
      command:
        - syft
      args:
        - packages
        - $(params.image-ref)
        - --output
        - spdx-json=/workspace/source/sbom.spdx.json
        - --scope
        - all-layers

    - name: record-paths
      image: harbor.golems.internal/tools/busybox:1.36
      script: |
        echo -n "/workspace/source/sbom.cyclonedx.json" | tee $(results.cyclonedx-sbom-path.path)
        echo -n "/workspace/source/sbom.spdx.json" | tee $(results.spdx-sbom-path.path)
```

## Attaching the SBOM as a Cosign attestation

After Syft generates both files, a subsequent step attaches the CycloneDX SBOM as a Cosign attestation and the SPDX SBOM as a second attestation. Both are stored in Harbor as referrers to the image manifest.

```
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: golemtrust-sbom-attest
  namespace: tekton-pipelines
spec:
  params:
    - name: image-ref
    - name: cyclonedx-path
    - name: spdx-path
  steps:
    - name: attest-cyclonedx
      image: harbor.golems.internal/tools/cosign:2.2.4
      command:
        - cosign
      args:
        - attest
        - --predicate
        - $(params.cyclonedx-path)
        - --type
        - cyclonedx
        - $(params.image-ref)

    - name: attest-spdx
      image: harbor.golems.internal/tools/cosign:2.2.4
      command:
        - cosign
      args:
        - attest
        - --predicate
        - $(params.spdx-path)
        - --type
        - spdx
        - $(params.image-ref)
```

To confirm both attestations are present after a build:

```
cosign download attestation \
  harbor.golems.internal/golem-trust/example-service@sha256:<digest> \
  | jq -r '.predicateType'
```

The output should show at least `https://cyclonedx.org/bom` and `https://spdx.dev/Document`.

## Application dependency SBOM from source

Syft generates an SBOM from the built image. For licence compliance checking, an additional SBOM is generated from the application's source code before the build, using cdxgen. This captures the full dependency tree including transitive dependencies that may not be visible in the final image layers:

```
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: golemtrust-cdxgen-sbom
  namespace: tekton-pipelines
spec:
  workspaces:
    - name: source
      mountPath: /workspace/source
  steps:
    - name: generate-source-sbom
      image: harbor.golems.internal/tools/cdxgen:10.6.0
      command:
        - cdxgen
      args:
        - --output
        - /workspace/source/sbom-source.cyclonedx.json
        - --type
        - auto
        - /workspace/source/src
```

## Licence compliance checking

After the source SBOM is generated, a custom script checks each component's SPDX licence identifier against the Golem Trust allowed list. The script lives at `golem-trust/platform/scripts/check-licences.py`:

```
#!/usr/bin/env python3
import json
import sys

ALLOWED = {"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD"}
REVIEW_REQUIRED = {"GPL-3.0-only", "GPL-3.0-or-later", "LGPL-2.1-only", "LGPL-2.1-or-later"}

with open(sys.argv[1]) as f:
    sbom = json.load(f)

failures = []
reviews = []

for component in sbom.get("components", []):
    name = component.get("name", "unknown")
    version = component.get("version", "unknown")
    licences = [
        lic.get("expression") or lic.get("license", {}).get("id", "UNKNOWN")
        for lic in component.get("licenses", [{"license": {"id": "UNKNOWN"}}])
    ]
    for lic in licences:
        if lic in REVIEW_REQUIRED:
            reviews.append(f"{name}@{version}: {lic} (legal review required)")
        elif lic not in ALLOWED and lic != "UNKNOWN":
            failures.append(f"{name}@{version}: {lic} (forbidden)")

if reviews:
    print("LICENCE REVIEW REQUIRED:")
    for r in reviews:
        print(f"  {r}")

if failures:
    print("LICENCE VIOLATIONS (build failed):")
    for f in failures:
        print(f"  {f}")
    sys.exit(1)

print(f"Licence check passed. {len(reviews)} component(s) require legal review.")
```

The Task that runs this script:

```
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: golemtrust-licence-check
  namespace: tekton-pipelines
spec:
  workspaces:
    - name: source
      mountPath: /workspace/source
  steps:
    - name: check
      image: harbor.golems.internal/tools/python:3.12-slim
      command:
        - python3
      args:
        - /scripts/check-licences.py
        - /workspace/source/sbom-source.cyclonedx.json
```

If the script exits with a non-zero status, the Tekton pipeline fails and the image is not pushed to Harbor. The build log shows exactly which component and licence triggered the failure. GPL-3.0 components require a ticket in Jira for legal review before the dependency can be approved; the approval is recorded in the hash database maintained by Ludmilla's team.

## Monthly SBOM archive

On the first day of each month, a CronJob collects all SBOM attestations generated during the previous month from Harbor and archives them to Hetzner Object Storage. The bucket is `golemtrust-sbom-archive`, with versioning enabled and a two-year retention policy.

The archive script authenticates to Harbor using a read-only robot account, retrieves the list of images pushed in the previous month, downloads the CycloneDX and SPDX attestations for each, and uploads them to a date-partitioned prefix in the bucket:

```
s3cmd put sbom-2026-02-example-service-sha256-abc123.cyclonedx.json \
  s3://golemtrust-sbom-archive/2026/02/example-service/sha256-abc123.cyclonedx.json

s3cmd put sbom-2026-02-example-service-sha256-abc123.spdx.json \
  s3://golemtrust-sbom-archive/2026/02/example-service/sha256-abc123.spdx.json
```

The CronJob manifest and archive script live in `golem-trust/platform/jobs/sbom-archive/`. Cheery monitors the monthly archive job completion via a Grafana alert; a failed archive job creates a PagerDuty incident routed to Dr. Crucible.
Last updated: 20 March 2026
