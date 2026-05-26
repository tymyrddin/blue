# Authentication method changes and OAuth consent hunting

Three hunts for post-access persistence via identity controls: new authenticator
registrations outside normal patterns, mailbox forwarding rules set by suspicious
sessions, and OAuth consent grants to high-privilege applications. All three represent
attacker persistence that survives a password reset if not explicitly revoked.

Data sources: Microsoft Entra ID audit log via the Microsoft Graph PowerShell module
(`Connect-MgGraph -Scopes "AuditLog.Read.All,Application.Read.All"`); Exchange Online
PowerShell (`Connect-ExchangeOnline`); Microsoft 365 Unified Audit Log via
`Search-UnifiedAuditLog`.

## New authenticator registrations and TAP issuance

Hypothesis: an attacker with account access has registered a new authentication method,
or a Temporary Access Pass has been issued to facilitate bypassing existing
authentication. The attacker's registered device persists after the compromised session
is invalidated.

```powershell
$startTime = (Get-Date).AddDays(-14).ToUniversalTime().ToString('o')

# new authenticator registrations
Get-MgAuditLogDirectoryAudit -Filter (
    "activityDisplayName eq 'User registered security info' and " +
    "activityDateTime ge $startTime"
) |
    Select-Object ActivityDateTime,
        @{N='User';        E={$_.TargetResources[0].UserPrincipalName}},
        @{N='Method';      E={($_.AdditionalDetails | Where-Object Key -eq 'methodsRegistered').Value}},  # key name may vary; verify against real data
        @{N='InitiatedBy'; E={if ($_.InitiatedBy.User.UserPrincipalName) { $_.InitiatedBy.User.UserPrincipalName } else { $_.InitiatedBy.App.DisplayName }}},
        @{N='IP';          E={$_.InitiatedBy.User.IPAddress}} |
    Sort-Object ActivityDateTime
```

```powershell
# TAP issuance events
$startTime = (Get-Date).AddDays(-14).ToUniversalTime().ToString('o')
Get-MgAuditLogDirectoryAudit -Filter (
    "activityDisplayName eq 'Create Temporary Access Pass method for user' and " +
    "activityDateTime ge $startTime"
) |
    Select-Object ActivityDateTime,
        @{N='TargetUser'; E={$_.TargetResources[0].UserPrincipalName}},
        @{N='IssuedBy';   E={if ($_.InitiatedBy.User.UserPrincipalName) { $_.InitiatedBy.User.UserPrincipalName } else { $_.InitiatedBy.App.DisplayName }}} |
    Sort-Object ActivityDateTime
```

A new authenticator registered from an IP not previously associated with the user,
outside business hours, or immediately following a self-service password reset is the
two-step recovery bypass: email access to complete SSPR, then a new authenticator
registered on the attacker's device. A TAP issued for a privileged account, or issued
by an account outside the Authentication Administrator role, is worth treating as a
priority alert.

The MGM Resorts 2023 incident followed this path: social engineering of the IT helpdesk
reset credentials, which allowed the attacker to register their own authentication
method before the legitimate user noticed anything was wrong.

## Mailbox forwarding rules

Hypothesis: an attacker with mailbox access has created a forwarding rule to exfiltrate
mail continuously without maintaining active access. The rule survives a password reset
and may predate the current investigation window.

```powershell
# mailbox-level forwarding to external addresses
Get-Mailbox -ResultSize Unlimited |
    Where-Object { $_.ForwardingSmtpAddress -ne $null -or $_.DeliverToMailboxAndForward } |
    Select-Object UserPrincipalName, ForwardingSmtpAddress, DeliverToMailboxAndForward |
    Sort-Object UserPrincipalName
```

```powershell
# inbox rules forwarding or redirecting to external addresses
Get-Mailbox -ResultSize Unlimited | ForEach-Object {
    Get-InboxRule -Mailbox $_.UserPrincipalName -ErrorAction SilentlyContinue |
        Where-Object { $_.ForwardTo -or $_.RedirectTo -or $_.ForwardAsAttachmentTo } |
        Select-Object @{N='Mailbox'; E={$_.MailboxOwnerID}},
            Name, ForwardTo, RedirectTo, ForwardAsAttachmentTo
} | Where-Object Mailbox | Sort-Object Mailbox
```

```powershell
# UAL events for forwarding rule creation in the past 30 days
$start = (Get-Date).AddDays(-30)
Search-UnifiedAuditLog -StartDate $start -EndDate (Get-Date) `
    -Operations 'Set-InboxRule','New-InboxRule','Set-Mailbox' `
    -ResultSize 1000 |
    ForEach-Object {
        $a = $_.AuditData | ConvertFrom-Json
        [PSCustomObject]@{
            Time      = $_.CreationDate
            User      = $a.UserId
            Operation = $a.Operation
            ClientIP  = $a.ClientIP
            Params    = ($a.Parameters | ConvertTo-Json -Compress)
        }
    } | Sort-Object Time
```

A forwarding rule set from an IP or user agent inconsistent with the mailbox owner's
normal access pattern, or created in the same session as a sign-in from a known phishing
IP, links the persistence mechanism to the initial access event. The UAL query provides
the creation event and its source IP; `Get-InboxRule` shows the current state. Both are
worth running: the UAL query catches rules that were created and later deleted to obscure
the activity, while `Get-InboxRule` catches rules that are still active.

## OAuth consent grants

Hypothesis: a user was socially engineered into granting a malicious OAuth application
delegated access to their mailbox or files. The application continues to access data as
the user, without requiring further authentication, for as long as the grant persists.

```powershell
$startTime = (Get-Date).AddDays(-14).ToUniversalTime().ToString('o')

# consent events in the audit log
Get-MgAuditLogDirectoryAudit -Filter (
    "activityDisplayName eq 'Consent to application' and " +
    "activityDateTime ge $startTime"
) |
    Select-Object ActivityDateTime,
        @{N='User';   E={$_.InitiatedBy.User.UserPrincipalName}},
        @{N='App';    E={($_.TargetResources | Where-Object Type -eq 'ServicePrincipal').DisplayName}},
        @{N='Scopes'; E={($_.AdditionalDetails | Where-Object Key -eq 'Oauth2PermissionScopeConsentGranted').Value}},  # key name may vary; verify against real data
        @{N='IP';     E={$_.InitiatedBy.User.IPAddress}} |
    Sort-Object ActivityDateTime
```

```powershell
# existing delegated permission grants: surface high-privilege scopes in one paginated call
# ClientId is the application's service principal object ID
Get-MgOauth2PermissionGrant -All |
    Where-Object {
        $_.Scope -match 'Mail\.(Read|ReadWrite|Send)|Files\.ReadWrite\.All|offline_access'
    } |
    Select-Object ClientId, PrincipalId, Scope, ConsentType |
    Sort-Object ClientId
```

An application with `Mail.Read` and `offline_access` consented to by a user whose
account appears in a recent phishing report is the consent phishing pattern. The
`offline_access` scope means the token refreshes indefinitely without re-authentication.
`Files.ReadWrite.All` with `offline_access` consented in the same window as a suspicious
sign-in event is worth treating as a confirmed persistence mechanism pending further
investigation.

Existing grants from the second query may include legitimate applications with broad
scopes: the filter catches everything matching those patterns, not only malicious grants.
`ClientId` is a service principal object ID; resolve names with
`Get-MgServicePrincipal -ServicePrincipalId <ClientId> | Select-Object DisplayName` for
the entries worth investigating. Correlating the `PrincipalId` against the sign-in log
and the application's registration date distinguishes a long-standing productivity tool
from a recently registered application consented to during an active compromise.
