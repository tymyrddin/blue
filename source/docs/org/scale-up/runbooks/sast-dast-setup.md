# SAST and DAST setup

Runbook for configuring static and dynamic application security testing in GitLab pipelines. SAST analyses source code for security vulnerabilities without running the application. DAST tests a running application from the outside, simulating an attacker. Together they cover different classes of vulnerability: SAST finds what looks wrong in the code; DAST finds what breaks when the code runs.

## GitLab SAST

GitLab CE includes SAST scanning via the `gitlab-org/security-products/analyzers` suite. These are open-source tools wrapped with GitLab's reporting format. Include SAST in any application pipeline by including the GitLab-managed template:

```
include:
  - template: Security/SAST.gitlab-ci.yml

stages:
  - test
  - security

variables:
  SAST_EXCLUDED_PATHS: "spec, test, tests, tmp"
  SAST_EXCLUDED_ANALYZERS: ""
  SECURE_ANALYZERS_PREFIX: "registry.golemtrust.am/ghcr-cache/security-products"
```

The `SECURE_ANALYZERS_PREFIX` overrides the default analyser image source to use Harbor's cache of the GitHub Container Registry, rather than pulling directly from `ghcr.io`. This keeps all image pulls within Harbor.

GitLab CE does not include the SAST vulnerability dashboard (that is a paid feature). Instead, SAST reports are published as pipeline artefacts and reviewed in merge request comments. The template generates a `gl-sast-report.json` artefact automatically.

## Language-specific SAST tools

The SAST template automatically selects analysers based on the languages detected in the repository. Key analysers used at Golem Trust:

Semgrep: detects vulnerability patterns in Python, JavaScript, TypeScript, Go. Catches common patterns such as SQL injection, XSS, insecure deserialization, and hardcoded credentials. Rules are updated when the Semgrep Docker image is updated in Harbor.

Bandit: Python-specific analysis. Flags use of `eval`, insecure hash functions, SQL string formatting, and subprocess shell injection.

Gosec: Go-specific analysis. Checks for integer overflows, SQL injection via string formatting, and use of weak cryptographic primitives.

To customise Semgrep rules, add a `.semgrep.yml` to the repository root:

```
rules:
  - id: golemtrust-hardcoded-secret-pattern
    pattern: |
      $KEY = "ht_..."
    message: "Possible Golem Trust API key hardcoded in source"
    languages: [python, javascript, go]
    severity: ERROR
```

## GitLab DAST

DAST is configured for services that expose an HTTP interface. It requires a running instance of the application. In GitLab pipelines, this is achieved by deploying to the staging environment and then running the DAST scan against it.

Add DAST to pipelines for services with a web interface:

```
include:
  - template: Security/DAST.gitlab-ci.yml

dast:
  stage: dast
  environment:
    name: staging
  variables:
    DAST_WEBSITE: https://staging.golemtrust.am
    DAST_FULL_SCAN_ENABLED: "false"
    DAST_BROWSER_SCAN: "true"
    DAST_EXCLUDE_URLS: "https://staging.golemtrust.am/logout,https://staging.golemtrust.am/auth"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

`DAST_FULL_SCAN_ENABLED: "false"` runs a passive scan only on pull requests. Full active scanning (which generates actual attack traffic) runs only on scheduled pipelines against the staging environment, not on every commit.

`DAST_EXCLUDE_URLS` prevents the scanner from logging out of its test session or triggering authentication flows that would disrupt other testing.

The DAST scanner is OWASP ZAP, run as a container. The image is pulled from `registry.golemtrust.am/dockerhub-cache/owasp/zap2docker-stable`.

## Handling SAST and DAST findings

SAST findings appear as annotations in merge request diffs when using GitLab CE with the artefact format. Reviewers see flagged lines inline.

Critical SAST findings fail the pipeline automatically via the `SAST_EXCLUDED_PATHS` and severity threshold configuration:

```
variables:
  SAST_SEVERITY_THRESHOLD: "high"
```

This causes the `sast` job to exit with a non-zero code if any High or Critical findings are present that are not present in the base branch. New findings block the merge.

DAST findings are reviewed manually after each full scan. The scan report (`gl-dast-report.json`) is published as a pipeline artefact with a 90-day retention period. Cheery reviews full scan reports weekly.

False positives are suppressed by adding a `.gl-sast-ignore` file to the repository. Each suppression must include a comment with the reviewer's name and a review date:

```
{
  "vulnerabilities": [
    {
      "id": "<finding-id-from-report>",
      "comment": "False positive: pattern matches test fixture. Reviewed: ludmilla.katzenzungen, 2026-03-15"
    }
  ]
}
```

## Scheduled full scans

Daily SAST runs on merge requests catch new issues. Weekly full scans catch issues in unchanged code that new rule updates would flag. Schedule a weekly pipeline:

```
sast-scheduled:
  extends: .sast-analyser
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
  variables:
    SAST_EXCLUDED_PATHS: ""
    SEARCH_MAX_DEPTH: 10
```

Configure the schedule in GitLab under the project's CI/CD Schedules: run every Monday at 05:00.

The scheduled scan results are emailed to the `#security-alerts` channel in the team chat via a GitLab webhook. Any new Critical findings trigger a Graylog alert.
Last updated: 10 July 2026
