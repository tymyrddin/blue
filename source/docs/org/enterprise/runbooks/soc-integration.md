# Integration with SOC workflows

A UEBA alert is the beginning of an investigation, not the end of one. When Angua receives a notification that a user's anomaly score has exceeded the threshold, she has a hypothesis: this account may be compromised, or this user may be doing something unusual. The SOC integration exists to give her the tools to test that hypothesis quickly. The compromised service account incident was resolved in 15 minutes from detection to containment; that speed was possible because every tool Angua needed was connected and the workflow was already rehearsed.

## Alert routing

UEBA alerts are routed to two destinations depending on score.

Scores between 0.70 and 0.85 are routed to the `#ueba-alerts` Slack channel for Angua's review during business hours. These are low-priority notifications: worth reviewing, but not urgent enough to interrupt sleep.

Scores above 0.85 trigger a PagerDuty incident. These are urgent and page Angua regardless of time.

The Graylog notification configuration:

```
# High-priority UEBA alert (score >= 0.85)
Notification: PagerDuty Notification
Routing key: PAGERDUTY_UEBA_HIGH_KEY
Condition: ueba_anomaly_score >= 0.85

# Medium-priority UEBA alert (score 0.70-0.85)
Notification: Slack Notification
Webhook URL: SLACK_UEBA_WEBHOOK
Channel: #ueba-alerts
Condition: ueba_anomaly_score >= 0.70 AND ueba_anomaly_score < 0.85
```

## Alert format

Both the Slack and PagerDuty alerts include:

```
UEBA Alert: Anomalous behaviour detected

User: cheery.littlebottom
Score: 0.89
Timestamp: 2026-01-14T02:17:43Z

Anomalous event:
  Type: Teleport session
  Target: production-payments-db
  Source IP: 213.95.100.55 (Netherlands, new location)
  Bytes transferred: 4,718,592 (47x above user baseline)

Top contributing features:
  1. volume_deviation: +12.4 sigma (most anomalous)
  2. known_ip: 0.0 (IP not in baseline)
  3. target_system_sensitivity: 5 (highest sensitivity system)

Graylog event ID: 01HX9M8P3K4N2Q7R6T5V0W1Y2Z
```

The top three contributing features are included in every alert. They are extracted from the Isolation Forest model using the `feature_importances_` attribute of each tree:

```
def get_top_features(model, feature_vector, feature_names, n=3):
    scores = []
    for tree in model.estimators_:
        path = tree.decision_path([feature_vector])
        # Features used in the path contribute to the isolation
        for feature_idx in path.indices:
            scores.append(feature_idx)

    from collections import Counter
    feature_counts = Counter(scores)
    top_indices = [idx for idx, _ in feature_counts.most_common(n)]
    return [(feature_names[i], feature_vector[i]) for i in top_indices]
```

## SOC analyst investigation workflow

When Angua receives a UEBA alert, she follows this procedure:

Step 1: review the Teleport session for the flagged event.

```
# List sessions for the user in the past hour
tsh ls sessions --user=cheery.littlebottom --from="-1h"

# Review the session
tsh play SESSION_ID
```

Step 2: check Wazuh for host events on the target system in the same timeframe.

In the Graylog host events stream, filter by `dest_host:production-payments-db` and the same 1-hour window. Look for unusual commands, file accesses, or network connections from the session.

Step 3: check MISP for the source IP.

```
curl -s -X POST https://misp.golemtrust.am/attributes/restSearch \
  -H "Authorization: $MISP_API_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"returnFormat":"json","value":"213.95.100.55"}' | \
  jq '.response.Attribute[] | {event_id, type, value, comment}'
```

Step 4: decide on action. Three options:

Close as false positive: if a legitimate explanation is found (the user is on a work trip and their SSH client transferred a large file for a legitimate reason). Submit feedback in the UEBA dashboard.

Escalate as incident: if no legitimate explanation is found, or if the evidence suggests credential compromise. Open a Graylog incident, page Carrot, begin the incident response playbook.

Request MFA re-verification: if the situation is ambiguous (unusual location, but no data exfiltration, and the user claims they are travelling). Trigger forced MFA re-verification via Keycloak:

```
curl -X POST https://keycloak.golemtrust.am/auth/admin/realms/golemtrust/users/USER_ID/logout \
  -H "Authorization: Bearer $KEYCLOAK_ADMIN_TOKEN"
```

This logs the user out of all sessions and forces them to re-authenticate with MFA. If the real user re-authenticates without complaint, the session was legitimate. If they are surprised to be logged out, the account was likely compromised.

## Automated session review for high scores

For UEBA scores above 0.90, a Graylog alert webhook triggers an automated Teleport session review script before Angua even opens the alert:

```
# /opt/security/tools/auto-session-review.py
def auto_review_session(alert_data: dict):
    username = alert_data['username']
    event_time = alert_data['timestamp']

    # Find Teleport sessions for this user around the alert time
    sessions = list_teleport_sessions(username, around=event_time, window_minutes=10)

    report = {
        "username": username,
        "alert_score": alert_data['anomaly_score'],
        "sessions_found": len(sessions),
        "session_summaries": []
    }

    for session in sessions:
        summary = {
            "session_id": session['id'],
            "target": session['server_hostname'],
            "duration_seconds": session['duration'],
            "bytes_transferred": session['bytes_transferred'],
            "commands_executed": get_session_commands(session['id'])
        }
        report['session_summaries'].append(summary)

    # Post summary to Slack and attach to PagerDuty incident
    post_to_slack(SLACK_UEBA_CHANNEL, format_session_report(report))
    return report
```

This means that when Angua picks up the PagerDuty alert, the Slack channel already has a summary of what the user did during the flagged session, saving 3-5 minutes of investigation time.

## The compromised service account incident

In February 2026, the UEBA system generated a score of 0.89 for the `svc-payments-integration` service account. The triggering event: the account transferred 47 times its baseline data volume from `production-payments-db` at 02:17 UTC on a Tuesday.

Investigation timeline:

02:17 UTC: UEBA alert fires. PagerDuty pages Angua.

02:19 UTC: Angua acknowledges the alert, reviews the Teleport session. The session shows SQL queries: `SELECT * FROM transactions LIMIT 10000`, repeated multiple times.

02:21 UTC: Angua checks MISP for the source IP. The IP is flagged as a Tor exit node with three previous honeypot accesses at other organisations.

02:23 UTC: Angua revokes the service account's Vault token (which provides the database credentials) and locks the Keycloak service account.

02:32 UTC: Angua confirms the service account's Vault token was last legitimately rotated 3 months ago and the rotation script has a bug that left the old token active. The attacker had obtained the old token from a leaked deployment log.

02:32 UTC: incident declared. Carrot notified. Forensic collection initiated.

Total time from detection to containment: 15 minutes. Estimated rows exported before containment: 11,200 rows of transaction data (no customer PII fields; the service account's Vault policy only grants access to the transactions table without name or address fields). Formal incident report filed. Vault token rotation process fixed.
Last updated: 20 March 2026
