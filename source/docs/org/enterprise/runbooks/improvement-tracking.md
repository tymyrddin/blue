# Improvement tracking

Carrot has a principle about improvement: it is not sufficient to find a problem. The problem must be assigned to a person, given a deadline, and checked. Mr. Teatime finds this principle efficient. Angua finds it reassuring. Adora Belle finds it necessary. The improvement tracking register exists because "we identified that finding in Q3" is meaningless without "and here is when it was fixed and who verified the fix."

## The improvement register

After each engagement, findings enter the improvement tracking register at `security/red-team/improvements.md`. Each item follows this format:

```
## IMP-2025-Q3-003: Implement Credential Guard on workstations

Finding: RT-2025-Q3-003 (Cached SMB credentials enabled lateral movement)
Root cause: Windows Defender Credential Guard not enabled on staff workstations,
  allowing LSASS memory extraction of NTLM hashes.
Recommended control: Enable Credential Guard via Group Policy on all Windows
  workstations. Requires UEFI and TPM 2.0 (all current hardware meets this).
Owner: Ponder (infrastructure)
Target date: 2026-01-15 (30-day SLA for High severity)
Status: In progress
Completion evidence: [to be added on completion]

---

## IMP-2025-Q3-001: Deploy LSASS protection detection rule

Finding: RT-2025-Q3-002 (LSASS credential extraction not detected)
Root cause: No Falco or Wazuh rule for LSASS memory access from non-system processes.
Recommended control: Add Falco rule for proc.name in (mimikatz, meterpreter) or
  syscall-level rule for ptrace on lsass.exe equivalent.
Owner: Angua (SOC)
Target date: 2026-01-08 (High severity, detection gap gets same SLA as vulnerability)
Status: Completed 2025-12-28
Completion evidence: Falco rule deployed, verified in purple team exercise 2026-01-30.
  Detection time: 3 minutes from execution.
```

The register is maintained in Git. Each update is a commit, creating an auditable history of when items were completed and by whom.

## Remediation SLAs

Red team finding SLAs are intentionally more lenient than external vulnerability scanner SLAs. This is because red team findings are known to the team, not to attackers. An external scanner finding of Critical severity must be remediated within 24 hours because it may already be known to threat actors. A red team Critical finding was found by the red team in a controlled test; the risk is lower, but remediation is still urgent.

| Severity | SLA | Rationale |
|---|---|---|
| Critical | 7 days | Still urgent; indicates exploitable path to high-value targets |
| High | 30 days | Significant risk but not actively exploited |
| Medium | 90 days | Real risk but lower priority against existing workload |
| Low | Next quarterly cycle | Address as capacity allows |
| Informational | No SLA | No action required; document for awareness |

SLA breach is escalated to Carrot, who determines whether to extend the deadline (with justification) or escalate to Adora Belle.

## Purple team detection coverage matrix

The detection coverage matrix tracks which ATT&CK techniques have been tested and which generate reliable alerts. The matrix is stored at `security/red-team/detection-coverage.md` and updated after every purple team exercise.

```
# Excerpt from detection-coverage.md

| Technique ID | Technique Name | Last tested | Detected | Minutes | Source |
|---|---|---|---|---|---|
| T1566.001 | Spearphishing Attachment | 2025-11-28 | Yes | 12 | Graylog |
| T1059.001 | PowerShell | 2025-11-28 | Yes | 4 | Falco |
| T1059.003 | Windows Command Shell | 2025-12-19 | Yes | 7 | Wazuh |
| T1021.002 | SMB/Windows Admin Shares | 2025-12-19 | Yes | 45 | Zeek |
| T1048.003 | Exfiltration over HTTPS | 2025-12-19 | No | N/A | Missed |
| T1078.002 | Valid Accounts: Domain | 2026-01-30 | Yes | 18 | Wazuh |
| T1055.001 | DLL Injection | 2026-01-30 | No | N/A | Missed |
| T1070.004 | File Deletion | 2026-02-27 | Yes | 22 | Falco |
```

## Tracking detection time improvement

For each technique that has been tested more than once, the improvement register tracks mean time to detect across exercises. This reveals whether tuning efforts are having the intended effect.

```
# calculate_mttd.py
import csv
from collections import defaultdict

results = defaultdict(list)
with open('detection-coverage-history.csv') as f:
    for row in csv.DictReader(f):
        if row['detected'] == 'Yes' and row['minutes']:
            results[row['technique_id']].append(
                (row['date'], int(row['minutes']))
            )

for technique, measurements in sorted(results.items()):
    measurements.sort(key=lambda x: x[0])
    times = [m[1] for m in measurements]
    trend = times[-1] - times[0] if len(times) > 1 else 0
    print(f"{technique}: {times} -> trend: {trend:+d} min")
```

For T1021.002 (SMB lateral movement), the detection time improved from 45 minutes in the first engagement to 8 minutes by the fourth exercise, following Angua's Zeek rule improvements. This improvement is the core metric that justifies the purple team programme.

## Trend reporting to Adora Belle

A quarterly presentation is prepared for Adora Belle, covering:

- Total findings from each engagement in the quarter
- Findings by severity and type (vulnerability vs detection gap)
- SLA compliance rate (percentage of items remediated within SLA)
- Detection coverage: current percentage of ATT&CK techniques with active detection
- Mean time to detect change: is detection getting faster?
- Comparison with SANS SOC Survey data for comparable organisations

The SANS SOC Survey comparison is included because Adora Belle asks about industry benchmarks. The honest answer is that Golem Trust's detection coverage (71% as of Q4 2025) is above the survey median for organisations of comparable size (58%), but below the 85th percentile (82%). The improvement target for the end of 2026 is to reach 85%, which would place Golem Trust in the top quartile for its size band.

The presentation is delivered by Carrot, with Mr. Teatime and Angua both present to answer questions. Adora Belle's questions tend to focus on what the improvements cost and whether they are proportionate to the risk reduction. She does not ask technical questions; she asks business questions. Both Mr. Teatime and Angua find this appropriate and slightly intimidating.
Last updated: 20 March 2026
