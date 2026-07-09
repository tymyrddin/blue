# Trivy integration

Runbook for configuring Trivy vulnerability scanning across the image pipeline. Trivy is embedded in Harbor for registry-level scanning and also runs as a standalone tool in CI/CD pipelines. Critical and high severity vulnerabilities block image promotion. This policy has no manual override without security team approval. Sam Vimes Jr. was informed of this.

## Trivy in Harbor

Harbor's built-in Trivy scanner runs automatically when an image is pushed, when a scheduled scan is triggered, or when manually requested. Configuration is in the Harbor admin console under Interrogation Services.

Ensure the Trivy adapter is listed and active. Click Edit to configure:

- Skip update on failure: disabled (if the vulnerability database cannot be updated, scans fail)
- Ignore unfixed vulnerabilities: disabled (vulnerabilities without a fix are still reported; whether they block promotion is a policy decision, not a Trivy decision)
- Insecure registry: disabled
- GitHub token: add a GitHub personal access token to avoid rate limiting when Trivy downloads the vulnerability database

The vulnerability database updates automatically every 12 hours. Harbor downloads the Trivy database from GitHub Releases. The GitHub token in Vaultwarden (collection: Infrastructure, item: Trivy GitHub token) should be a fine-grained token with only public repository read access.

## Automatic scanning policy

Configure Harbor to scan all images on push. Navigate to each production project, then Configuration, then Automatically scan images on push: enabled.

Configure the vulnerability threshold that blocks image promotion. In the project's Configuration tab, set:

- Prevent vulnerable images from running: enabled
- Severity: High

This blocks any image with a Critical or High severity vulnerability from being pulled from the production project. Images with Medium, Low, or Negligible findings can be pulled, but those findings are visible in the scan report and must be reviewed during the quarterly vulnerability review.

## Standalone Trivy in CI/CD

CI/CD pipelines run Trivy before pushing to Harbor, providing a faster feedback loop than waiting for Harbor's post-push scan. Add a Trivy scan step to the pipeline workflow file:

```
name: Container build and scan

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-and-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build image
        run: docker build -t ${{ github.repository }}:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ github.repository }}:${{ github.sha }}
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH
          exit-code: 1
          ignore-unfixed: false

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-results.sarif
```

`exit-code: 1` causes the pipeline to fail if Critical or High findings are present. The `if: always()` on the upload step ensures scan results are uploaded even when the pipeline fails, so developers can see what was found.

## Filesystem and repository scanning

Trivy scans more than container images. Configure it to scan the codebase for vulnerabilities in dependencies:

```
name: Dependency scan

on:
  schedule:
    - cron: '0 6 * * 1'
  push:
    branches: [main]

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Trivy filesystem scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .
          format: sarif
          output: trivy-fs-results.sarif
          severity: CRITICAL,HIGH
          exit-code: 0

      - name: Upload results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-fs-results.sarif
```

`exit-code: 0` for filesystem scans means they do not block the pipeline but still report findings. Dependency vulnerabilities require remediation but are handled via the vulnerability management procedures (separate runbook).

## Trivy configuration file

Create a `.trivyignore` file in each repository for known false positives that have been reviewed and accepted. Document each entry with a reason and an expiry date:

```
# CVE-2023-XXXXX - affects only Windows builds, not applicable to Linux containers
# Accepted: 2026-01-15, Review by: ludmilla.katzenzungen, Expires: 2026-07-15
CVE-2023-XXXXX
```

Entries without an expiry date are not accepted. The quarterly vulnerability review checks that no `.trivyignore` entry has passed its expiry date without being reviewed.

Create `trivy.yaml` in the repository root to standardise scanner configuration:

```
vulnerability:
  type:
    - os
    - library
  ignore-unfixed: false

secret:
  config: trivy-secret.yaml

misconfiguration:
  exit-code: 0

format: sarif
```

## Vulnerability database update monitoring

The Trivy vulnerability database must stay current. Harbor updates it every 12 hours automatically. Add a Prometheus alert for stale database:

```
- alert: TrivyDatabaseStale
  expr: time() - harbor_trivy_db_last_update_timestamp > 86400
  for: 0m
  labels:
    severity: warning
  annotations:
    summary: "Trivy vulnerability database has not updated in 24 hours"
    description: >
      Harbor's Trivy scanner has not updated its vulnerability database in over 24 hours.
      Scans may be missing recently disclosed CVEs. Check the Harbor admin console under
      Interrogation Services.
```

This metric requires the Harbor Prometheus exporter to be enabled. Navigate to Administration, then Configuration, and enable the metrics endpoint.

## Scheduled full scan

Schedule a weekly full scan of all images in Harbor to catch vulnerabilities disclosed since the images were first pushed. Navigate to Interrogation Services, then Scheduled Scan, and set a weekly schedule (Sunday at 01:00).

The weekly scan produces a large number of results if base images have not been updated recently. Review the scan results on Monday morning. Images with new Critical findings that were not present when the image was promoted require immediate attention; see the vulnerability management procedures runbook.
