# SBOM generation

Runbook for generating and managing Software Bills of Materials using Syft. An SBOM is a list of every component in a software artefact: operating system packages, language libraries, binaries, and their versions. When a new vulnerability is announced, the SBOM makes it possible to answer the question "which of our images contains the affected component?" in seconds. This capability was specifically requested by Cheery after the `totally-not-malware` incident revealed that nobody knew what was in any of the images.

## Syft installation

Install Syft on CI/CD runner nodes and on the Harbor instance for standalone scans:

```
SYFT_VERSION="1.14.0"
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh \
  | sh -s -- -b /usr/local/bin "v${SYFT_VERSION}"
```

Verify: `syft version`

## SBOM generation in CI/CD

Add SBOM generation to the build pipeline after the image is built and scanned:

```
      - name: Generate SBOM
        run: |
          syft registry.golemtrust.am/golemtrust-prod/${{ github.event.repository.name }}:${{ github.sha }} \
            -o spdx-json=sbom.spdx.json \
            -o cyclonedx-json=sbom.cyclonedx.json

      - name: Attest SBOM with Cosign
        run: |
          cosign attest \
            --yes \
            --predicate sbom.spdx.json \
            --type spdx \
            registry.golemtrust.am/golemtrust-prod/${{ github.event.repository.name }}:${{ github.sha }}

      - name: Upload SBOM as pipeline artefact
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: |
            sbom.spdx.json
            sbom.cyclonedx.json
          retention-days: 365
```

The `cosign attest` step attaches the SBOM to the image in Harbor as a signed attestation. The SBOM travels with the image: wherever the image goes, its provenance record goes with it.

Both SPDX and CycloneDX formats are generated. SPDX is the more established format and is required by some regulatory frameworks. CycloneDX is better supported by vulnerability management tooling. Produce both and let consumers choose.

## Querying SBOMs

To retrieve the SBOM for an image currently in Harbor:

```
cosign download attestation \
  --predicate-type https://spdx.dev/Document \
  registry.golemtrust.am/golemtrust-prod/keycloak-app:abc1234 \
  | jq -r '.payload' | base64 -d | jq .
```

To search an SBOM for a specific package:

```
cosign download attestation \
  --predicate-type https://spdx.dev/Document \
  registry.golemtrust.am/golemtrust-prod/keycloak-app:abc1234 \
  | jq -r '.payload' | base64 -d \
  | jq '.predicate.packages[] | select(.name == "libssl3") | {name, versionInfo}'
```

This returns the version of `libssl3` in the image. When a new OpenSSL vulnerability is announced, run this query against all production images to identify affected ones immediately.

## Vulnerability impact analysis

When a CVE is announced, use Grype (Anchore's vulnerability scanner, which pairs with Syft) to scan SBOMs for affected packages:

```
apt install -y grype
grype sbom:sbom.spdx.json --only-fixed
```

To scan all current production images, run Grype against Harbor directly:

```
for IMAGE in $(harbor-cli list-images golemtrust-prod); do
  echo "Scanning: $IMAGE"
  grype "$IMAGE" --output table --severity critical,high
done
```

The `harbor-cli` is a small wrapper script in `src/harbor-tools/` in the internal repository. It lists all image tags in a Harbor project using the Harbor API.

## SBOM storage

SBOMs are stored in three places:

In Harbor: as Cosign attestations attached to each image. These are the authoritative source and are retained as long as the image is retained.

In the CI/CD pipeline artefacts: for 365 days per the upload-artifact step above.

In a dedicated Hetzner Object Storage bucket (`sbom-archive.golemtrust.am`): for long-term retention. An export script runs weekly and pushes all SBOMs from the current production images to the bucket:

```
#!/bin/bash
set -euo pipefail

BUCKET="sbom-archive.golemtrust.am"
DATE=$(date +%Y-%m-%d)

for IMAGE in $(harbor-cli list-images golemtrust-prod); do
  SAFE_NAME=$(echo "$IMAGE" | tr '/:' '__')
  cosign download attestation \
    --predicate-type https://spdx.dev/Document \
    "registry.golemtrust.am/golemtrust-prod/${IMAGE}" \
    2>/dev/null \
    | jq -r '.payload' | base64 -d \
    > "/tmp/sbom_${SAFE_NAME}.spdx.json"

  aws s3 cp "/tmp/sbom_${SAFE_NAME}.spdx.json" \
    "s3://${BUCKET}/${DATE}/${SAFE_NAME}.spdx.json" \
    --endpoint-url https://fsn1.your-objectstorage.com
done
```

The Hetzner Object Storage S3-compatible endpoint is used with standard AWS CLI tools.

## Base image SBOM review

When a new base image version is approved for the `base-images` project, Ludmilla reviews its SBOM before approving the image. The review checks:

- No unexpected packages are present (a Redis base image should not include curl, wget, or compiler toolchains)
- No packages with known Critical or High CVEs that cannot be immediately mitigated
- The OS package list is minimal; debian:slim variants are preferred over full distributions

The review is documented as a comment in the Harbor project when the image is approved. Ludmilla's sign-off is required before Cosign signing with the manual approval key.

## Monthly SBOM drift report

Cheery generates a monthly report comparing the SBOM of the current production image for each service against the SBOM from the previous month. The report highlights:

- New packages added (should correspond to deliberate dependency updates)
- Packages removed
- Version changes

Packages that appear without a corresponding pull request updating dependencies are flagged for investigation. Unexplained additions to a production image's package list are a supply chain integrity concern.
