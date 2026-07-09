# Purple team coordination

Purple team is where Mr. Teatime and Angua sit in the same room. This is a monthly occurrence that both of them approach with something that might generously be described as mutual professional respect. Mr. Teatime brings techniques; Angua brings detection capability. Neither is trying to win. The goal is that by the end of each session, Golem Trust's defences are better than they were at the start, which is a goal both parties can endorse without reservation.

## Exercise structure

Purple team exercises run on the last Thursday of each month. The schedule is:

- 09:00 to 09:30: scenario briefing (Mr. Teatime presents the technique to be demonstrated)
- 09:30 to 11:30: two-hour attack window (Mr. Teatime executes, Angua defends)
- 11:30 to 12:30: one-hour debrief (both teams, plus Carrot)
- 12:30: results recorded in the detection coverage matrix

Unlike a real engagement, Mr. Teatime announces the specific MITRE ATT&CK technique at the start of the attack window. This is not how real attackers operate. The purpose here is learning: Angua should be able to see the technique in action and confirm whether her detection rules are working, then understand exactly what she missed if they are not.

## Scenario selection

Scenario selection uses the previous month's threat intelligence from MISP. At the start of each month, Dr. Crucible pulls the top five techniques observed in threat reports from the past 30 days:

```
# Query MISP for ATT&CK techniques from last 30 days
curl -s -X POST https://misp.golemtrust.am/attributes/restSearch \
  -H "Authorization: MISP_API_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "returnFormat": "json",
    "type": "mitre-attack-pattern",
    "last": "30d"
  }' | jq '.response.Attribute | group_by(.value) |
    map({technique: .[0].value, count: length}) |
    sort_by(.count) | reverse | .[0:5]'
```

Mr. Teatime selects from this list, favouring techniques that are not yet in the detection coverage matrix or that previously failed to generate an alert.

## Caldera scenarios and MITRE ATT&CK mapping

Each purple team scenario is built as a Caldera adversary profile, mapped to a specific ATT&CK technique. The profiles live in the Caldera `stockpile` plugin data directory.

```
# Example adversary profile for T1059.003 (Command and Scripting: Windows Command Shell)
# /opt/caldera/data/adversaries/purple-t1059-003.yml

id: 8f5e9bba-2021-4a44-99c1-purple-t1059-003
name: Purple - T1059.003 Windows Command Shell
description: Purple team scenario for command execution via cmd.exe
atomic_ordering:
  - 7b674f21-6b38-4b2b-9498-b6534cac09a7  # execute via cmd
  - a6cb2fdc-3e1b-4e7a-a5f9-f7d5b9e1c003  # write output to file
```

The `atomic_ordering` field references ability IDs from the stockpile. Each ability corresponds to a specific action a real attacker might take.

## Detection coverage matrix

The detection coverage matrix lives at `security/red-team/detection-coverage.md`. After each purple team exercise, the matrix is updated with four data points:

| ATT&CK Technique | Exercise date | Detected | Time to detect (mins) | Detection source |
|---|---|---|---|---|
| T1566.001 Spearphishing Attachment | 2025-11-28 | Yes | 12 | Graylog email alert |
| T1059.001 PowerShell | 2025-11-28 | Yes | 4 | Falco rule proc.name=powershell |
| T1021.002 SMB/Windows Admin Shares | 2025-12-19 | Yes | 45 | Zeek SMB anomaly |
| T1048.003 Exfiltration over HTTPS | 2025-12-19 | No | N/A | Missed |
| T1078.002 Valid Accounts: Domain | 2026-01-30 | Yes | 18 | Wazuh authentication alert |

For techniques marked "No" in the Detected column, the debrief identifies why detection failed: missing rule, rule present but threshold too high, alert present but routed to wrong stream, or technique genuinely difficult to detect at this layer.

## Updating detection rules after exercises

The debrief produces a list of detection gaps. Each gap becomes a task in the security team's GitLab issue tracker, assigned to Angua with a two-week resolution target.

For a missed technique, the typical remediation workflow is:

1. Identify which log source would have contained evidence (Zeek, Wazuh, Falco, Keycloak, Teleport).
2. Confirm the log source is capturing the relevant event type.
3. Write or update a Graylog pipeline rule or alert condition.
4. Re-test: Mr. Teatime re-runs the specific technique in a focused 30-minute session.
5. Confirm detection fires. Record result in the coverage matrix.

Example Graylog pipeline rule added after the T1048.003 miss:

```
rule "Detect large HTTPS egress to new destination"
when
  has_field("bytes_out") AND
  to_long($message.bytes_out) > 10485760 AND
  NOT cidr_match("10.0.0.0/8", to_ip($message.dst_ip)) AND
  NOT has_field("known_egress_ip")
then
  set_field("alert_type", "potential_data_exfiltration");
  set_field("alert_severity", "high");
  route_to_stream("SOC Alerts");
end
```

## Tracking detection coverage improvement

The percentage of tested ATT&CK techniques with active detection is calculated monthly and reported to Carrot and Adora Belle.

```
# Calculate coverage percentage from the matrix CSV export
import csv

with open('detection-coverage.csv') as f:
    rows = list(csv.DictReader(f))

# Use only the most recent result per technique
latest = {}
for row in rows:
    technique = row['technique_id']
    if technique not in latest or row['date'] > latest[technique]['date']:
        latest[technique] = row

total = len(latest)
detected = sum(1 for r in latest.values() if r['detected'] == 'Yes')
coverage_pct = (detected / total) * 100 if total > 0 else 0

print(f"Techniques tested: {total}")
print(f"Techniques detected: {detected}")
print(f"Coverage: {coverage_pct:.1f}%")
```

Current coverage as of the last quarterly review: 71% of tested techniques have active detection with an alert that fires within 30 minutes. The target for the end of the year is 85%.

## Debrief format

The debrief is a structured conversation, not a post-mortem. Both teams are expected to participate constructively. Mr. Teatime explains what he did, what he expected to happen, and what actually happened. Angua explains what she saw, what she missed, and what she would change about her detection rules.

Carrot chairs the debrief. He is good at this: he takes both sides seriously, does not assign blame, and makes sure action items are clearly owned and dated.

The debrief notes are recorded in the GitLab wiki at `security/red-team/purple-team/YYYY-MM.md`. They are accessible to both red and blue teams, and to Adora Belle.
Last updated: 20 March 2026
