# Hidden persistence checklist

A structured inventory of mechanisms to check during a persistence hunt or
post-incident review. Organised by control plane so that different teams can
work in parallel.

## Endpoint: Windows

### Registry autorun locations

```text
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce
HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon  (Userinit, Shell values)
HKLM\SYSTEM\CurrentControlSet\Services                      (service entries)
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options
HKCU\Environment\UserInitMprLogonScript
```

### Scheduled tasks

- Enumerate all non-disabled tasks: `Get-ScheduledTask | Where-Object { $_.State -ne 'Disabled' }`
- Look for tasks with encoded PowerShell or unusual binary paths in their actions
- Check task paths: tasks outside `\Microsoft\*` or with names that do not match the
  naming conventions in their path are suspicious
- Compare against a known-good baseline from a clean build

### WMI subscriptions

```powershell
Get-WMIObject -Namespace root\subscription -Class __EventFilter
Get-WMIObject -Namespace root\subscription -Class CommandLineEventConsumer
Get-WMIObject -Namespace root\subscription -Class ActiveScriptEventConsumer
Get-WMIObject -Namespace root\subscription -Class __FilterToConsumerBinding
```

Legitimate WMI subscriptions are rare; any subscription not from a known
endpoint agent is worth investigating.

### Services

- `Get-Service | Where-Object { $_.StartType -eq 'Automatic' }`
- Check binary paths for non-standard locations (`C:\Windows\System32` is expected;
  `C:\Users\*`, `C:\ProgramData\*`, temp directories are not)
- Compare display names and binary paths against manufacturer expectations

### Startup folders

```text
C:\Users\*\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\
C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp\
```

### DLL hijacking / COM hijacking

- Check `HKCU\SOFTWARE\Classes\CLSID\` for COM registrations that override system entries
- Check `%APPDATA%\Microsoft\Windows\Start Menu` for unusual shortcuts
- Review DLL search path for known-vulnerable executables

## Endpoint: Linux

### Cron

```text
crontab -l                  # current user
cat /etc/crontab
ls -la /etc/cron.d/
ls -la /etc/cron.daily/ /etc/cron.hourly/ /etc/cron.weekly/ /etc/cron.monthly/
```

### Systemd

```text
systemctl list-units --type=service --state=enabled
systemctl list-timers --all
ls -la /etc/systemd/system/   # system services
ls -la ~/.config/systemd/user/ # user services
```

Services with names mimicking `systemd-*` but installed after the system
baseline date are worth investigating.

### Shell initialisation files

```text
~/.bashrc, ~/.bash_profile, ~/.profile
/etc/bash.bashrc, /etc/profile, /etc/profile.d/*
~/.zshrc, ~/.zprofile (if zsh is in use)
```

Check for `curl | bash`, `wget | sh`, or background invocations (`nohup ... &`).

### SUID/SGID binaries added post-install

```text
find / -perm -4000 -newer /etc/passwd -ls 2>/dev/null
```

### SSH authorised keys

```text
~/.ssh/authorized_keys          # each user
/root/.ssh/authorized_keys
/etc/ssh/authorized_keys        # non-standard but possible
```

Any key not matching known administrative keys warrants removal and
investigation.

## Identity: Azure AD

- App registrations created recently or with unusual display names
- Service principals with Contributor, Owner, or Global Administrator assignments
- Service principals added to privileged groups (Global Admins, Exchange Admins)
- Federated identity credentials and pass-through authentication configurations
- Conditional access exclusions that exempt specific service principals from MFA
- Long-lived client secrets (check `endDateTime` values)

```powershell
# list all app registrations and their credentials
Get-AzADApplication | ForEach-Object {
    $app = $_
    Get-AzADAppCredential -ObjectId $app.Id |
      Select-Object @{N='App';E={$app.DisplayName}}, EndDateTime, KeyId
}
```

## Identity: AWS

- IAM users created after the account baseline: `aws iam list-users`
- Access keys for service accounts not recently rotated: `aws iam list-access-keys`
- Roles with trust policies allowing assumption from external accounts
- Inline policies on existing roles (harder to spot than attached managed policies)
- Users added to high-privilege groups unexpectedly
- CloudTrail is enabled and has not been disabled or had its logging bucket modified

```text
# check for cross-account role trust policies
aws iam list-roles --query 'Roles[*].{Name:RoleName,Trust:AssumeRolePolicyDocument}' |
  python3 -c "import json,sys; [print(r['Name'], r['Trust']) for r in json.load(sys.stdin)
              if 'sts:AssumeRole' in str(r['Trust']) and 'arn:aws:iam' in str(r['Trust'])]"
```

## Application layer

### Web-accessible directories

- File integrity monitoring alerts on web root and upload directories
- PHP/ASPX files in upload directories (upload directories have no business being executable)
- Files with recent modification timestamps that do not correspond to a deployment event
- Unusually small files (minimal web shells can be under 100 bytes)

### Database

```sql
-- SQL Server: check for unusual logon triggers
SELECT name, type_desc FROM sys.server_triggers WHERE type_desc = 'SERVER'

-- SQL Server: check for stored procedures owned by unexpected principals
SELECT name, SUSER_SNAME(principal_id) AS owner FROM sys.procedures
WHERE SUSER_SNAME(principal_id) NOT IN ('dbo', 'sys')

-- PostgreSQL: check for SECURITY DEFINER functions
SELECT proname, prosecdef, proowner::regrole FROM pg_proc WHERE prosecdef = true
```

### CI/CD pipelines

- Review recent changes to pipeline definition files (`.github/workflows/`, `.gitlab-ci.yml`,
  `Jenkinsfile`)
- Look for new steps with `curl | bash`, `wget | sh`, or environment variable exfiltration
- Check secret access logs in GitHub/GitLab for unexpected accesses
- Review third-party actions/orbs/plugins pinned to mutable tags (`:latest`, branch names)
  rather than commit SHAs

## Cloud configuration

- Lambda functions or Azure Functions created recently or with unusual triggers
- S3 bucket policies or Azure Storage account policies allowing public access or
  unexpected cross-account access
- CloudWatch log subscriptions forwarding to unexpected destinations
- SSM Parameter Store values modified outside of normal deployment processes
- Secrets Manager secrets accessed by unexpected IAM entities (check CloudTrail)
