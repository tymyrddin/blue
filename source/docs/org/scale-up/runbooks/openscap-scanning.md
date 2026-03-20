# OpenSCAP scanning

Runbook for configuring and running OpenSCAP compliance scans against Golem Trust infrastructure. OpenSCAP evaluates host configuration against a defined security profile and produces a report showing which controls pass, which fail, and which are not applicable. Scans run weekly. Results feed into DefectDojo for tracking remediation over time. Otto Chriek retains all scan reports as part of the ISO 27001 audit trail.

## Installation

Install OpenSCAP on each managed host via Ansible. The `openscap-scanner` package provides the `oscap` command:

```
- name: Install OpenSCAP
  ansible.builtin.package:
    name:
      - openscap-scanner
      - scap-security-guide
    state: present
```

The `scap-security-guide` package provides the SCAP content files (XCCDF profiles, OVAL definitions) for Debian. After installation, the content is available at `/usr/share/xml/scap/ssg/content/`.

Verify the available profiles:

```
oscap info /usr/share/xml/scap/ssg/content/ssg-debian12-ds.xml
```

## Running a scan

Run an OpenSCAP scan against the CIS Level 1 profile for Debian 12:

```
oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_cis_level1_server \
  --results /var/lib/openscap/results-$(hostname)-$(date +%Y%m%d).xml \
  --report /var/lib/openscap/report-$(hostname)-$(date +%Y%m%d).html \
  /usr/share/xml/scap/ssg/content/ssg-debian12-ds.xml
```

The scan produces two outputs: an XML results file (machine-readable, suitable for DefectDojo import) and an HTML report (human-readable, suitable for audit review). Both are stored under `/var/lib/openscap/`.

The scan exit code indicates the overall result: `0` means all checks passed, `2` means some checks failed. The pipeline treats exit code `2` as a warning rather than a failure; the report is reviewed to determine whether failures are known exceptions or new issues.

## Ansible-managed scan schedule

The `openscap` role deploys a weekly scan script to each host and schedules it via cron. The scan runs on Sundays at 03:00 (after the maintenance reboot window):

```
0 3 * * 0 /usr/local/bin/openscap-scan.sh >> /var/log/openscap-scan.log 2>&1
```

The scan script:

```
#!/bin/bash
set -euo pipefail

CONTENT="/usr/share/xml/scap/ssg/content/ssg-debian12-ds.xml"
PROFILE="xccdf_org.ssgproject.content_profile_cis_level1_server"
DATE=$(date +%Y%m%d)
HOSTNAME=$(hostname -s)
RESULTS_DIR="/var/lib/openscap"

mkdir -p "$RESULTS_DIR"

oscap xccdf eval \
  --profile "$PROFILE" \
  --results "${RESULTS_DIR}/results-${HOSTNAME}-${DATE}.xml" \
  --report "${RESULTS_DIR}/report-${HOSTNAME}-${DATE}.html" \
  "$CONTENT" || true

# Ship results XML to DefectDojo
curl -sf \
  -H "Authorization: Token ${DEFECTDOJO_API_KEY}" \
  -F "file=@${RESULTS_DIR}/results-${HOSTNAME}-${DATE}.xml" \
  -F "scan_type=OpenSCAP Vulnerability Scan" \
  -F "product_name=Infrastructure" \
  -F "engagement_name=${HOSTNAME}-weekly" \
  -F "auto_create_context=true" \
  "https://defectdojo.golemtrust.am/api/v2/import-scan/"
```

`|| true` after the `oscap` command prevents the script from exiting on a non-zero result code (which `oscap` returns for any failed check). The results are uploaded regardless of the pass/fail outcome.

`DEFECTDOJO_API_KEY` is set as an environment variable by the Ansible role, retrieved from Vault at `kv/golemtrust/defectdojo-api-key`.

## Custom tailoring

Some CIS controls are not applicable to Golem Trust's configuration (for example, controls for services that are not installed). OpenSCAP supports tailoring files that mark specific rules as not applicable.

Create a tailoring file at `roles/openscap/files/golemtrust-tailoring.xml`:

```
<?xml version="1.0" encoding="UTF-8"?>
<xccdf:Tailoring xmlns:xccdf="http://checklists.nist.gov/xccdf/1.2"
                 id="xccdf_golemtrust_tailoring">
  <xccdf:benchmark href="/usr/share/xml/scap/ssg/content/ssg-debian12-ds.xml"/>
  <xccdf:Profile id="xccdf_golemtrust_profile_cis_tailored"
                 extends="xccdf_org.ssgproject.content_profile_cis_level1_server">
    <xccdf:title>Golem Trust CIS Level 1 (Tailored)</xccdf:title>
    <!-- Wazuh agent provides equivalent audit functionality; auditd not deployed -->
    <xccdf:select idref="xccdf_org.ssgproject.content_rule_service_auditd_enabled"
                  selected="false"/>
    <!-- IPv6 is intentionally disabled infrastructure-wide -->
    <xccdf:select idref="xccdf_org.ssgproject.content_rule_sysctl_net_ipv6_conf_all_disable_ipv6"
                  selected="false"/>
  </xccdf:Profile>
</xccdf:Tailoring>
```

Pass the tailoring file to the scan:

```
oscap xccdf eval \
  --tailoring-file /etc/openscap/golemtrust-tailoring.xml \
  --profile xccdf_golemtrust_profile_cis_tailored \
  ...
```

Any new tailoring exclusion requires approval from Ludmilla and a comment in the tailoring file documenting the compensating control. Otto Chriek reviews the tailoring file as part of the quarterly audit.

## Reviewing scan results

After each weekly scan cycle, Cheery reviews the DefectDojo findings dashboard for new failures. DefectDojo deduplicates findings across scans and tracks whether findings are new, recurring, or remediated.

A finding that appears on a host where it previously passed indicates configuration drift: something changed on that host since the last scan. This triggers the drift remediation workflow (see the remediation workflows runbook).

A finding that appears on all hosts simultaneously indicates the Ansible playbooks do not fully cover that control, or that a new version of the SCAP content has added a check that was not previously tested. These are addressed by updating the `cis-debian` role.

Findings that are confirmed as not applicable (false positives for Golem Trust's specific configuration) are added to the tailoring file rather than suppressed in DefectDojo, so that the tailoring file remains the single authoritative record of accepted exceptions.
