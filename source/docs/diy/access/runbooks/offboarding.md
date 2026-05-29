# Employee and contractor offboarding

## Trigger

An employee or contractor is leaving the organisation. Also run when a team member changes role and no longer needs
their current level of access. Run immediately on departure for privileged access; within 48 hours for the remainder.

## Ownership

Technical lead or CTO. At very small organisations, whoever holds the admin credentials.

## The exposure

Access does not expire on its own. SSH keys, cloud IAM credentials, repository tokens, and SaaS accounts all persist
until explicitly removed. The gap between a departure and full revocation is the exposure window, and it is consistently
wider than teams intend.

## Before starting

Compile an access inventory: repositories, servers, cloud accounts, SaaS tools, and any shared credentials the person
had access to. Git history and cloud IAM access logs are useful sources if no inventory exists.

## Steps

### SSH and server access

1. Locate all `authorized_keys` entries belonging to the departing person:
   ```
   grep -rl "key_comment_or_identifier" /home/*/.ssh/ /root/.ssh/
   ```
2. Remove the matching entries from each `authorized_keys` file.
3. Confirm by attempting an SSH connection with the old key. It should be rejected.

### Cloud credentials

4. In each cloud console (AWS IAM, GCP IAM, Azure AD): deactivate the user account, revoke all access keys and tokens,
   and remove from all groups and roles.
5. Check for service accounts the person created and for any roles with policies that trust their identity.

### Code repositories and CI/CD

6. Remove the person from all repositories and organisation groups (GitHub, GitLab, Bitbucket).
7. Revoke personal access tokens and deploy keys created under their account.
8. Check CI/CD pipeline secrets for any tokens tied to their account or email address.

### SaaS tools

9. Suspend (do not delete) accounts on: email and calendar (Google Workspace, Microsoft 365), Slack, Notion, project
   management tools, monitoring dashboards, and any other tools in the access inventory.
10. Transfer ownership of any assets (shared drives, subscriptions, domain admin access) to a current team member
    before suspension.

### Shared credentials

11. Rotate any shared credentials the person had access to: admin passwords, root keys, shared API keys. Update all
    systems using those credentials.

## Done

SSH access rejected on all servers. Cloud credentials deactivated. SaaS accounts suspended. Shared credentials rotated.
No services broken by the changes.

## Communication

Notify the team once offboarding is complete. Do not announce the timing of revocations in advance.

## Follow-up

- Review authentication logs for 30 days for access attempts from the person's known IP ranges.
- Delete (rather than keeping suspended) accounts after the applicable data retention period, typically 30 days.
- Update the access inventory to reflect the changes.

## Legal notes

Suspend accounts rather than immediately deleting them where the legality of immediate termination of access is
uncertain. Deleted accounts and their data may not be recoverable, and they may be needed for legal or audit purposes.
