# CI/CD credential handling

## When to use

When setting up a new pipeline, when a credential may have been exposed in pipeline logs, or when auditing an existing pipeline's secret management practices. Also run when a team member with access to the CI/CD console leaves.

## The quiet risk

CI/CD pipelines frequently hold the most powerful credentials in the organisation: keys that can deploy to production, access databases, push to registries, and modify infrastructure. They are also the most common place where credentials get accidentally printed to logs, committed to configuration files, or granted broader permissions than originally intended.

## New pipeline: secure defaults

1. Create a dedicated service account for the pipeline. Do not use a personal account, a root account, or a shared admin account. What the service account can reach on compromise is what counts; keep it small.
2. Store all secrets in the CI/CD platform's encrypted secret store:
   - GitHub Actions: repository or organisation secrets
   - GitLab CI: CI/CD variables (masked)
   - CircleCI: contexts
   Not in: repository files, Dockerfiles, inline in workflow YAML.
3. Name secrets clearly: `PROD_DB_URL`, `STAGING_AWS_KEY_ID`. Ambiguous names accumulate and get used for unintended purposes.
4. Run a test pipeline and confirm secrets are masked in the log output. Most platforms mask them automatically, but it is worth verifying.
5. Restrict secret access to the pipelines and environments that need them. A staging database URL has no reason to be available in the production deploy job.
6. Confirm that pull requests from external contributors cannot access secrets for protected environments.

## Auditing an existing pipeline

7. List all secrets currently stored in the CI/CD platform. Remove any not in active use.
8. Search recent pipeline logs for strings that look like credentials: API keys, database URLs, private key fragments. Note: do not search for the actual secret values in a shared log environment; search for patterns.
9. Check the permissions of the service account used for deployments. Service accounts accumulate permissions over time as requirements change. Revoke what is no longer needed.
10. Check for secrets committed directly to pipeline configuration files (`.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`): `git log -p | grep -i "password\|secret\|token\|key"`.

## Verified clean when

All secrets are in the encrypted store, not in configuration files. Service account permissions match the minimum required for current pipeline operations. No credentials visible in recent log output. Unused secrets removed.

## Follow-up

- Rotate all pipeline secrets when a team member with access to the CI/CD console leaves.
- Add secret scanning to repository commits.
- Document which secrets exist, what they access, and when they were last rotated.
