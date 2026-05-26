# Alert tuning

When the UEBA system first went live, it produced 47 alerts in its first week. Angua reviewed every one. Forty-three were false positives. The experience of reviewing 43 false positives in a week is not merely tedious; it is actively harmful to security, because an analyst who has reviewed 43 false positives is primed to treat the 44th alert the same way. The tuning process exists to reduce the false positive rate to a level where every alert receives genuine attention, and where a real incident is not buried under a pile of spurious notifications.

## The tuning timeline

Week 1: 47 alerts, 43 false positives (91% FP rate). Primary causes: new users in learning mode whose 30-day baseline had just completed (noisy initial models), developers accessing production during a planned deployment window that the system did not know about, and Ponder's account, which has the most anomalous legitimate behaviour in the organisation.

Month 1: FP rate reduced to 23% through three interventions: adding the `active_incident` context feature, adding a deployment window suppression rule, and increasing the baseline lookback for users whose initial model was based on fewer than 60 events.

Month 2: FP rate reduced to 12% through model parameter adjustments (increasing `contamination` for high-FP users) and the addition of the `recent_password_reset` feature.

Month 3: FP rate reached 3.2% and has remained stable. The remaining false positives are predominantly legitimate unusual activity (travel, emergency access, on-call incidents) that Angua reviews and closes quickly.

## Weekly false positive review

Every Monday morning, Angua reviews all UEBA alerts from the previous week. The review workflow:

1. Open the UEBA Alerts stream in Graylog, filtered to the past 7 days.
2. For each alert: examine the anomalous event, identify the top-contributing features (the processor records the top 3), cross-reference with any known events (incidents, deployments, user travel).
3. Classify: true positive (escalate to incident), false positive (provide feedback), or undetermined (keep open for 24 hours and re-review).
4. For false positives: submit feedback via the dashboard button (selecting appropriate feedback type and adding notes).
5. For patterns (the same feature driving false positives repeatedly for the same user): submit a tuning request to Dr. Crucible.

The weekly review is documented in `security/ueba/review-log/YYYY-WNN.md`.

## Adjusting the score threshold

The initial score threshold was 0.75 for PagerDuty alerts. During the review of the compromised service account incident, Angua noted that the alert had fired at a score of 0.89, but a review of earlier events showed that the account had been scoring between 0.70 and 0.74 for the three days prior to the incident escalating. Lowering the threshold to 0.70 would have surfaced those earlier events for review and might have accelerated detection by up to three days.

The threshold was lowered from 0.75 to 0.70 for Slack routing (low-priority review), with PagerDuty threshold remaining at 0.85. This change increased the weekly alert volume by approximately 8 events per week, all of which were reviewed and closed as false positives in the first two weeks, after which the model adapted and the volume returned to baseline.

Current thresholds:

```
# ueba_processor/config.py
ALERT_THRESHOLDS = {
    "slack_notify": 0.70,
    "pagerduty_alert": 0.85,
    "auto_session_review": 0.90,  # triggers automated Teleport session review
}
```

## Context-aware scoring

The most important tuning intervention was context-aware scoring. Without it, every incident response activity generates UEBA alerts: developers accessing production at 3 AM, security analysts accessing systems they normally do not touch, and Ponder SSHing to twelve different nodes in ten minutes would all score highly.

The context-aware scoring modifier is applied after the base anomaly score is calculated:

```
def apply_context_modifiers(score: float, event: dict, context: dict) -> float:
    modified_score = score

    # During active incidents, production access at unusual hours is expected
    if context.get('active_incident') and event.get('target_sensitivity', 0) >= 4:
        modified_score *= 0.4  # Significantly reduce score for high-sensitivity access during incidents

    # If user explicitly flagged as on-call this week, reduce score for out-of-hours access
    if context.get('user_on_call'):
        modified_score *= 0.6

    # If the user has a travel advisory (submitted via HR system), reduce impossible-travel contribution
    if context.get('user_travelling'):
        if event.get('impossible_travel_feature', 0) > 0:
            modified_score *= 0.7

    return min(1.0, modified_score)
```

The `active_incident` flag is set in the UEBA context table by Angua when an incident is declared, and cleared when the incident is closed. The `user_on_call` flag is set by an integration with the PagerDuty on-call schedule. The `user_travelling` flag is set manually via a Slack slash command (`/ueba-travel @username 2026-03-15 2026-03-22`).

## Deployment window suppression

Planned deployments suppress UEBA alerts for the deployment service accounts during the maintenance window:

```
# Suppress UEBA alerts during known deployment windows
def is_suppressed(event: dict) -> bool:
    username = event.get('ueba_username')
    timestamp = datetime.fromisoformat(event['timestamp'])

    suppressions = get_active_suppressions()
    for suppression in suppressions:
        if (username in suppression['usernames'] and
                suppression['start'] <= timestamp <= suppression['end']):
            return True
    return False
```

Suppressions are created via the UEBA dashboard and stored in the `ueba_suppressions` table. Each suppression has a maximum duration of 4 hours, requires Angua's approval for creation, and is logged with a justification.

## Monthly false positive rate reporting

Angua reports the false positive rate to Carrot monthly. The report includes:

```
# Monthly FP rate calculation
SELECT
    DATE_TRUNC('month', submitted_at) AS month,
    COUNT(*) FILTER (WHERE feedback_type LIKE 'fp_%') AS false_positives,
    COUNT(*) AS total_alerts,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE feedback_type LIKE 'fp_%') / COUNT(*),
        1
    ) AS fp_rate_pct
FROM ueba_feedback
GROUP BY 1
ORDER BY 1 DESC
LIMIT 6;
```

Target false positive rate: below 5%. Current rate: 3.2%. The target for the end of the year is below 2%, achievable by adding the on-call integration (currently manual) and improving the deployment window integration to automatically detect Kubernetes deployment events rather than requiring manual suppression creation.

## Related

- [Long-window detection](../../../counter/evasion/long-window.md)
- [UEBA pipeline implementation](ueba-pipeline.md)
