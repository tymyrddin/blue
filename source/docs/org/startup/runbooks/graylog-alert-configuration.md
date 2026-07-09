# Alert configuration

Runbook for configuring Graylog alerts. An alert is a notification triggered when a condition on a stream is met. Angua wrote the first set of alert conditions during the week after the Seamstresses' Guild breach. The attacker returned seven days later and was caught in 90 seconds. These are those alerts.

## Notification channels

Alerts are sent via three channels in order of escalation:

1. Slack, to the `#security-alerts` channel, immediately
2. Email, to `security@golemtrust.am`, immediately
3. SMS, to Angua's and Carrot's phones, if no one acknowledges the Slack alert within 10 minutes

### Slack notification

Navigate to Alerts, then Notifications, then Create Notification.

- Type: Slack Notification
- Title: `Security alerts Slack`
- Webhook URL: retrieve from Vaultwarden, collection: Infrastructure, item: Graylog Slack webhook
- Channel: `#security-alerts`
- Icon emoji: leave blank
- Message: use the default template; it includes the alert title, description, and a link to the Graylog search

### Email notification

- Type: Email Notification
- Title: `Security alerts email`
- Recipients: `security@golemtrust.am`
- Subject: `[Graylog] ${alert_condition.title}`
- Body: use the default template

Email requires Graylog's mail configuration to be set. In `/etc/graylog/server/server.conf`:

```
transport_email_enabled = true
transport_email_hostname = smtp.fastmail.com
transport_email_port = 465
transport_email_use_ssl = true
transport_email_use_tls = false
transport_email_auth_username = alerts@golemtrust.am
transport_email_auth_password = <retrieve from Vaultwarden, collection: Infrastructure>
transport_email_from_email = alerts@golemtrust.am
```

Restart Graylog after changing this configuration: `systemctl restart graylog-server`

SMS escalation is handled by a Graylog webhook notification that calls a script on the Graylog server. The script uses the Fastmail SMS API. The webhook URL is `http://127.0.0.1:9999/sms-escalate`; a small Flask service running on each Graylog node handles the call. Dr. Crucible wrote it; the code is in `src/graylog-sms-escalate/` in the internal repository.

## Alert conditions

Navigate to Alerts, then Event Definitions, then Create Event Definition.

### Failed authentication spike

Triggers when more than 10 failed authentication attempts arrive from a single source IP within 5 minutes.

- Title: `Failed authentication spike`
- Priority: High
- Condition type: Aggregation
- Stream: `Authentication events`
- Search query: `message:("authentication failure" OR "invalid credentials")`
- Group by: `client_ip`
- Aggregation: Count, greater than `10`
- Time range: 5 minutes
- Execute every: 1 minute
- Grace period: 5 minutes (do not re-alert for the same IP within 5 minutes of the last alert)
- Notifications: Slack, Email

### Unusual hours portal access

Triggers on any access to customer portals between 02:00 and 04:00 UTC with a non-browser user agent.

- Title: `Out-of-hours portal access with scripted user agent`
- Priority: High
- Condition type: Filter and Count
- Stream: `Customer portals`
- Search query: `user_agent:("curl" OR "wget" OR "python" OR "Go-http-client") AND hour:[2 TO 4]`
- Count, greater than `0`
- Time range: 10 minutes
- Execute every: 5 minutes
- Grace period: 30 minutes
- Notifications: Slack, Email, SMS

This is the rule that would have caught the Seamstresses' Guild attacker on day one instead of day three. The attacker's access was consistent: between 02:30 and 03:45 UTC, using curl. Angua noticed it in the raw log file. The rule notices it automatically.

### Source country anomaly

Triggers when an IP from outside the expected countries accesses the authentication service or customer portals.

- Title: `Authentication from unexpected country`
- Priority: Medium
- Condition type: Filter and Count
- Stream: `Authentication events`
- Search query: `NOT gl2_remote_ip_country:(GB DE NL AT CH AM)`
- Count, greater than `0`
- Time range: 5 minutes
- Execute every: 5 minutes
- Grace period: 60 minutes
- Notifications: Slack, Email

The country list reflects Golem Trust's customer base. Update it when new customers in other countries are onboarded. The `gl2_remote_ip_country` field is populated by Graylog's GeoIP lookup; see the alert tuning runbook for how to enable GeoIP.

### High error rate

Triggers when the error rate on any web-facing service exceeds a threshold.

- Title: `Elevated HTTP 5xx rate`
- Priority: Medium
- Condition type: Aggregation
- Stream: `Web access`
- Search query: `response_code:[500 TO 599]`
- Aggregation: Count, greater than `50`
- Time range: 5 minutes
- Execute every: 2 minutes
- Grace period: 10 minutes
- Notifications: Slack

### Security event flood

Triggers when the `Security events` stream receives an unusually high number of messages, which may indicate an attack or a failing system generating log noise.

- Title: `Security event flood`
- Priority: High
- Condition type: Aggregation
- Stream: `Security events`
- Aggregation: Count, greater than `500`
- Time range: 5 minutes
- Execute every: 1 minute
- Grace period: 15 minutes
- Notifications: Slack, Email, SMS

## Testing alerts

After creating each alert, trigger it manually to confirm the notification channels are working.

For the failed authentication spike, use a Graylog search to inject test events. Navigate to Search, find a recent authentication failure event, and use the Send to Event Definition option if available, or temporarily lower the threshold to 1 event and wait for a natural occurrence.

Alternatively, Angua's preferred method: trigger a few intentional failed logins against the Keycloak staging environment (not production) and observe whether the alert fires and notifications arrive. Check all three channels.

## Acknowledging alerts

When an alert fires, acknowledge it in Slack by reacting with the checkmark emoji. This is convention; Graylog does not currently integrate with the Slack acknowledgement. The 10-minute SMS escalation timer is based on Graylog's own grace period and notification sequence.

A more formal acknowledgement workflow is on Dr. Crucible's list for when the team grows. For now, convention is sufficient: acknowledge in Slack, investigate, post a brief outcome note in the thread.
Last updated: 10 July 2026
