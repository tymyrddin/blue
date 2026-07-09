# Workflow automation

Carrot had noticed that vulnerabilities were being found faster than they were being fixed. A finding would sit in DefectDojo, unassigned, while its SLA clock ticked down. The workflow automation layer solves this by routing findings to the correct team automatically, creating Jira tickets for actionable items, and notifying the relevant channel when something critical appears. This runbook covers notification webhooks, auto-assignment logic, Jira integration, two-way sync, bulk operations, and notification channels.

## Notification webhooks

DefectDojo supports outbound webhooks for finding events. Configure the webhook in `Configuration`, `Notifications`, `Webhook`:

```
URL: https://hooks.golemtrust.am/defectdojo-events
Secret: ${WEBHOOK_SECRET}
Events:
  - New finding created
  - Finding severity changed
  - Finding closed
  - SLA breach
```

The webhook receiver at `hooks.golemtrust.am` is a lightweight Python service that routes events to the appropriate downstream action (Jira creation, team chat notification, assignment logic). The webhook secret is stored in Vault at `secret/defectdojo/webhook-secret` and verified against the `X-DefectDojo-Signature` header.

## Auto-assignment logic

Findings are automatically assigned to a team based on the component type tag and product metadata. The assignment rules are implemented in the webhook receiver:

```
def assign_finding(finding: dict) -> str:
    """
    Return the Keycloak group name responsible for this finding.
    """
    product_name = finding.get("product_name", "")
    tags = finding.get("tags", [])
    component = finding.get("component_name", "")

    # Container/Kubernetes findings go to Ludmilla's team
    if "container" in tags or "kubernetes" in tags or "image" in component.lower():
        return "containers-team"

    # Infrastructure findings go to Ponder's team
    if product_name == "Infrastructure" or "infrastructure" in tags:
        return "infrastructure-team"

    # Royal Bank integration findings have their own owner
    if product_name == "Royal-Bank-Integration":
        return "royal-bank-integration-team"

    # Application findings use the product metadata owner field
    owner_group = finding.get("product_metadata", {}).get("owner_group")
    if owner_group:
        return owner_group

    # Default: assign to the general applications team
    return "applications-team"
```

The Keycloak group name is mapped to a DefectDojo user via the product member list. The finding is assigned in DefectDojo via the API:

```
curl -X PATCH "https://defectdojo.golemtrust.am/api/v2/findings/${FINDING_ID}/" \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"assigned_to\": ${USER_ID}}"
```

Product metadata (including the `owner_group` field) is managed in the DefectDojo product settings and updated when service ownership changes. Carrot maintains the ownership mapping in a YAML file in the `golem-trust/security-config` GitLab repository, from which the webhook receiver reads at startup.

## Jira integration

DefectDojo creates a Jira ticket automatically for every High and Critical finding. Configure the Jira integration in `Configuration`, `Tool Configuration`:

```
Tool type: Jira
Name: Golem Trust Jira
URL: https://jira.golemtrust.am
Authentication type: Token
Token: ${JIRA_SERVICE_ACCOUNT_TOKEN}
```

Then configure Jira project mapping in `Configuration`, `Jira`:

```
Default Jira project key: SEC
Push all issues: false
Push High and Critical: true
Push findings to Jira: on finding creation
```

Per-product Jira project mapping:

```
Product: Infrastructure          -> Jira project: INFRA
Product: Containers              -> Jira project: KUBE
Product: Applications            -> Jira project: APP
Product: Royal-Bank-Integration  -> Jira project: RBI
```

The Jira ticket template includes the finding title, severity, CVE reference, affected component, SLA deadline, and a direct link back to the DefectDojo finding. Tickets are created with the `Security` label and the severity as the priority (Critical maps to `Blocker`, High maps to `High`).

## Two-way sync: Jira to DefectDojo

When a developer resolves and closes the Jira ticket, DefectDojo automatically marks the linked finding as "Mitigated". This is handled by a Jira webhook that notifies DefectDojo when a ticket transitions to the "Done" status.

Configure a Jira automation rule in each relevant Jira project:

```
Trigger: Issue transitioned to Done
Condition: Labels contain "Security"
Action: Send web request
  URL: https://defectdojo.golemtrust.am/api/v2/findings/${DD_FINDING_ID}/close/
  Method: POST
  Headers: Authorization: Token ${DEFECTDOJO_API_TOKEN}
  Body: {"close_note": "Resolved via Jira ticket ${issue.key}"}
```

The `${DD_FINDING_ID}` is stored as a custom field on the Jira ticket, populated when DefectDojo creates the ticket. The reverse is also true: when DefectDojo marks a finding as mitigated (e.g. because a scanner reimport shows the vulnerability is gone), the Jira ticket is transitioned to "Done" via the DefectDojo Jira integration.

## Bulk operations: quarterly Low finding risk acceptance

Every quarter, Cheery performs a bulk risk acceptance for Low findings in development tool products (products tagged `dev-tools`). These findings represent vulnerabilities in tools that are not used in production and carry genuinely low risk. The procedure:

1. Query all Low active findings in `dev-tools` tagged products:

```
curl "https://defectdojo.golemtrust.am/api/v2/findings/?severity=Low&active=true&tags=dev-tools" \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  | python3 -c "import json,sys; [print(f['id']) for f in json.load(sys.stdin)['results']]" \
  > low-finding-ids.txt
```

2. Review the list with Ponder's team to confirm no finding has been miscategorised

3. Apply bulk risk acceptance via the DefectDojo UI: navigate to the Findings list, filter by the same criteria, select all, choose "Accept Risk" with a 90-day expiry and the justification "Quarterly maintenance: dev-tools Low findings accepted pending next quarterly review"

4. Record the action in the change management system with the count of accepted findings and Ponder's approval reference.

## Notification channel: #security-findings

New Critical findings trigger an immediate notification to the `#security-findings` channel in the Golem Trust team chat (Mattermost). The webhook receiver posts to the Mattermost incoming webhook:

```
def notify_critical(finding: dict):
    message = (
        f":red_circle: **New Critical Finding**\n"
        f"Product: {finding['product_name']}\n"
        f"Title: {finding['title']}\n"
        f"SLA deadline: {finding['sla_expiration_date']}\n"
        f"Link: https://defectdojo.golemtrust.am/finding/{finding['id']}\n"
        f"Assigned to: {finding.get('assigned_to', {}).get('username', 'unassigned')}"
    )
    requests.post(
        os.environ["MATTERMOST_WEBHOOK_URL"],
        json={"channel": "security-findings", "text": message},
        timeout=10,
    )
```

Cheery has configured Mattermost to send her a push notification for every message in `#security-findings` regardless of the time of day. Angua is also a member of this channel. Neither of them has complained about the interruptions; they consider it preferable to the alternative.
