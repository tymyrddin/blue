# SLA setup

Cheery introduced the SLA policy with the directness that characterises her approach to most things. "You have until tomorrow morning to fix Critical vulnerabilities. Seven days for High. After that, you're in breach and I will be explaining to Mr. Bent why." Mr. Bent is the Royal Bank's auditor, and nobody wants to explain anything to Mr. Bent, least of all a missed vulnerability remediation deadline. DefectDojo's SLA configuration enforces these timelines automatically, sends notifications as deadlines approach, and provides the metrics that feed both the weekly team review and the quarterly compliance report. This runbook covers SLA configuration in System Settings, breach notifications, Graylog forwarding, Prometheus metrics, and the Royal Bank's separate SLA profile.

## SLA configuration in System Settings

Navigate to `Configuration`, then `System Settings`, then the `SLA` section. Set the following SLA values:

```
Critical: 1 day
High:     7 days
Medium:   30 days
Low:      90 days
```

These values represent the number of calendar days from the date a finding is first reported to the date it must be remediated (status set to "Mitigated" or "Resolved"). The SLA clock starts on the `date` field of the finding, which is set to the date of the scan that first identified it.

Save the settings. The SLA configuration applies to all products globally, with the exception of products that have a custom SLA profile configured (see the Royal Bank section below).

## SLA breach notifications

DefectDojo sends notification emails at two points during a finding's SLA lifecycle:

- At 50% of the SLA period remaining (e.g. 12 hours before a Critical deadline, 3.5 days before a High deadline)
- At 10% of the SLA period remaining (e.g. 2.4 hours before a Critical deadline, approximately 17 hours before a High deadline)

Configure the notification recipients in `Configuration`, `Notifications`:

```
SLA breach approaching: security-team@golemtrust.am
SLA breach occurred: security-team@golemtrust.am, cheery@golemtrust.am
```

Ensure that the DefectDojo instance has outbound SMTP access to the Golem Trust mail relay at `mail.golems.internal`. The SMTP configuration in `.env`:

```
DD_EMAIL_URL=smtp://mail.golems.internal:25/?from=defectdojo@golemtrust.am
```

## Forwarding SLA breach notifications to Graylog

SLA breach events are also logged to Graylog via the DefectDojo webhook notification channel. Configure a webhook in `Configuration`, `Notifications`:

```
Webhook URL: http://graylog.golems.internal:12201/gelf
Format: JSON
Events: SLA breach approaching, SLA breach occurred
```

In Graylog, create a stream "DefectDojo SLA Breaches" with the rule:

```
Field: source
Type: string matches exactly
Value: defectdojo
```

Combined with:

```
Field: message
Type: string contains
Value: SLA
```

Configure a Graylog alert that pages Cheery immediately when a Critical finding breaches SLA, since a Critical vulnerability remaining unmitigated beyond 24 hours is an incident requiring escalation.

## Prometheus metric for SLA breach count

A Prometheus exporter script polls the DefectDojo API every 15 minutes and exposes breach metrics for Grafana. The script runs as a cron job on the DefectDojo host:

```
#!/usr/bin/env python3
import requests
import time

DEFECTDOJO_URL = "https://defectdojo.golemtrust.am"
TOKEN = open("/etc/defectdojo-metrics-token").read().strip()
METRICS_FILE = "/var/lib/prometheus-exporters/defectdojo-sla.prom"

severity_levels = ["Critical", "High", "Medium", "Low"]
metrics = []

for severity in severity_levels:
    response = requests.get(
        f"{DEFECTDOJO_URL}/api/v2/findings/",
        headers={"Authorization": f"Token {TOKEN}"},
        params={
            "active": True,
            "verified": True,
            "severity": severity,
            "is_Mitigated": False,
            "limit": 1,
        },
        timeout=30,
    )
    data = response.json()
    # DefectDojo marks SLA-breached findings with sla_expiration_date in the past
    breach_response = requests.get(
        f"{DEFECTDOJO_URL}/api/v2/findings/",
        headers={"Authorization": f"Token {TOKEN}"},
        params={
            "active": True,
            "severity": severity,
            "is_Mitigated": False,
            "outside_sla": True,
            "limit": 1000,
        },
        timeout=30,
    )
    breach_count = breach_response.json().get("count", 0)
    metrics.append(
        f'defectdojo_sla_breach_count{{severity="{severity.lower()}"}} {breach_count}'
    )

with open(METRICS_FILE, "w") as f:
    f.write("\n".join(metrics) + "\n")
```

The Prometheus node exporter's textfile collector picks up the `.prom` file automatically. The Grafana dashboard "Security SLA" displays breach counts by severity with threshold lines at zero (target) and acceptable limits.

## Cheery's weekly SLA review

Every Monday morning, Cheery queries the DefectDojo API for all findings past their SLA deadline:

```
curl "https://defectdojo.golemtrust.am/api/v2/findings/?outside_sla=true&active=true" \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  | python3 -m json.tool
```

For each breached finding, she:

1. Confirms a remediation Jira ticket exists and is assigned
2. Chases the assigned team if the ticket is not progressing
3. Documents the delay reason in the DefectDojo finding notes field
4. Escalates to Carrot if the finding has been in breach for more than 48 hours

## Royal Bank SLA profile

The Royal Bank integration carries a contractual SLA requirement: no Critical finding in the Royal-Bank-Integration product may remain open for longer than 24 hours. This matches the global Critical SLA. However, the contract also specifies that High findings must be resolved within 5 days (not 7), and that Golem Trust must report any SLA breach to the Royal Bank liaison within 4 hours of the breach occurring.

Create a custom SLA configuration for the Royal Bank product:

1. Navigate to `Configuration`, `SLA Configurations`
2. Create a new SLA configuration named "Royal Bank"
3. Set: Critical 1 day, High 5 days, Medium 30 days, Low 90 days
4. Assign this SLA configuration to the Royal-Bank-Integration product in its product settings

The Royal Bank SLA profile also requires a separate notification group. When a Royal-Bank-Integration finding approaches or breaches SLA, an automated email goes to both `cheery@golemtrust.am` and the Royal Bank liaison address on file. This is configured as an additional recipient in the product-level notification settings.

## Reporting SLA compliance to Mr. Bent

Quarterly, Otto Chriek prepares an SLA compliance summary for Mr. Bent's review. The data is pulled from the DefectDojo API:

```
curl "https://defectdojo.golemtrust.am/api/v2/findings/?product_name=Royal-Bank-Integration" \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  > royal-bank-findings.json
```

The summary includes:

- Total findings opened in the period
- Total findings closed within SLA
- Total findings that breached SLA (must be zero for Critical)
- For any High SLA breaches: finding reference, breach duration, and remediation date
- Overall SLA compliance rate as a percentage

Mr. Bent expects the Critical compliance rate to be 100% and the High compliance rate to be at least 95%. Otto delivers the report as a PDF no later than two weeks after the end of each quarter.
