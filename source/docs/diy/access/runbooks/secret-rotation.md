# Production secret rotation

## When to rotate

Immediately when a secret is known or suspected to be exposed: found in a git commit, in a CI/CD log, in a Slack
message, or reported by a secret scanning tool. Also run on a scheduled basis, at minimum quarterly, for long-lived
production credentials.

## Preparation

Before rotating, identify every system that uses the secret. Rotating a credential without updating every dependent
system causes downtime. For a discovered `.env` file, treat all variables in it as candidates for rotation, not just the
obviously sensitive ones.

## Generating the new credential

The generation method depends on the credential type:

- API key: generate a new key in the provider's console. Keep the old key active until the new one is confirmed working.
- Database password: `openssl rand -base64 32` produces a suitable value. Some databases require specific character
  sets; check documentation.
- SSH key: `ssh-keygen -t ed25519 -C "service-purpose"`.
- JWT or signing secret: `openssl rand -base64 64`.
- Cloud access key: generate in IAM, then update before deactivating the old one.

## Updating dependent systems

The safe order: add the new credential to all systems, verify each is operational, then revoke the old credential.
Reversing this order causes an outage.

1. Add the new credential to each system: application environment variables, secrets manager, CI/CD secrets, Kubernetes
   secrets, deployed configuration.
2. Deploy or restart each service to pick up the new credential.
3. Verify each service is operational: check application logs for authentication errors, confirm health endpoints
   respond, confirm representative operations work.
4. Once all systems are confirmed operational with the new credential, revoke the old one.

If a service breaks after the credential swap: the fallback is to re-add the old credential temporarily while
investigating. This is why the old credential is kept valid until verification is complete.

## Removing from git history

If the exposure was via a git commit, the secret is in the repository history and in every clone that has been made.
Removing it requires rewriting history, which is disruptive.

Use `git filter-repo` (preferred) or `git filter-branch` to remove the file or value from history. This produces a
diverged history; all collaborators need to re-clone rather than pull. Warn them before proceeding.

After rewriting history, force-push to the remote repository. Confirm the secret no longer appears in
`git log -p | grep "secret_value"`.

Rotating the credential is still necessary. The history removal reduces future risk from new clones of the repository,
but anyone who cloned before the rewrite still has a local copy containing the secret.

## Checking for secondary exposure

A secret that appeared in one place may have appeared in others. Check:

- CI/CD pipeline logs: search for the credential value or a partial match.
- Application error logs: some frameworks log request parameters or environment variables on startup errors.
- Monitoring and observability tools: spans and traces occasionally capture environment variables.
- Browser developer tools or API documentation outputs if the secret was ever used in a frontend context.

## All clear when

New credential active in all systems. Old credential revoked. Exposure source identified and closed. No service
reporting authentication errors.

## Communication

If the exposure was external (public repository, third-party breach, log accessible to external parties), notify
affected services and, where personal data may have been accessible, seek legal advice before deciding notification is
unnecessary.

## Evidence

Preserve the git commit reference, log entry, or report that identified the exposure. Do not delete the evidence before
the root cause is understood.

## Legal notes

Exposed credentials that permitted access to personal data may constitute a reportable breach under applicable data
protection law. Seek legal advice before concluding no notification is required.

## Follow-up

- Investigate how the exposure happened. Common causes: `.gitignore` not covering the file, the file committed before
  `.gitignore` was set up, credentials passed to a process in a way that ended up in logs.
- Add pre-commit secret scanning (`gitleaks`, `detect-secrets`) to the repository.
- Audit all other secrets for similar exposure risk.
