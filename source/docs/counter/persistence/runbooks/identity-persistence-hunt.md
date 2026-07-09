# Identity persistence hunting

Enumerating and investigating persistence implanted in identity control planes:
Azure AD application registrations, service principals, OAuth grants, and
stolen session tokens.

## Azure AD: application registrations

Application registrations are a primary identity persistence mechanism. An
attacker with sufficient permissions can create an application with a long-lived
client secret and use it independently of any user account.

```powershell
# list all app registrations with their credential expiry dates
Connect-AzureAD
Get-AzureADApplication | ForEach-Object {
    $app = $_
    $creds = Get-AzureADApplicationPasswordCredential -ObjectId $app.ObjectId
    $creds | ForEach-Object {
        [PSCustomObject]@{
            AppName     = $app.DisplayName
            AppId       = $app.AppId
            KeyId       = $_.KeyId
            DisplayName = $_.CustomKeyIdentifier
            StartDate   = $_.StartDate
            EndDate     = $_.EndDate
        }
    }
} | Sort-Object EndDate -Descending | Format-Table -AutoSize
```

Investigate applications:
- Created within the incident timeframe
- With display names that do not correspond to known business applications
- With client secrets expiring more than one year from creation
- With high-privilege API permissions (Directory.ReadWrite.All, Group.ReadWrite.All,
  Application.ReadWrite.All)

```powershell
# list apps with high-privilege Graph permissions
# resolve Graph AppRole IDs to permission names via the Graph service principal
$graphSP = Get-AzureADServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"

Get-AzureADServicePrincipal -All $true | ForEach-Object {
    $sp = $_
    Get-AzureADServiceAppRoleAssignment -ObjectId $sp.ObjectId |
      Where-Object { $_.ResourceDisplayName -eq 'Microsoft Graph' } |
      ForEach-Object {
        $roleName = ($graphSP.AppRoles | Where-Object Id -eq $_.AppRoleId).Value
        [PSCustomObject]@{
            App        = $sp.DisplayName
            Permission = $roleName
            GrantedBy  = $_.PrincipalType
        }
      }
} | Format-Table -AutoSize
```

## Azure AD: privileged role assignments

```powershell
# check direct role assignments (not via PIM)
Get-AzureADDirectoryRole | ForEach-Object {
    $role = $_
    Get-AzureADDirectoryRoleMember -ObjectId $role.ObjectId |
      ForEach-Object {
        [PSCustomObject]@{
            Role      = $role.DisplayName
            Member    = $_.DisplayName
            Type      = $_.ObjectType
            AppId     = $_.AppId
        }
      }
} | Where-Object { $_.Role -match 'Admin|Owner|Global' } | Format-Table -AutoSize
```

Service principals in Global Administrator or other privileged roles that are
not associated with a known Microsoft service are high-priority findings.

## Azure AD: federated credentials and federation

```powershell
# check for federated identity credentials on app registrations
Get-AzureADApplication | ForEach-Object {
    $appId = $_.AppId
    # use Graph API directly
    $uri = "https://graph.microsoft.com/v1.0/applications/$($_.ObjectId)/federatedIdentityCredentials"
    $result = Invoke-MgGraphRequest -Uri $uri -Method GET
    $result.value | ForEach-Object {
        [PSCustomObject]@{
            App      = $appId
            Name     = $_.name
            Issuer   = $_.issuer
            Subject  = $_.subject
        }
    }
} | Format-Table -AutoSize
```

Federated credentials allow external identity providers to assume the
application's identity without a client secret. An unexpected federation to an
external issuer is a persistence mechanism that survives secret rotation.

## Azure AD: conditional access exclusions

```powershell
# list conditional access policies with named exclusions
# (service principals or users excluded from MFA)
Get-AzureADMSConditionalAccessPolicy | ForEach-Object {
    $policy = $_
    if ($policy.Conditions.Users.ExcludeServicePrincipals -or
        $policy.Conditions.Users.ExcludeUsers) {
        [PSCustomObject]@{
            PolicyName        = $policy.DisplayName
            ExcludedSPs       = $policy.Conditions.Users.ExcludeServicePrincipals -join ', '
            ExcludedUsers     = $policy.Conditions.Users.ExcludeUsers -join ', '
        }
    }
} | Format-Table -AutoSize
```

## AWS: IAM persistence

```bash
# list all IAM users with creation date
aws iam list-users \
  --query 'Users[*].[UserName,CreateDate,PasswordLastUsed]' \
  --output table

# list access keys for all users (look for old or recently created keys)
for user in $(aws iam list-users --query 'Users[*].UserName' --output text); do
    aws iam list-access-keys --user-name "$user" \
      --query "AccessKeyMetadata[*].{User:'$user',Key:AccessKeyId,Status:Status,Created:CreateDate}" \
      --output table
done

# list roles with external trust policies (cross-account)
aws iam list-roles --output json | python3 -c "
import json, sys
roles = json.load(sys.stdin)['Roles']
for r in roles:
    trust = json.dumps(r['AssumeRolePolicyDocument'])
    if r['RoleName'].startswith('aws-') is False and 'arn:aws:iam' in trust:
        # trust policy references an external account ARN
        accts = [s for s in trust.split('\"') if s.startswith('arn:aws:iam::')]
        print(r['RoleName'], accts)
"
```

```bash
# check for inline policies (attached directly, not via managed policy)
for user in $(aws iam list-users --query 'Users[*].UserName' --output text); do
    policies=$(aws iam list-user-policies --user-name "$user" --query 'PolicyNames' --output text)
    [[ -n "$policies" ]] && echo "Inline policies on $user: $policies"
done

for role in $(aws iam list-roles --query 'Roles[*].RoleName' --output text); do
    policies=$(aws iam list-role-policies --role-name "$role" --query 'PolicyNames' --output text)
    [[ -n "$policies" ]] && echo "Inline policies on role $role: $policies"
done
```

## AWS: CloudTrail IAM events

```bash
# look for IAM creation/modification events in CloudTrail
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=CreateUser \
  --start-time "$(date -d '7 days ago' --iso-8601=seconds)" \
  --query 'Events[*].[EventTime,Username,CloudTrailEvent]' \
  --output table

# key event names to search for
# CreateUser, CreateAccessKey, AttachUserPolicy, AttachRolePolicy
# PutRolePolicy, AddUserToGroup, CreateRole, UpdateAssumeRolePolicy
```

## Detecting stolen token usage

Stolen refresh tokens used from a new location produce sign-in anomalies:

```powershell
# Azure AD sign-in logs: token usage from unexpected locations
# requires Azure AD P1 or P2
Get-AzureADAuditSignInLogs -Filter "userPrincipalName eq 'user@domain.com'" |
  Select-Object CreatedDateTime, IpAddress, Location, ClientAppUsed,
                IsInteractive |
  Sort-Object CreatedDateTime |
  Format-Table -AutoSize
```

Look for:
- Sign-ins from IP addresses not associated with the user's usual locations
- Non-interactive sign-ins (refresh token usage) immediately following an interactive
  sign-in from a different IP
- Sign-ins using client application IDs that do not match normal usage patterns

## Remediation actions

When identity persistence is confirmed:

1. Revoke all tokens for the compromised user: Azure AD portal, "Revoke all sessions"
2. Disable or delete the backdoor application registration
3. Remove service principal from any privileged role assignments
4. Rotate any affected client secrets or certificates
5. For cross-account AWS roles: delete the role or modify the trust policy to
   remove the external account reference
6. Enable conditional access policies that would have prevented the initial
   compromise (MFA for all users, device compliance requirements)
7. Review audit logs for all actions taken by the backdoor credential during
   its lifetime

## Related

- [OAuth scopes as blast radius](../../cloud/oauth-scopes.md)
- [Cloud defence: restricting OAuth consent](../../cloud/exposure.md)
Last updated: 26 May 2026
