# OAuth scopes as blast radius

OAuth scopes are usually discussed as an access control mechanism. They are also a blast radius map.
When an application with `Files.ReadWrite.All` is compromised, every file in the tenant is in scope.
When one with `Application.ReadWrite.All` is compromised, an attacker can create app registrations and
persist indefinitely. The scope list on an enterprise application is a description of the damage a
compromise of that application would cause.

## Reading a scope

Microsoft Graph scopes follow the pattern `Resource.Action.Qualifier`.

The action is typically `Read`, `ReadWrite`, or `Manage`. The qualifier is the critical part: absent
means user-delegated access limited to what the signed-in user can see; `.All` means tenant-wide access
regardless of user context.

The distinction between delegated and application permissions carries more weight than the resource name.
Application permissions have no user context. They are granted to background services and automation
accounts. They act without a signed-in user, which means conditional access policies and MFA do not
apply to calls made under them. A compromised service account holding application permissions operates
with more reach than most user accounts.

## High-impact Microsoft Graph permissions

| Scope                                | Type        | What a compromise means                                                                                                 |
|--------------------------------------|-------------|-------------------------------------------------------------------------------------------------------------------------|
| `Application.ReadWrite.All`          | Application | Create or modify app registrations; add credentials; escalate to further permissions. A standard persistence mechanism. |
| `Directory.ReadWrite.All`            | Application | Modify users, groups, roles, and directory objects. Equivalent to domain admin in Entra ID.                             |
| `RoleManagement.ReadWrite.Directory` | Application | Assign directory roles, including Global Administrator, to any account.                                                 |
| `Files.ReadWrite.All`                | Application | Read and write all files in SharePoint and OneDrive across the entire tenant.                                           |
| `Mail.ReadWrite`                     | Application | Read, modify, and delete all email for all users.                                                                       |
| `Mail.Send`                          | Application | Send email as any user in the tenant. No authentication artefact appears in the sender's sent items.                    |
| `User.ReadWrite.All`                 | Application | Modify any user account including passwords and MFA methods.                                                            |
| `Group.ReadWrite.All`                | Application | Add or remove members from any group, including privileged groups.                                                      |
| `Sites.FullControl.All`              | Application | Full control over all SharePoint sites.                                                                                 |
| `MailboxSettings.ReadWrite`          | Delegated   | Modify inbox rules; can forward all incoming mail to an external address silently.                                      |

`Mail.Send` as an application permission deserves specific attention. It is sometimes granted to
automation for transactional email. With it, any process that compromises the app can send email as
any user in the tenant. The recipient sees a legitimate sender address, and nothing appears in the
sender's sent items. Business email compromise without any account compromise.

## Google Workspace equivalent scopes

| Scope                                                  | What a compromise means                                                                                                 |
|--------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| `https://www.googleapis.com/auth/gmail.modify`         | Read, modify, delete all email for the authorising user. Combined with domain-wide delegation: all users in the domain. |
| `https://www.googleapis.com/auth/drive`                | Full access to all Drive files. With domain-wide delegation: all users.                                                 |
| `https://www.googleapis.com/auth/admin.directory.user` | Read and manage user accounts across the domain.                                                                        |
| `https://mail.google.com/`                             | Full Gmail access including send-as.                                                                                    |

Google Workspace application access often uses domain-wide delegation: a service account is granted
the ability to impersonate any user in the domain for the specified scopes. An application with
domain-wide delegation and `https://www.googleapis.com/auth/gmail.modify` can read every email in the
organisation. The grant appears in the admin console under API controls and is rarely reviewed once set.

## Minimal scope for common integrations

Many integrations are granted broader scopes than their stated function requires. The table below
lists common integration types, the minimum scope for the stated function, and the broader scope
that is frequently granted by mistake.

| Integration                                   | Minimal scope                                                             | Commonly granted instead                                          |
|-----------------------------------------------|---------------------------------------------------------------------------|-------------------------------------------------------------------|
| Calendar availability reader (scheduling)     | `Calendars.Read` (delegated)                                              | `Calendars.ReadWrite`                                             |
| Ticketing system creating tasks               | `Tasks.ReadWrite` scoped to service account user                          | `Tasks.ReadWrite.All`                                             |
| Email notification service                    | `Mail.Send` application permission, scoped to a dedicated service mailbox | `Mail.Send` as tenant-wide application permission                 |
| Directory sync (read user list)               | `User.Read.All` (read-only, application)                                  | `User.ReadWrite.All`                                              |
| HR system (read/write specific group)         | `GroupMember.ReadWrite.All` (application; limit to target group in code)  | `Group.ReadWrite.All` across all groups                           |
| Data warehouse export from SharePoint         | `Files.Read.All` (application)                                            | `Sites.FullControl.All`                                           |
| SSO connector (user sign-in, read profile)    | `openid`, `profile`, `User.Read` (delegated)                              | `User.ReadWrite.All`                                              |
| SIEM log ingestion                            | `AuditLog.Read.All` (application)                                         | `Directory.ReadWrite.All`                                         |
| CI/CD pipeline publishing release notes       | `Files.ReadWrite` delegated, scoped to a specific SharePoint path         | `Files.ReadWrite.All`                                             |
| Backup service (read OneDrive and SharePoint) | `Files.Read.All` (application)                                            | `Files.ReadWrite.All` or `Sites.FullControl.All`                  |
| Meeting room booking                          | `Calendars.ReadWrite` delegated, scoped to room resource accounts         | `Calendars.ReadWrite` application permission across all mailboxes |
| Reporting and analytics (Teams activity)      | `Reports.Read.All` (application)                                          | `Directory.ReadWrite.All`                                         |

The practical audit question for each integration is: what is the minimum scope for this application's
stated function? If the answer is narrower than what was granted, that is the finding.

## Scope disambiguation

Several Microsoft Graph scopes are routinely confused with each other. The distinctions carry
significant consequences for blast radius.

`Files.Read` vs `Files.Read.All` vs `Files.ReadWrite.All`: `Files.Read` is a delegated permission
that reads the signed-in user's OneDrive files only. `Files.Read.All` reads all files in SharePoint
and OneDrive across the entire tenant; the `.All` suffix means tenant-wide access, not a property of
the read operation. `Files.ReadWrite.All` adds write and delete access to the tenant-wide scope.
Integrations that only need to read a user's own files frequently receive `Files.Read.All` or
`Files.ReadWrite.All` because the grant is made by an administrator who is unfamiliar with the
delegated/application distinction.

`User.Read` vs `User.ReadBasic.All` vs `User.Read.All`: `User.Read` is delegated and reads only the
profile of the signed-in user. `User.ReadBasic.All` reads display name, email address, and profile
photo for all users in the tenant, and is appropriate for directory lookups and people-picker
integrations. `User.Read.All` reads the full profile of every user including phone numbers, manager,
direct reports, and extended attributes. Applications that need to display user names in a UI
typically request `User.Read.All` when `User.ReadBasic.All` is sufficient.

Delegated versus application permissions: a delegated permission acts on behalf of a signed-in user
and is bounded by what that user can access. An application permission acts independently of any user,
applies tenant-wide, and is not bounded by any individual's access scope. Conditional access policies
and MFA requirements apply to the user session for delegated permissions; they do not apply to
application permissions. A service account with application permissions therefore typically carries
more reach than a user account with equivalent delegated permissions, which is why compromised
application credentials tend to produce larger incidents.

## Auditing existing grants

```powershell
# list all service principals with application permissions, sorted by scope
# this groups dangerous permissions together rather than burying them by application name
Get-MgServicePrincipal -All | ForEach-Object {
    $sp = $_
    Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id |
      Where-Object { $_.ResourceDisplayName -eq 'Microsoft Graph' } |
      ForEach-Object {
        $roleId = $_.AppRoleId
        $graphSp = Get-MgServicePrincipal -Filter "DisplayName eq 'Microsoft Graph'"
        $role = $graphSp.AppRoles | Where-Object { $_.Id -eq $roleId }
        [PSCustomObject]@{
            Scope     = $role.Value
            App       = $sp.DisplayName
            AppId     = $sp.AppId
            GrantedOn = $_.CreatedDateTime
        }
      }
} | Sort-Object Scope | Format-Table -AutoSize
```

Sorting by scope produces a list grouped by permission type. All
`Application.ReadWrite.All` grants appear together, all `Directory.ReadWrite.All` grants appear
together. The most dangerous grants become visible at the top of the output rather than scattered
across a long list of application names.

```bash
# Google Workspace: list apps with domain-wide delegation
gam print oauthscopes | grep -E "(gmail|drive|admin|calendar)" | sort
```

Review the output for:
- Application permissions (not delegated) on the high-impact scopes listed above
- Grants to applications no longer in active use or belonging to former vendors
- `Mail.Send` grants to background services rather than dedicated service account mailboxes
- Domain-wide delegation in Google Workspace for scopes touching mail or Drive

## Detecting scope abuse

An application exercising a permission it has never previously used is detectable in the Microsoft 365
Unified Audit Log. A cloud SIEM can baseline the Graph API call profile for each service principal
and alert on first use of a permission.

```
// Entra ID: consent granted to high-privilege Microsoft Graph scopes in the past 7 days
// Run in Azure Sentinel (AuditLogs table). ActionType in CloudAppEvents contains
// activity types, not scope names; this query uses the correct table for consent events.
AuditLogs
| where OperationName == "Consent to application"
| where TimeGenerated > ago(7d)
| where TargetResources has_any ("Files.ReadWrite.All", "Mail.Send",
        "Directory.ReadWrite.All", "Application.ReadWrite.All",
        "RoleManagement.ReadWrite.Directory", "User.ReadWrite.All")
| project TimeGenerated,
           ConsentedApp = tostring(TargetResources[0].displayName),
           ConsentedBy  = tostring(InitiatedBy.user.userPrincipalName),
           Permissions  = tostring(TargetResources)
| order by TimeGenerated asc
```

New use of a high-privilege scope by an existing application, or any use by an application created
recently, is worth investigating before assuming it is legitimate.

## Related

- [Cloud defence: restricting OAuth consent and auditing app grants](exposure.md)
- [Identity persistence hunting](../persistence/runbooks/identity-persistence-hunt.md)
- [API authentication patterns from the developer side](../../dev/appsec/api/authentication.md)
