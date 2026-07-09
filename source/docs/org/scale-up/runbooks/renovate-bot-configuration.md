# Renovate Bot configuration

Runbook for deploying and configuring Renovate Bot to automate dependency updates across all Golem Trust repositories. Outdated dependencies are a persistent source of vulnerabilities. Manual dependency updates are easy to defer indefinitely. Renovate monitors dependency files, opens merge requests when updates are available, and can auto-merge low-risk updates when tests pass. This keeps the dependency attack surface current without requiring developers to remember to update things.

## Deployment

Renovate is deployed as a scheduled GitLab CI job in a dedicated `renovate-bot` repository in the `golemtrust` group. This self-hosted approach means Renovate runs with a GitLab access token rather than a GitHub App, which suits the self-hosted GitLab setup.

Create the `renovate-bot` repository. Add a `.gitlab-ci.yml`:

```
renovate:
  image: registry.golemtrust.am/dockerhub-cache/renovate/renovate:latest
  script:
    - renovate
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
  variables:
    RENOVATE_PLATFORM: gitlab
    RENOVATE_ENDPOINT: https://gitlab.golemtrust.am/api/v4
    RENOVATE_TOKEN: $RENOVATE_GITLAB_TOKEN
    LOG_LEVEL: info
```

Schedule this pipeline to run every six hours: navigate to CI/CD Schedules in the `renovate-bot` project and create a schedule with cron `0 */6 * * *`.

`RENOVATE_GITLAB_TOKEN` is a GitLab personal access token created for a dedicated `renovate-bot` service account. The account needs `Developer` role in each project Renovate manages (to open merge requests) and `read_api` access. Store the token in Vault at `kv/golemtrust/renovate` and inject it as a masked GitLab CI/CD variable.

## Global configuration

Add a `config.js` to the `renovate-bot` repository:

```
module.exports = {
  platform: 'gitlab',
  endpoint: 'https://gitlab.golemtrust.am/api/v4',
  gitAuthor: 'Renovate Bot <renovate@golemtrust.am>',
  repositories: [
    'golemtrust/keycloak-app',
    'golemtrust/payments-service',
    'golemtrust/golem-auth-spi',
  ],
  onboarding: true,
  onboardingConfig: {
    extends: ['config:base']
  },
  requireConfig: 'optional',
  labels: ['dependencies', 'renovate'],
  reviewers: [],
  assignees: [],
  dependencyDashboard: true,
  dependencyDashboardTitle: 'Dependency Dashboard',
};
```

`onboarding: true` causes Renovate to open an onboarding merge request in each new repository, proposing a `renovate.json` configuration file. Accepting the merge request opts that repository into Renovate management.

`dependencyDashboard: true` creates a single "Dependency Dashboard" issue in each repository listing all pending updates and allowing manual triggering of specific updates. Developers use this to see what is queued without being bombarded with merge requests.

## Per-repository configuration

Each managed repository has a `renovate.json` in its root. The base configuration that Renovate proposes during onboarding is customised to match Golem Trust's merge policies:

```
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "schedule": ["after 9am and before 5pm on weekdays"],
  "timezone": "Europe/London",
  "prConcurrentLimit": 3,
  "branchConcurrentLimit": 5,
  "automerge": false,
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "matchCurrentVersion": "!/^0/",
      "automerge": true,
      "automergeType": "pr",
      "requiredStatusChecks": null,
      "minimumReleaseAge": "3 days"
    },
    {
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true,
      "minimumReleaseAge": "3 days"
    },
    {
      "matchPackagePatterns": ["*"],
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "addLabels": ["major-update", "needs-review"]
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "automerge": false,
    "labels": ["security", "vulnerability"]
  }
}
```

Key policies in this configuration:

Patch updates for stable packages (version 1.0.0 and above) auto-merge after 3 days if the pipeline passes. This handles the stream of minor security patches and bug fixes that would otherwise accumulate.

Minor updates to devDependencies (test frameworks, build tools) also auto-merge after 3 days. These rarely break production behaviour.

Major updates never auto-merge. They open a merge request with the `major-update` and `needs-review` labels, requiring a developer to review the changelog and handle any breaking changes manually.

`schedule` restricts Renovate's activity to working hours to avoid surprise merges outside normal working hours when no one is available to respond to a regression.

`minimumReleaseAge: "3 days"` prevents Renovate from merging a dependency release that appeared in the last 72 hours. This provides a small window to catch any supply chain compromise or botched release before it lands in Golem Trust's code.

## Vulnerability alerts

Renovate integrates with GitLab's security scanning to create targeted merge requests for dependencies with known CVEs. When a new vulnerability is disclosed that affects a managed dependency, Renovate opens a merge request immediately, labelled `security` and `vulnerability`, regardless of the normal schedule.

These merge requests are not auto-merged even if the update would normally qualify. All security-flagged updates require human review. Cheery reviews open vulnerability alert merge requests weekly.

## Notifications

Configure Renovate to assign merge requests to the repository's default reviewer group. In `renovate.json`, add:

```
"reviewers": ["golemtrust/security"],
"assignees": []
```

Major update and vulnerability alert merge requests are assigned to the `security` group. Routine patch merge requests that auto-merge do not require assignment; they appear in the Dependency Dashboard issue.

## Troubleshooting

If Renovate is not opening expected merge requests, check the pipeline run log in the `renovate-bot` project. Common issues:

The token has expired or lost permissions: check that the `renovate-bot` account still has Developer access to the affected repositories and that the token has not expired.

The repository has conflicting branch protection rules: Renovate needs to be able to push to `renovate/*` branches. Ensure the branch protection rules for `main` do not accidentally restrict all branch creation.

A package manager lockfile is out of date: Renovate will refuse to update a dependency if the lockfile does not match `package.json` (or equivalent). Commit an updated lockfile to resolve this.

The Renovate Docker image is outdated: update the image reference in the `renovate-bot` pipeline to use the latest tag, which is updated weekly in Harbor via the base image rescan cycle.
Last updated: 10 July 2026
