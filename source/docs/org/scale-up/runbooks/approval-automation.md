# Approval automation

Runbook for configuring and operating the approval automation layer that connects StrongDM access requests, Teleport access requests, and the human approval workflow. Mr. Bent requires that approvals be timely, auditable, and cannot be self-approved. This runbook documents how those constraints are enforced technically.

## Approval channels

Approval requests are routed through two channels simultaneously:

- Slack, to the `#db-access-approvals` channel, with an interactive approval button
- Email, to the two required approvers, with a link to the approval interface

Both channels are required. An approver who is on mobile can approve via Slack. An approver without Slack can approve via email link. If neither has responded within the escalation window, PagerDuty escalates to Adora Belle.

## Slack integration

The approval bot is a Slack application registered in the Golem Trust Slack workspace. Its token is stored in Vaultwarden under the Infrastructure collection. The bot has permission to post to `#db-access-approvals` and to read user identities for approval correlation.

When StrongDM or Teleport raises an access request, a webhook call triggers the approval bot service (`src/approval-bot/` in the internal repository). The bot:

1. Fetches the request details (resource, requester, reason, duration)
2. Identifies the required approvers (from the requester's manager field in Keycloak, plus Carrot as the standing security approver)
3. Posts a message to `#db-access-approvals` with Approve and Deny buttons
4. Sends a direct message to each approver with the same options

The approval bot service runs on `strongdm.golemtrust.am` as a small Flask application on port 5000 (internal only, behind Nginx). It uses the StrongDM API and Teleport API to record approvals.

## Approval rules

The following rules are enforced by the approval bot and cannot be overridden:

Self-approval is blocked. The system checks whether either approver is the same person as the requester. If so, it substitutes Adora Belle as the second approver.

Both approvals are required. A single approval does not grant access. If one approver approves and the other denies, the request is denied.

Reasons must be non-trivial. The approval bot rejects requests where the reason field is fewer than 20 characters or matches a list of blocked single-word reasons (`testing`, `investigation`, `maintenance`, `checking`). The requester is prompted to provide a more specific reason.

Approval windows are enforced. Approvals are valid for the duration of the requested session plus 5 minutes. An approver cannot approve a request for a session that has already started via other means.

## Escalation timers

The escalation configuration is in `/opt/approval-bot/config.yaml`:

```
escalation:
  first_reminder_minutes: 15
  second_reminder_minutes: 30
  escalate_to_pagerduty_minutes: 60
  emergency_override_after_minutes: 120

approvers:
  standing_security: carrot.ironfoundersson
  emergency_fallback: adora.belle.dearheart

pagerduty:
  service_key: "<retrieve from Vaultwarden, collection: Infrastructure>"
  escalation_policy: "Database Access Approval"
```

At 15 minutes: both approvers receive a reminder direct message.
At 30 minutes: both approvers receive a second reminder, and the `#db-access-approvals` channel receives a flag.
At 60 minutes: PagerDuty pages the on-call approver (Carrot during business hours, Adora Belle outside business hours).
At 120 minutes: the request expires. The requester must submit a new request.

The 120-minute expiry prevents requests from accumulating and being approved out of context. A request for urgent incident access approved four hours later is not useful; by that point the incident will have been resolved or escalated differently.

## Automated provisioning after approval

When both approvals are received, the approval bot calls the relevant API to grant access:

For StrongDM:

```
POST /api/v1/access-requests/{id}/approve
Authorization: Bearer <strongdm service token>
```

StrongDM then opens the proxied database connection. The requester's CLI or application receives a notification that access is available.

For Teleport:

```
tsh request review --approve <request-id>
```

The approval bot uses a dedicated Teleport service account (`approval-bot`) with only the `reviewer` role. It cannot connect to any servers itself; it can only approve or deny access requests.

## Audit logging

Every approval action is logged to Graylog with the following fields:

- `source_system: approval-bot`
- `event_type: access_approved` or `access_denied`
- `requester`: the Keycloak username of the person requesting access
- `resource`: the database or server being accessed
- `approvers`: a list of approvers and their decisions
- `reason`: the stated reason for access
- `session_duration_requested`: the requested duration in minutes
- `request_timestamp` and `approval_timestamp`

Create a Graylog stream `Access approvals` filtered on `source_system: approval-bot`. This stream is retained for seven years, consistent with Mr. Bent's audit retention requirement.

Cheery generates a monthly report from this stream for the Royal Bank's compliance file. The report shows: total access requests, approval rate, average approval time, and any denied requests with reasons.

## Integrating new resources

When a new database or server is added that requires the approval workflow:

1. Register the resource in StrongDM or Teleport as appropriate
2. Add the resource name to the approval bot's resource list in `/opt/approval-bot/config.yaml`
3. Set the required approvers for this resource (defaults to the requester's manager plus Carrot)
4. If the resource is a Royal Bank asset, set `audit_retention_years: 7`
5. Restart the approval bot: `systemctl restart approval-bot`

Test the integration with a real access request. Confirm the Slack message appears, both approval paths work, and the approved access is correctly granted in StrongDM or Teleport.

## Reviewing approval bot health

The approval bot exposes a health endpoint at `http://localhost:5000/health`. Include it in Prometheus monitoring:

```
- job_name: approval-bot
  static_configs:
    - targets: ['strongdm.golemtrust.am:5000']
  metrics_path: /metrics
```

Alert if the approval bot is down. An offline approval bot means access requests cannot be granted, which will cause an incident during any database maintenance window. Page Ponder if the bot is unreachable for more than five minutes.

## Monthly approval metrics

At the start of each month, pull the previous month's approval metrics from Graylog and record them in the Royal Bank compliance file. Relevant metrics:

- Total requests submitted
- Requests approved vs denied
- Median and 95th percentile approval time (target: median under 15 minutes during business hours)
- Requests that triggered PagerDuty escalation
- Requests that expired without being approved

A median approval time over 15 minutes suggests approvers are not monitoring the channel closely enough. Carrot discusses this with the relevant approvers. A high escalation rate suggests the approval window is too short for the team's working patterns and should be adjusted.
