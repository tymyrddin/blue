# Security scanning integration

Runbook for integrating TruffleHog secret detection and OWASP Dependency-Check into GitLab pipelines. These tools 
address the two failure modes that triggered this security programme: credentials committed to source control 
(TruffleHog), and vulnerable dependencies introduced without review (Dependency-Check). Both run on every pipeline; 
both block the merge if they find critical issues.

## TruffleHog secret detection

TruffleHog scans git history and working tree for secrets: API keys, passwords, private keys, and high-entropy strings 
that match known credential patterns. It runs both in CI and as a pre-commit hook on developer workstations.

Add TruffleHog to the pipeline. The `trufflehog` job runs as an early stage so secrets are caught before test or 
build jobs execute:

```
stages:
  - secrets
  - test
  - build
  - security

trufflehog:
  stage: secrets
  image: registry.golemtrust.am/dockerhub-cache/trufflesecurity/trufflehog:latest
  script:
    - trufflehog git file://. --since-commit HEAD~1 --only-verified --fail
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

`--since-commit HEAD~1` scans only the commits in the current push. Full history scans are run weekly (see below).

`--only-verified` reduces false positives by only flagging credentials that TruffleHog has confirmed are valid by testing them against the relevant API. This means a rotated credential that is no longer valid will not block the pipeline. The trade-off is that some real leaked secrets may not be flagged until they are tested; the pre-commit hook (which scans without verification) acts as a second layer.

`--fail` causes TruffleHog to exit with code 1 if any verified secrets are found, failing the pipeline job.

TruffleHog supports a configuration file to suppress known false positives and add custom detectors. Create `.trufflehog.yml` in the repository root:

```
detectors:
  - name: GolemTrustAPIKey
    keywords:
      - "ht_"
    regex:
      secret: 'ht_[a-zA-Z0-9]{32,}'
    verify:
      - endpoint: https://api.golemtrust.am/v1/auth/verify
        headers:
          - "Authorization: Bearer {{.Secret}}"
        successRanges:
          - "200-299"
```

This custom detector catches Golem Trust internal API keys even before they match generic high-entropy patterns.

## Weekly full history scan

The commit-range scan in merge request pipelines is fast but does not re-examine history. Run a weekly full scan across all repositories to catch any credentials that were committed before TruffleHog was introduced:

```
trufflehog-full-scan:
  stage: secrets
  image: registry.golemtrust.am/dockerhub-cache/trufflesecurity/trufflehog:latest
  script:
    - trufflehog git file://. --only-verified --fail
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
```

Schedule this in GitLab under CI/CD Schedules: run every Sunday at 02:00. If the scan fails, it creates a GitLab security finding and triggers a Graylog alert.

## OWASP Dependency-Check

OWASP Dependency-Check analyses project dependencies against the National Vulnerability Database and other sources. It produces a report of known CVEs in the packages used by the application.

The Dependency-Check Docker image pulls the NVD database on first run. To avoid NVD rate limits and ensure the database is current, maintain a shared database volume on the privileged runner instances:

```
dependency-check:
  stage: security
  tags:
    - docker-build
  image: registry.golemtrust.am/dockerhub-cache/owasp/dependency-check:latest
  script:
    - /usr/share/dependency-check/bin/dependency-check.sh
        --project "$CI_PROJECT_NAME"
        --scan .
        --format HTML
        --format JSON
        --out reports/
        --nvdApiKey "$NVD_API_KEY"
        --failOnCVSS 7
  artifacts:
    when: always
    paths:
      - reports/
    expire_in: 90 days
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

`--failOnCVSS 7` causes the job to fail if any dependency has a CVSS score of 7.0 or above (High or Critical). The `$NVD_API_KEY` variable is set as a masked GitLab group-level CI/CD variable. An NVD API key is required to avoid rate limiting; register one at nvd.nist.gov.

The `when: always` on artefacts ensures the HTML report is available even when the job fails, so developers can see which dependency caused the failure.

## Dependency-Check false positive suppression

Dependency-Check occasionally flags false positives, particularly for dependencies where the CPE (Common Platform Enumeration) identifier is ambiguous. Suppress confirmed false positives with a suppression file in the repository:

```
<?xml version="1.0" encoding="UTF-8"?>
<suppressions xmlns="https://jeremylong.github.io/DependencyCheck/dependency-suppression.1.3.xsd">
  <suppress until="2026-09-01Z">
    <notes>
      CVE-YYYY-NNNNN is specific to Windows builds of this library.
      Our deployment is Linux-only. Reviewed by ludmilla.katzenzungen, 2026-03-15.
    </notes>
    <cve>CVE-YYYY-NNNNN</cve>
  </suppress>
</suppressions>
```

Pass the suppression file to the scan:

```
--suppression suppression.xml
```

The `until` attribute automatically expires the suppression on the given date. Any suppression without an expiry date is flagged during the quarterly vulnerability review and must be given one or removed.

## Graylog integration

TruffleHog and Dependency-Check findings feed into Graylog via GitLab webhooks. Configure a webhook in GitLab at the group level (Settings, then Webhooks) pointing to a Graylog HTTP input:

- URL: `https://graylog.golemtrust.am/api/2.0/inputs/http/<input-id>/messages`
- Trigger on: Pipeline events, Job events
- SSL verification: enabled

Create a Graylog stream for pipeline security findings. Apply an alert condition: if any pipeline event with `status: failed` and `stage: secrets` arrives, send a Graylog alert to the `#security-alerts` channel immediately. A secret detection failure is treated as an incident.

Dependency-Check failures on the `main` branch also trigger an alert. Dependency-Check failures on merge requests do not alert immediately (they appear in the merge request and are the developer's responsibility to resolve).
