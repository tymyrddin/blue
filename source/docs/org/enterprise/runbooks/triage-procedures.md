# Triage procedures

Angua receives every bug bounty submission within minutes of it being posted on HackerOne or Intigriti. The 24-hour SLA for initial triage response is not aspirational; it is the contractual commitment listed on both programme pages, and researchers notice when it slips. Good triage is what distinguishes a programme that attracts serious researchers from one that does not. A valid finding gets acknowledged quickly and specifically; a duplicate gets a respectful explanation; an out-of-scope submission gets redirected rather than simply dismissed. This runbook covers the full triage flow from submission notification to DefectDojo entry.

## Submission notification

HackerOne and Intigriti both deliver email and webhook notifications when a new submission arrives. The webhook endpoint is `https://api.golemtrust.am/internal/bugbounty-webhook`, which posts an alert to the `#bugbounty-triage` Slack channel with the submission title, severity claimed by the researcher, and a link to the platform.

Angua monitors `#bugbounty-triage` during business hours. Out-of-hours notifications are not paged; the 24-hour SLA allows for a next-morning response to submissions received late in the day.

## Triage checklist

For each new submission, work through the following in order before making any response to the researcher.

Is it in scope? Check the endpoint or component against the current scope document on the programme page. Common edge cases:

- `*.golemtrust.am` subdomains that are not listed as in-scope endpoints: treat as out of scope and check with Carrot whether they should be added
- API endpoints reachable from in-scope applications: in scope even if not explicitly listed, provided the researcher accessed them via the bug bounty environment
- Infrastructure attacks (SSH bruteforce, network scanning): out of scope unless the finding demonstrates a specific exploitable vulnerability

Is it reproducible? Using the bug bounty environment, follow the researcher's reproduction steps exactly. Document what you observe, including any differences from the researcher's description. If you cannot reproduce it, request clarification before making a validity determination.

Is it a known issue? Check DefectDojo for existing findings under the Bug Bounty Submissions product. The duplicate check uses the DefectDojo API:

```
curl -s \
  -H "Authorization: Token ${DEFECTDOJO_TOKEN}" \
  "https://defectdojo.golems.internal/api/v2/findings/?product_name=Bug+Bounty+Submissions&title=<search-term>&limit=10" \
  | jq '.results[] | {id, title, severity, status}'
```

Also check whether the issue is already tracked in the main vulnerability management programme (it may have been found by internal tooling before the researcher reported it).

## Replication in the bug bounty environment

Replicate every finding in the bug bounty environment before assigning it. Never attempt to replicate a finding against production. Use the credentials and accounts provided in the programme scope documentation.

Document the replication with:

- The exact HTTP request(s) made (copy from Burp Suite or the browser's network tab)
- The exact response received
- Screenshots or a screen recording if the finding involves UI behaviour
- The account or data used during the test
- The timestamp of the test (useful for correlating with bug bounty Graylog logs)

If the finding requires specific preconditions (a particular account state, a specific sequence of actions), document those preconditions completely. This documentation becomes the evidence record in DefectDojo and is what the development team uses to reproduce the issue when building the fix.

## Validity assessment

After replication, assess validity:

Valid: the finding is in scope, reproducible, and represents a genuine security issue. Proceed to DefectDojo entry and researcher acknowledgement.

Informational: the finding is technically accurate but does not represent an exploitable vulnerability (for example, a version disclosure header). Acknowledge the submission, explain the assessment, and decline payment while being specific about the reasoning.

Duplicate: the finding was previously reported by another researcher or is an existing known issue. Acknowledge the submission, inform the researcher it is a duplicate without revealing details of the other report, and decline payment. If the duplicate was submitted before the existing finding was fixed, note this for Dr. Crucible; it may indicate the fix is overdue.

Out of scope: acknowledge politely and redirect to the appropriate contact if the researcher has found something genuinely concerning outside the programme scope.

Invalid: the finding is not reproducible or does not represent a security issue. Explain specifically why; a researcher who disagrees should be able to understand the reasoning and respond substantively.

## DefectDojo entry for valid findings

Open a finding in the Bug Bounty Submissions product in DefectDojo. Required fields:

```
Title:        <Descriptive title matching researcher's report>
Severity:     <Initial severity; may be revised after formal assessment>
Product:      Bug Bounty Submissions
Description:  <Researcher's description plus your replication notes>
Steps to reproduce: <Full replication procedure from your testing>
References:   <HackerOne or Intigriti report URL>
Reporter:     <Researcher's platform handle, for attribution>
Found by:     Bug Bounty
```

After creating the finding, link it to the affected application's product in DefectDojo using the DefectDojo finding relationship feature. This is important for the owning team to find it when it is assigned to them.

## Communicating with the researcher

Within 24 hours of submission, send the initial acknowledgement (see the researcher communication runbook for templates). The acknowledgement confirms receipt and sets an expectation for the next update. Do not share your validity assessment in the initial acknowledgement; complete the triage first.

After completing triage, update the researcher with the outcome. See the researcher communication runbook for the appropriate template for each outcome.

## Triage log

Every submission, including invalid and out-of-scope ones, is recorded in DefectDojo as a finding with the appropriate status. This provides an auditable record of all submissions and ensures that patterns (multiple researchers reporting the same out-of-scope finding, for example) are visible to Angua and Carrot when reviewing the programme.

Angua reviews the triage log weekly with Carrot, looking for trends in submission types, recurring out-of-scope submissions that may indicate a scope clarification is needed, and quality signals about the researcher pool.
