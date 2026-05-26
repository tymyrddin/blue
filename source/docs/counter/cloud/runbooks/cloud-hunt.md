# Cloud audit log hunting

Three hunts: AWS CloudTrail queries for privilege escalation and credential abuse,
Azure Audit Log queries for identity and control plane anomalies, and a cross-cloud
pattern for IMDS credential theft via SSRF.

## AWS CloudTrail: privilege escalation via IAM API

Hypothesis: an identity with limited IAM permissions is using policy manipulation
calls to expand its own access or create a path to a more privileged role.

Data source: CloudTrail management events, `iam.amazonaws.com` event source.

```bash
# privilege escalation indicator calls from the past 24 hours
aws cloudtrail lookup-events \
  --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
                  date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)" \
  --lookup-attributes AttributeKey=EventSource,AttributeValue=iam.amazonaws.com \
  --query 'Events[?EventName==`CreatePolicyVersion` ||
                  EventName==`SetDefaultPolicyVersion` ||
                  EventName==`AttachUserPolicy` ||
                  EventName==`AttachRolePolicy` ||
                  EventName==`PutUserPolicy` ||
                  EventName==`PutRolePolicy` ||
                  EventName==`AddUserToGroup` ||
                  EventName==`CreateAccessKey` ||
                  EventName==`UpdateAssumeRolePolicy`].
    {Time:EventTime,Event:EventName,Who:Username,Source:CloudTrailEvent}' \
  --output json | \
  jq -r '.[] | [.Time, .Event, .Who] | @tsv' | \
  sort | column -t
```

A sequence of `CreatePolicyVersion` followed by `SetDefaultPolicyVersion` from the same
identity within a short window is the policy rollback escalation technique: create a new
version with broader permissions, set it as default, use the access, optionally revert.
`CreateAccessKey` called for a user other than the caller is key creation for persistence.

## AWS CloudTrail: role assumption chains

Hypothesis: a credential obtained through SSRF, key exfiltration, or other means is
being used to traverse role assumption chains toward a high-privilege target.

```bash
# AssumeRole calls with cross-account or unusual source in the past 6 hours
START="$(date -u -d '6 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
         date -u -v-6H +%Y-%m-%dT%H:%M:%SZ)"

aws cloudtrail lookup-events \
  --start-time "$START" \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole \
  --output json | \
  jq -r '.Events[] |
    .CloudTrailEvent | fromjson |
    select(.errorCode == null) |
    {
      time:       .eventTime,
      caller:     .userIdentity.arn,
      assumed:    .requestParameters.roleArn,
      sourceIP:   .sourceIPAddress,
      userAgent:  .userAgent
    }' | \
  jq -s 'sort_by(.time)[]' | \
  jq -r '[.time, .caller, .assumed, .sourceIP] | @tsv' | \
  column -t
```

Filter for calls where the caller ARN and the assumed role ARN are in different account
IDs: those are cross-account assumptions. Also filter for calls where `sourceIPAddress`
is an external IP rather than an AWS service IP or known corporate IP range. A chain
where identity A assumes role B which then assumes role C, all within a few minutes, is
the lateral movement pattern across account boundaries.

## AWS CloudTrail: CloudTrail tampering

Hypothesis: an attacker with sufficient IAM permissions is disabling or modifying
CloudTrail to reduce visibility before taking further action.

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventSource,AttributeValue=cloudtrail.amazonaws.com \
  --query 'Events[?EventName==`StopLogging` ||
                  EventName==`DeleteTrail` ||
                  EventName==`UpdateTrail` ||
                  EventName==`PutEventSelectors`].
    {Time:EventTime,Event:EventName,Who:Username}' \
  --output json | \
  jq -r '.[] | [.Time, .Event, .Who] | @tsv' | \
  column -t
```

Any `StopLogging` or `DeleteTrail` event is high priority regardless of who called it.
`UpdateTrail` and `PutEventSelectors` narrow which events are captured; changes that
remove management event logging or data event coverage are an attacker reducing their
footprint before subsequent activity.

## Azure Audit Log: new credentials added to service principals

Hypothesis: an attacker with application administrator or equivalent privileges has
added a new client secret or certificate to an existing application, creating a
parallel authentication path that survives password resets.

```bash
# Graph audit log via az rest: credential additions to app registrations in the past 7 days
# Entra directory events appear in the Graph audit log, not the Azure Monitor activity log
SINCE=$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
        date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)
az rest --method GET \
  --url "https://graph.microsoft.com/v1.0/auditLogs/directoryAudits?\$filter=activityDateTime ge $SINCE and (activityDisplayName eq 'Add service principal credentials' or activityDisplayName eq 'Update application - Certificates and secrets management')&\$select=activityDateTime,activityDisplayName,initiatedBy,targetResources" \
  --query "value[].{Time:activityDateTime,Activity:activityDisplayName,Actor:initiatedBy.user.userPrincipalName,Target:targetResources[0].displayName}" \
  --output table
```

```powershell
# Graph: app registrations with credentials added in the past 7 days
$since = (Get-Date).AddDays(-7).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
Get-MgAuditLogDirectoryAudit -Filter "activityDateTime ge $since and
  (activityDisplayName eq 'Add service principal credentials' or
   activityDisplayName eq 'Update application - Certificates and secrets management')" |
  Select-Object ActivityDateTime, ActivityDisplayName,
    @{N='Actor';E={$_.InitiatedBy.User.UserPrincipalName ?? $_.InitiatedBy.App.DisplayName}},
    @{N='Target';E={$_.TargetResources[0].DisplayName}} |
  Sort-Object ActivityDateTime
```

A credential added to a high-privilege application outside normal deployment windows,
or by a principal who has not previously modified that application, is the persistence
signal. Cross-reference the target application against the high-impact scope list in
[oauth-scopes.md](../oauth-scopes.md) to assess blast radius.

## Azure Audit Log: privileged role assignment changes

Hypothesis: a role assignment to Global Administrator, Privileged Role Administrator,
or an equivalent high-privilege role has been made outside a documented change window.

```powershell
$since = (Get-Date).AddDays(-30).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
Get-MgAuditLogDirectoryAudit -Filter "activityDateTime ge $since and
  activityDisplayName eq 'Add member to role'" |
  ForEach-Object {
    $role    = $_.TargetResources | Where-Object { $_.Type -eq 'Role' }
    $account = $_.TargetResources | Where-Object { $_.Type -ne 'Role' } | Select-Object -First 1
    [PSCustomObject]@{
      Time    = $_.ActivityDateTime
      Role    = $role.DisplayName
      Account = $account.UserPrincipalName ?? $account.DisplayName
      Actor   = $_.InitiatedBy.User.UserPrincipalName ?? $_.InitiatedBy.App.DisplayName
    }
  } | Where-Object {
    $_.Role -in @(
      'Global Administrator',
      'Privileged Role Administrator',
      'Application Administrator',
      'Cloud Application Administrator',
      'Exchange Administrator',
      'User Administrator'
    )
  } | Sort-Object Time | Format-Table -AutoSize
```

## IMDS credential theft: API calls from unexpected infrastructure

Hypothesis: an instance role or managed identity credential retrieved via SSRF is being
used from an external IP to enumerate or access cloud resources.

The indicator is an API call authenticated as an instance identity (EC2 instance profile,
VM managed identity) originating from a source IP that is not the instance itself or
an AWS/Azure/GCP service endpoint.

```bash
# AWS: calls using instance role credentials from non-AWS source IPs
# filter by STS event source to avoid scanning all management events
aws cloudtrail lookup-events \
  --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
                  date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)" \
  --lookup-attributes AttributeKey=EventSource,AttributeValue=sts.amazonaws.com \
  --output json | \
  jq -r '.Events[] |
    .CloudTrailEvent | fromjson |
    select(
      .userIdentity.type == "AssumedRole" and
      (.userIdentity.arn | contains(":assumed-role/")) and
      (.sourceIPAddress | test("^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.|amazonaws\\.com)") | not)
    ) |
    {
      time:      .eventTime,
      identity:  .userIdentity.arn,
      sourceIP:  .sourceIPAddress,
      event:     .eventName,
      region:    .awsRegion
    }' | \
  jq -s 'sort_by(.time)[]' | \
  jq -r '[.time, .identity, .sourceIP, .event] | @tsv' | \
  column -t
```

An instance role credential appearing from a residential or cloud-provider IP that does
not belong to the account is the SSRF-to-cloud-pivot pattern. The call will succeed if
the credential is still valid (AWS temporary credentials last up to one hour by default;
EC2 instance profile tokens are typically valid for six hours). The investigation question
is: which instance holds this role, and what SSRF or compromise vector allowed the
credential to be retrieved?

## Correlating signals

A complete cloud escalation sequence tends to look like: `GetCallerIdentity` from a new
IP, followed by enumeration (`ListBuckets`, `ListRoles`, `DescribeInstances`), followed
by `AssumeRole` toward a higher-privilege role, followed by IAM modification. Each step
appears in CloudTrail as a separate event. A SIEM query joining these events on the
session token or access key ID surfaces the chain as a single finding rather than
isolated alerts.

The session token in AWS CloudTrail (`userIdentity.sessionContext.sessionIssuer.arn`)
links all API calls made with a specific set of assumed-role credentials. Pivoting on
this value across a time window reconstructs the full sequence of actions taken with
a compromised credential.
