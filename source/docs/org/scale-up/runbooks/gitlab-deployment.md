# GitLab deployment

Runbook for deploying GitLab Community Edition as Golem Trust's self-hosted source control and CI/CD platform. GitLab CE provides integrated security scanning, protected branches, merge request workflows, and pipeline automation without the vendor lock-in of a managed service. Self-hosting means complete control over data retention, access policies, and runner configuration.

## Instance specification

GitLab requires meaningful resources. Run it on a Hetzner CX42 instance (8 vCPU, 16GB RAM, 160GB SSD). The SSD is for the OS and GitLab application data. Attach a separate 500GB Hetzner volume at `/var/opt/gitlab` for repository storage and artefacts.

```
mkfs.ext4 /dev/sdb
echo "/dev/sdb /var/opt/gitlab ext4 defaults 0 2" >> /etc/fstab
mount -a
```

DNS: `gitlab.golemtrust.am` pointing to the instance. TLS via Certbot with Cloudflare DNS challenge.

## Installation

GitLab publishes an official Debian package repository:

```
apt install -y curl openssh-server ca-certificates tzdata
curl -sS https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | bash
EXTERNAL_URL="https://gitlab.golemtrust.am" apt install -y gitlab-ce
```

GitLab CE installs all components (Puma, Sidekiq, PostgreSQL, Redis, Nginx, Gitaly) as a single omnibus package. The bundled PostgreSQL and Redis are acceptable for this deployment scale; they do not need to be externalised.

After installation, retrieve the initial root password:

```
cat /etc/gitlab/initial_root_password
```

Log in at `https://gitlab.golemtrust.am` with username `root` and that password. Change it immediately and store the new password in Vaultwarden (collection: Infrastructure, item: GitLab root).

## Configuration

Edit `/etc/gitlab/gitlab.rb` for key settings. After each change, run `gitlab-ctl reconfigure`.

External URL and TLS (managed by the omnibus installer; verify these are set correctly):

```
external_url 'https://gitlab.golemtrust.am'
letsencrypt['enable'] = false
nginx['ssl_certificate'] = '/etc/letsencrypt/live/gitlab.golemtrust.am/fullchain.pem'
nginx['ssl_certificate_key'] = '/etc/letsencrypt/live/gitlab.golemtrust.am/privkey.pem'
```

Email via Golem Trust's SMTP relay:

```
gitlab_rails['smtp_enable'] = true
gitlab_rails['smtp_address'] = 'mail.golemtrust.am'
gitlab_rails['smtp_port'] = 587
gitlab_rails['smtp_user_name'] = 'gitlab@golemtrust.am'
gitlab_rails['smtp_password'] = '<retrieve from Vaultwarden>'
gitlab_rails['smtp_domain'] = 'golemtrust.am'
gitlab_rails['smtp_authentication'] = 'login'
gitlab_rails['smtp_enable_starttls_auto'] = true
gitlab_rails['gitlab_email_from'] = 'gitlab@golemtrust.am'
```

Repository storage on the attached volume (the volume is mounted at `/var/opt/gitlab` before installation, so GitLab writes there by default; confirm this):

```
git_data_dirs({ "default" => { "path" => "/var/opt/gitlab/git-data" } })
```

Artefact and upload storage:

```
gitlab_rails['artifacts_path'] = '/var/opt/gitlab/artifacts'
gitlab_rails['uploads_directory'] = '/var/opt/gitlab/uploads'
```

Backup to Hetzner Object Storage:

```
gitlab_rails['backup_upload_connection'] = {
  'provider' => 'AWS',
  'region' => 'fsn1',
  'aws_access_key_id' => '<retrieve from Vaultwarden>',
  'aws_secret_access_key' => '<retrieve from Vaultwarden>',
  'endpoint' => 'https://fsn1.your-objectstorage.com',
  'path_style' => true
}
gitlab_rails['backup_upload_remote_directory'] = 'gitlab-backups.golemtrust.am'
gitlab_rails['backup_keep_time'] = 604800
```

Schedule daily backups via cron:

```
0 2 * * * gitlab-backup create SKIP=registry CRON=1 >> /var/log/gitlab/backup.log 2>&1
```

## Keycloak OIDC authentication

Connect GitLab to Keycloak so developers use their existing Golem Trust identity. Create a `gitlab` client in the `golemtrust-internal` realm in Keycloak with the following redirect URI: `https://gitlab.golemtrust.am/users/auth/openid_connect/callback`.

In `/etc/gitlab/gitlab.rb`:

```
gitlab_rails['omniauth_enabled'] = true
gitlab_rails['omniauth_allow_single_sign_on'] = ['openid_connect']
gitlab_rails['omniauth_block_auto_created_users'] = false
gitlab_rails['omniauth_providers'] = [
  {
    name: 'openid_connect',
    label: 'Golem Trust SSO',
    args: {
      name: 'openid_connect',
      scope: ['openid', 'profile', 'email'],
      response_type: 'code',
      issuer: 'https://auth.golemtrust.am/realms/golemtrust-internal',
      discovery: true,
      client_auth_method: 'query',
      uid_field: 'preferred_username',
      client_options: {
        identifier: 'gitlab',
        secret: '<retrieve from Vaultwarden>',
        redirect_uri: 'https://gitlab.golemtrust.am/users/auth/openid_connect/callback'
      }
    }
  }
]
```

Run `gitlab-ctl reconfigure`. Test by logging in via the "Golem Trust SSO" button. The first login creates a GitLab account linked to the Keycloak identity.

## Protected branches

After initial setup, configure the default branch protection policy. Navigate to Admin Area, then Settings, then Repository.

Default branch protection: set to "Fully protected". This applies to all new projects.

For the main production repository, configure at the project level. Navigate to the project, then Settings, then Repository, then Protected Branches. Add a rule for `main`:

- Allowed to merge: Maintainers
- Allowed to push and merge: No one
- Require code owner approval: enabled
- Require a pipeline to succeed before merging: enabled
- Minimum number of approvals: 2

These settings implement the policy that no code reaches `main` without two approvals and a passing pipeline. Not even Adora Belle can push directly.

## Sign-off and audit trail

Enable commit signing requirement at the group level. Navigate to the `golemtrust` group, then Settings, then General, then Permissions. Enable "Require all users in this group to set up two-factor authentication" and "Require all commits to be signed."

GitLab logs all repository events (pushes, merge requests, approvals, pipeline outcomes) to the audit log. Navigate to Admin Area, then Monitoring, then Audit Events to review. Audit events are also forwarded to Graylog via the GitLab Prometheus endpoint and webhook integration.

## Verification

Push a test commit to a new repository and verify:

- The commit appears in the project
- A pipeline triggers automatically
- A merge request to `main` requires two approvals
- The pipeline must pass before the merge button activates

Check the Keycloak login flow by logging out and back in via SSO.
