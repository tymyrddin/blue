# Scanner integration

Cheery's requirement was clear: every scanner must feed into DefectDojo automatically, without manual CSV downloads or copy-and-paste. The goal is that when a vulnerability is found, it appears in DefectDojo within minutes, not days. This runbook covers the integration configuration for each scanner: Trivy (container images), OpenVAS/Greenbone (infrastructure), GitLab SAST (application code), Wazuh (host OS packages), and manual penetration test imports. Each scanner uses DefectDojo's import API with a dedicated token stored in Vault, and failures alert Cheery via Graylog.

## DefectDojo import API

All scanner integrations use the same API endpoint. The key parameters are:

- `scan_type`: the scanner type identifier that DefectDojo uses to select the correct parser
- `engagement`: the ID of the Engagement to import into (obtain from the DefectDojo UI or API)
- `file`: the scan results file
- `active`: whether to mark imported findings as active (always `true` for automated imports)
- `verified`: whether to mark findings as verified (leave `false` for automated imports; set `true` after human review)

```
curl -X POST https://defectdojo.golemtrust.am/api/v2/import-scan/ \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  -F "scan_type=Trivy Scan" \
  -F "engagement=42" \
  -F "file=@trivy-results.json" \
  -F "active=true" \
  -F "verified=false" \
  -F "close_old_findings=true"
```

The `close_old_findings=true` parameter causes DefectDojo to close findings from previous scans of this engagement that are no longer present in the current results. This is essential for tracking remediated vulnerabilities accurately.

## Trivy: container image scanning

Trivy runs as a step in every container image build pipeline in GitLab CI. The pipeline step produces a JSON report, then posts it to DefectDojo.

GitLab CI step (`trivy-scan` job):

```
trivy-scan:
  stage: security
  image: aquasec/trivy:0.50.0
  script:
    - trivy image --format json --output trivy-results.json ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}
    - |
      curl -X POST https://defectdojo.golemtrust.am/api/v2/import-scan/ \
        -H "Authorization: Token ${DEFECTDOJO_TRIVY_TOKEN}" \
        -F "scan_type=Trivy Scan" \
        -F "engagement=${DEFECTDOJO_CONTAINERS_ENGAGEMENT_ID}" \
        -F "file=@trivy-results.json" \
        -F "active=true" \
        -F "verified=false" \
        -F "close_old_findings=true"
  artifacts:
    paths:
      - trivy-results.json
    expire_in: 7 days
  allow_failure: false
```

`DEFECTDOJO_TRIVY_TOKEN` is stored as a protected GitLab CI variable, fetched from Vault at pipeline start. `DEFECTDOJO_CONTAINERS_ENGAGEMENT_ID` is the numeric ID of the Containers product engagement for continuous CI scans.

## OpenVAS/Greenbone: infrastructure scanning

OpenVAS runs weekly scans of the Golem Trust server inventory. After each scan completes, an export script pulls the XML report via the Greenbone Management Protocol and posts it to DefectDojo.

The export and import script, run on the OpenVAS host:

```
#!/bin/bash
set -euo pipefail

SCAN_ID="${1}"
REPORT_FORMAT_ID="a994b278-1f62-11e1-96ac-406186ea4fc5"  # OpenVAS XML format

# Export the report
gvm-cli --gmp-username admin --gmp-password "${GVM_PASSWORD}" \
  socket --socketpath /run/gvmd/gvmd.sock \
  --xml "<get_reports report_id=\"${SCAN_ID}\" format_id=\"${REPORT_FORMAT_ID}\"/>" \
  | xmllint --xpath "//report" - > /tmp/openvas-report.xml

# Import to DefectDojo
curl -X POST https://defectdojo.golemtrust.am/api/v2/import-scan/ \
  -H "Authorization: Token ${DEFECTDOJO_OPENVAS_TOKEN}" \
  -F "scan_type=OpenVAS Parser" \
  -F "engagement=${DEFECTDOJO_INFRASTRUCTURE_ENGAGEMENT_ID}" \
  -F "file=@/tmp/openvas-report.xml" \
  -F "active=true" \
  -F "verified=false" \
  -F "close_old_findings=true"

rm /tmp/openvas-report.xml
```

This script is triggered by a cron job on the OpenVAS host 30 minutes after each scheduled scan window closes, allowing time for the scan to complete. Ponder reviews the engagement monthly to ensure all server IP ranges are covered.

## GitLab SAST: application source code

GitLab's built-in SAST produces a `gl-sast-report.json` file as a CI artefact. A downstream pipeline step imports it into DefectDojo:

```
defectdojo-sast-import:
  stage: post-security
  image: curlimages/curl:8.5.0
  needs:
    - job: sast
      artifacts: true
  script:
    - |
      curl -X POST https://defectdojo.golemtrust.am/api/v2/import-scan/ \
        -H "Authorization: Token ${DEFECTDOJO_GITLAB_SAST_TOKEN}" \
        -F "scan_type=GitLab SAST Report" \
        -F "engagement=${DEFECTDOJO_APPLICATIONS_ENGAGEMENT_ID}" \
        -F "file=@gl-sast-report.json" \
        -F "active=true" \
        -F "verified=false" \
        -F "close_old_findings=true"
  allow_failure: false
```

GitLab SAST must be enabled in the project's `gitlab-ci.yml` via the `include: template: Security/SAST.gitlab-ci.yml` directive. For the Royal Bank integration services, the findings are imported to the `Royal-Bank-Integration` product engagement instead.

## Wazuh: host OS package CVEs

Wazuh's vulnerability detection module identifies CVEs in installed OS packages. A custom integration script in `/var/ossec/integrations/` runs when Wazuh generates a CVE alert and posts the finding to DefectDojo.

The integration script at `/var/ossec/integrations/defectdojo-vuln.py`:

```
import json
import sys
import requests

DEFECTDOJO_URL = "https://defectdojo.golemtrust.am/api/v2/import-scan/"
DEFECTDOJO_TOKEN = open("/var/ossec/etc/defectdojo-token").read().strip()
INFRASTRUCTURE_ENGAGEMENT_ID = 12

def post_finding(alert_data):
    # Convert Wazuh alert format to Generic Findings Import JSON
    finding = {
        "title": alert_data.get("data", {}).get("vulnerability", {}).get("cve", "Unknown CVE"),
        "severity": alert_data.get("rule", {}).get("level_label", "medium").capitalize(),
        "description": json.dumps(alert_data, indent=2),
        "date": alert_data.get("timestamp", "")[:10],
    }
    payload = {"findings": [finding]}

    with open("/tmp/wazuh-finding.json", "w") as f:
        json.dump(payload, f)

    response = requests.post(
        DEFECTDOJO_URL,
        headers={"Authorization": f"Token {DEFECTDOJO_TOKEN}"},
        files={
            "file": open("/tmp/wazuh-finding.json", "rb"),
            "scan_type": (None, "Generic Findings Import"),
            "engagement": (None, str(INFRASTRUCTURE_ENGAGEMENT_ID)),
            "active": (None, "true"),
            "verified": (None, "false"),
        },
        timeout=30,
    )
    response.raise_for_status()

alert = json.loads(open(sys.argv[1]).read())
post_finding(alert)
```

The Wazuh `ossec.conf` integration stanza triggers this script for alerts with rule groups containing `vulnerability-detector`:

```
<integration>
  <name>defectdojo-vuln</name>
  <hook_url>https://defectdojo.golemtrust.am/api/v2/import-scan/</hook_url>
  <rule_id>23501</rule_id>
  <alert_format>json</alert_format>
</integration>
```

## Manual penetration test findings

Penetration test results, whether from Dr. Crucible's internal team or external testers, are imported via the DefectDojo UI using "Generic Findings Import" with a manually prepared JSON file, or via the API for bulk imports. The `pentest-import-token` is used for this purpose. Findings are always set to `verified=true` and reviewed before import.

## Error handling and alerting

Every scanner integration script must log success or failure. Failures alert Cheery via Graylog.

A Graylog alert condition on the "DefectDojo Integrations" stream fires if no successful import message is received from a given scanner within its expected window:

```
Alert: Trivy-Import-Missing
Condition: message_count < 1
Time range: 24 hours
Filter: source:ci-runner AND message:"DefectDojo import successful" AND scanner:trivy
```

Similar alerts exist for OpenVAS (7-day window, matching the weekly scan schedule), Wazuh (1-hour window, since Wazuh alerts are continuous), and GitLab SAST (24-hour window).

When a scanner integration fails, the error is logged to `/var/log/defectdojo-integrations/` on the relevant host and the Graylog alert notifies Cheery. She investigates and resolves before the next scan window, to avoid missing findings.
