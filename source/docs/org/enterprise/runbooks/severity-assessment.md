# Severity assessment

Severity determines the reward tier, the remediation SLA, and how urgently the affected team is engaged. Getting it right matters: score too low and you demotivate good researchers and underreact to real risk; score too high and you exhaust the remediation SLA budget on findings that do not warrant it. Golem Trust uses CVSS v3.1 as the scoring framework, but CVSS scores are adjusted for business context before the final severity is recorded. Angua conducts the initial assessment and reviews it with the team lead for the affected area. Researchers can dispute severity; disputes go to Ludmilla for final determination. This runbook covers the scoring process, common finding types, the business context adjustment logic, and the IDOR finding from the first month as a worked example.

## CVSS v3.1 scoring process

The CVSS base score is calculated from six base metrics: Attack Vector, Attack Complexity, Privileges Required, User Interaction, Scope, and the three impact metrics (Confidentiality, Integrity, Availability). Use the NVD CVSS calculator at `https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator` or the offline equivalent in the security team's tooling.

Record the full CVSS vector string. The vector string is what gets stored in DefectDojo and referenced in the remediation ticket. An example:

```
CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N
Score: 6.5 (Medium)
```

The vector string allows the scoring rationale to be reviewed and disputed with precision. "We scored Attack Complexity as Low because the attack requires no special conditions" is a concrete, reviewable statement. "We scored it Medium" is not.

## Common finding types and typical severity ranges

SQL injection: Critical (9.0+) in almost all cases, because network-accessible SQL injection typically allows full database read and often write. The only exception is injection that is genuinely not reachable from any authenticated or unauthenticated path, which Angua has never seen in practice.

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H
Score: 10.0 (Critical)
```

Authentication bypass: Critical. An authentication bypass that allows access to any protected resource is scored with Privileges Required: None regardless of what the bypassed resource is.

SSRF: High (7.0-8.9). The score varies based on whether the SSRF can reach internal services (higher) or only external addresses (lower), and whether the Scope metric is Changed (if it allows accessing the internal Kubernetes API or Vault).

IDOR: Medium to High (5.0-8.9). The range is wide because IDOR severity depends entirely on what data is exposed. An IDOR that exposes customer names is different from one that exposes payment records.

XSS: Low to High (3.0-8.9). Reflected XSS on a low-traffic page with no sensitive state: Low. Stored XSS in the admin interface that executes in the context of an administrator session: High.

Information disclosure: Low to Medium (1.0-6.9). Version headers and stack traces are Low. Exposure of authentication tokens or PII in an API response is Medium.

## Business context adjustments

The CVSS base score does not account for Golem Trust's specific risk profile. Two adjustments are made before the final severity is recorded:

Internet-facing and customer-facing applications score one severity band higher than the CVSS base score would suggest, compared to equivalent vulnerabilities in internal developer tooling. A Medium CVSS finding in the customer portal or the Royal Bank integration API is recorded as High. The rationale: these systems handle financial data for external customers, and the reputational and regulatory consequences of a breach are significantly higher than for an internal development tool.

Vulnerabilities affecting the Assassins' Guild integration score higher still, because of the contractual sensitivity of that relationship. Any finding that could expose Guild contract metadata receives an additional severity upgrade, subject to Angua's review.

These adjustments are documented in the DefectDojo finding record alongside the CVSS vector string, so the reasoning is transparent to both the researcher and the remediation team.

## Team lead review

After Angua completes the initial scoring, she reviews it with the team lead for the affected application. The team lead provides context about how the vulnerable component is actually used, whether mitigating controls exist that CVSS does not account for (network segmentation, WAF rules), and whether the theoretical impact matches the real-world impact given the data that is actually stored there.

The review is informal: a Slack message or a brief call. The outcome is recorded as a note in the DefectDojo finding: "Reviewed with [team lead] on [date]. Severity confirmed / adjusted from [X] to [Y] because [reason]."

## Researcher severity disputes

A researcher may disagree with the assigned severity. This is more common when a downgrade has occurred (the researcher claimed Critical, Golem Trust assessed High) than when an upgrade has occurred. The dispute process:

1. Researcher raises the dispute on the HackerOne or Intigriti platform
2. Angua reviews the researcher's argument and responds within 48 hours
3. If Angua and the researcher cannot reach agreement, Ludmilla conducts a final review, considering both the CVSS vector and the business context arguments from both sides
4. Ludmilla's determination is final and is communicated to the researcher with a specific explanation

Disputes are recorded in DefectDojo as a note on the finding. The final severity after dispute resolution is the severity used for reward calculation.

## Worked example: the first-month IDOR

A researcher submitted an IDOR finding in the customer portal during the first month of the programme. The vulnerability allowed an authenticated customer to access the account metadata of other customers by manipulating a numeric customer ID parameter in an API endpoint.

The "account metadata" exposed was: account creation date, account tier (standard or premium), and the number of historical transactions. It did not include transaction details, names, addresses, payment information, or any contact data.

Initial CVSS scoring:

```
Attack Vector: Network
Attack Complexity: Low (trivial parameter manipulation)
Privileges Required: Low (requires authenticated customer account)
User Interaction: None
Scope: Unchanged
Confidentiality: Low (non-sensitive metadata only)
Integrity: None (read-only)
Availability: None

CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N
Base Score: 4.3 (Medium)
```

Business context adjustment: the endpoint is in the customer portal, which is internet-facing and handles Royal Bank customer accounts. The customer portal scores one severity band higher. Additionally, Angua consulted with the legal team about GDPR implications: account tier and transaction count, while not individually sensitive, constitute personal data under GDPR when linked to a customer identity. The combination of easy exploitability, internet-facing location, and GDPR relevance justified the upgrade.

Final recorded severity: High.

Reward: €3,000, within the High reward band of €1,000-€5,000. The specific amount within the band reflected the quality of the report (clear reproduction steps, a working proof of concept, and a proposed fix) and Carrot's approval. Angua noted that the researcher's response time to fix-verification requests was unusually fast; this became a factor in the later discussion about hiring.

The IDOR was fixed in four hours, which was the fastest fix time recorded in the first month. The fix replaced the numeric customer ID parameter with a cryptographically random identifier stored in the session, so there is nothing to enumerate.
