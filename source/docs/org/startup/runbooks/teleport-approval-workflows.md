# Approval workflows

Runbook for configuring and operating Teleport's access request workflow for production access. Production access is not granted permanently to developers. It is requested, approved, and time-limited. Carrot designed this process. He said it was based on how the City Watch handles evidence access: you log the request, you get a supervisor to countersign, and you return what you took. Ponder found this an apt analogy.

## How access requests work

A developer or operator who needs access to a production server submits an access request through the Teleport web UI or the `tsh` CLI. The request specifies which servers and roles are needed and why. It is routed to approvers. On approval, the requester receives a time-limited certificate granting the requested access. At expiry, access ends automatically; no manual revocation is needed.

Requests are visible in the audit log with the requester's identity, the reason given, and the approver's identity. Vimes was very specific that he wanted this.

## Role configuration for access requests

Access requests are defined in role YAML. Define a role that allows requesting elevated access:

```
tctl create -f - << 'EOF'
kind: role
version: v7
metadata:
  name: developer
spec:
  allow:
    request:
      roles: [production-access]
      reason: true
      thresholds:
        - approve: 1
          deny: 1
  options:
    request_access: reason
EOF
```

`reason: true` means a reason is required. `thresholds` specifies that one approval is sufficient. For production database access, require two approvals:

```
tctl create -f - << 'EOF'
kind: role
version: v7
metadata:
  name: developer-db-request
spec:
  allow:
    request:
      roles: [production-db-access]
      reason: true
      thresholds:
        - approve: 2
          deny: 1
EOF
```

Define the `production-access` role that is granted on approval:

```
tctl create -f - << 'EOF'
kind: role
version: v7
metadata:
  name: production-access
spec:
  allow:
    node_labels:
      env: production
    logins: [deploy, app]
  options:
    max_session_ttl: 4h
    require_session_mfa: true
EOF
```

`max_session_ttl: 4h` means the approved access expires after four hours regardless. `require_session_mfa: true` requires an additional MFA touch at session start even if the user already authenticated with MFA to Teleport.

## Submitting a request via the CLI

```
tsh request create \
  --roles=production-access \
  --reason="Investigating error spike on merchants-guild-app-02, see incident #47"
```

The command outputs the request ID and waits for approval. When approved:

```
tsh request show <request-id>
tsh login --request-id=<request-id>
```

The second login refreshes the local certificate to include the approved role. SSH access is then possible for the duration of the TTL.

## Approving requests

Approvers are users with the `reviewer` role. Carrot and Adora Belle are reviewers by default.

To see pending requests:

```
tsh request ls
```

To approve:

```
tsh request review --approve --reason="Confirmed incident #47, approved" <request-id>
```

To deny:

```
tsh request review --deny --reason="No active incident, please raise one first" <request-id>
```

Approvals and denials are recorded in the audit log with the reviewer's identity and their reason.

In the Teleport web UI, pending requests appear in the Access Requests section of the dashboard. Approvers receive an email notification when a request is submitted. The email template includes the requester's name, the requested role, and the reason given.

Configure email notifications in `/etc/teleport.yaml` on the Auth/Proxy node:

```
auth_service:
  ...
  slack:
    channel: "#access-requests"
    webhook_url: "<Slack webhook from Vaultwarden>"
```

Requests also route to the Slack `#access-requests` channel. Carrot prefers this to email for visibility during a live incident.

## Emergency access

If a production incident requires immediate access and no approver is available (a 3am scenario is plausible; Angua will confirm this), the following emergency procedure applies:

1. The requester uses their own MFA device to submit a request with reason `EMERGENCY: <brief description>`
2. They call Carrot on his mobile. His number is in Vaultwarden under the Infrastructure collection.
3. Carrot approves via `tsh` from his personal device. The `tsh` binary works from any machine; Carrot keeps it on his laptop.
4. Access is logged. A post-incident review is mandatory regardless of outcome.

If Carrot is unavailable, Adora Belle has equivalent approval rights. If both are unavailable, the emergency access procedure from the Vaultwarden runbook applies: physical credentials from the Bank of Ankh-Morpork vault, with immediate notification to both Carrot and Adora Belle.

The `MaintenancePass123` approach was an emergency measure that became permanent. This workflow exists to prevent that from happening again.

## Access request audit

Review recent access requests:

```
tctl audit-query '{ "type": "access_request.create" }' --last=168h
```

Weekly review of access requests is part of Carrot's security operations routine. He looks for:

- Requests without a corresponding incident ticket
- Repeated requests from the same user for the same access (suggests the access should be made permanent via a role change, or the user is doing something outside their normal remit)
- Requests approved unusually quickly (less than two minutes; this can indicate a pre-arranged approval that bypasses the intent of the process)
- Requests that were used for longer than the stated task required
Last updated: 20 March 2026
