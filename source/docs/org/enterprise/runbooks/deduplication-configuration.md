# Deduplication configuration

When Cheery first imported all scanner results into DefectDojo, she had 347 findings. After deduplication, she had 258. The 89 eliminated duplicates were not the result of generous accounting; they were genuine duplicates, predominantly the same CVEs reported independently by Trivy (which scanned container images) and Wazuh (which scanned the underlying host OS packages). Without deduplication, each of those CVEs would have generated separate remediation tickets, been tracked twice, and contributed to an inflated vulnerability count that would have confused Mr. Bent's quarterly review. This runbook covers DefectDojo's deduplication algorithm, how to configure it, the tuning cases where it does not work automatically, the manual merge procedure, and risk acceptance.

## How DefectDojo deduplication works

DefectDojo computes a hash for each imported finding using a combination of fields. The default hash algorithm combines:

- Title (the vulnerability name or CVE identifier)
- CWE (the Common Weakness Enumeration number, if available)
- Severity
- File path (the path to the affected file, if reported)
- Line number (if reported)

If an incoming finding produces the same hash as an existing finding in the same product, DefectDojo treats it as a duplicate. The existing finding is retained and the new finding is marked as a duplicate and linked. The finding count increases but the active finding count does not.

The deduplication algorithm is applied per-product, not globally. The same CVE in the Infrastructure product and the Royal-Bank-Integration product is not deduplicated, because they represent the same vulnerability in different systems, and each has its own SLA and ownership.

## Configuring deduplication in System Settings

Navigate to `Configuration`, then `System Settings`, then the `Deduplication` section. Set the following:

```
Deduplication algorithm: Hash code (recommended)
Deduplicate findings: Enabled
Close old findings when reimporting: Enabled
Push findings to Jira (for High and Critical): Enabled
```

The "Close old findings when reimporting" option is critical: when a scanner re-runs and a previously found vulnerability is no longer present (because it was patched), DefectDojo automatically closes the old finding. Without this setting, closed vulnerabilities must be tracked and closed manually.

Per-scan-type deduplication overrides can be set at the Engagement level. For Trivy scans of container images, set the deduplication scope to "Product" (rather than "Engagement") so that the same CVE in two different container images within the same product is correctly deduplicated.

## The 347-to-258 reduction explained

The reduction from 347 raw findings to 258 unique findings came from two sources:

First, Trivy and Wazuh both reported the same OS package CVEs. Trivy scanned the container images, which include copies of the OS packages. Wazuh scanned the host OS directly. For example, `CVE-2024-3094` (the XZ Utils backdoor) was reported by both Trivy (in the container image layer that included `liblzma`) and Wazuh (on the container host). DefectDojo correctly identified these as the same CVE with matching title and severity, and deduplicated them to a single finding, noting both affected components.

Second, GitLab SAST and the manual penetration test results both contained findings for the same code-level issues in the Royal Bank integration service. The penetration testers had used the GitLab SAST output as a starting point and reported the same findings with slightly different titles. These required manual merge (see below), as the titles did not match precisely enough for the automatic hash to catch them.

## Tuning: when automatic deduplication does not trigger

The automatic algorithm fails to deduplicate in two main cases:

Case 1: Different file paths reported for the same logical vulnerability. Trivy might report a CVE in `/usr/lib/liblzma.so.5.2.5`, while Wazuh reports it in `liblzma5 5.2.5-2ubuntu1`. The file_path field differs, so the hash differs. To resolve this, configure a deduplication rule override in the Engagement settings to hash on `title` and `CWE` only (omitting `file_path` and `line`), which catches cross-tool duplicates where paths are reported differently.

Case 2: Different tool naming for the same CVE. Some tools report `CVE-2024-3094` while others report `XZ Utils Backdoor (CVE-2024-3094)`. The title hash differs. Resolve this by standardising on CVE identifiers in scanner output where possible, or by applying a title normalisation step in the import script before posting to DefectDojo.

To configure a hash-on-title-and-CWE-only rule for the Infrastructure product:

```
curl -X PATCH https://defectdojo.golemtrust.am/api/v2/products/1/ \
  -H "Authorization: Token ${DEFECTDOJO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"deduplication_on_engagement": false}'
```

Then in the product settings UI, set the deduplication algorithm to "Legacy" with the fields: title, CWE, severity (uncheck file_path and line).

## Manual merge procedure

When two findings represent the same vulnerability but DefectDojo has not automatically deduplicated them:

1. Navigate to the finding you wish to keep as the primary record
2. Select "Mark as duplicate of..." from the finding actions menu
3. Search for and select the finding that should be the original
4. Confirm the merge

The secondary finding is marked as a duplicate and linked to the primary. Its details are preserved in the audit trail. The active count decreases by one.

Before merging, confirm that both findings genuinely refer to the same vulnerability in the same system. Merging a Trivy finding for a container image with an OpenVAS finding for a server host that happens to have the same CVE number but different software is incorrect; these are separate findings requiring separate remediation.

## Risk acceptance

False positives and accepted risks are handled via DefectDojo's risk acceptance feature, not by deleting findings. This preserves the audit trail.

To accept a risk:

1. Navigate to the finding
2. Select "Accept Risk"
3. Set an expiry date: maximum 90 days for Low findings, 30 days for Medium, and no risk acceptance is permitted for High or Critical findings without Cheery's written approval in the change management system
4. Provide a justification

Risk acceptances with past expiry dates are surfaced automatically in DefectDojo's "Expired Risk Acceptances" view. Cheery reviews this list as part of her weekly review. Expired risk acceptances are either renewed (with a new justification) or the finding is returned to active status for remediation tracking.

Bulk risk acceptance for all Low findings in a development tool product is permitted quarterly, as a maintenance operation. Cheery runs this via the DefectDojo bulk actions interface, after confirming with Ponder's team that the affected findings are genuinely low-risk in context. The bulk acceptance must be documented in the change management system with the list of findings and the approval reference.
