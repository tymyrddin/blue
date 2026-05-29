# Collaborative testing

Much like the Assassins' Guild's practice of "professional courtesy tests", wherein they attempt to infiltrate each other's headquarters to ensure everyone's security remains up to scratch, collaborative testing pits red and blue teams against each other in controlled exercises. The difference being that, unlike the Guild, we'd prefer everyone survives the process.

Collaborative testing transforms BGP hijacking scenarios into practical exercises where red teams execute attacks whilst blue teams attempt detection and response. As Commander Vimes might observe, "You don't know if your locks work until someone competent tries to pick them." In our case, the locks are detection rules, and the lock picks are carefully crafted BGP hijacking attempts.

## Running joint exercises

### Overview

Joint exercises follow a structured approach:

1. Red team uses simulator scenarios as attack blueprints
2. Blue team attempts to detect and respond in real-time
3. Purple team (or neutral observers) coordinates and documents
4. All teams participate in retrospective analysis and improvement

The goal isn't to determine which team is "better". It is to identify gaps, validate detections, and improve defensive capabilities through adversarial collaboration.

### Red Team: Using Scenarios as attack blueprints

Scenarios from the BGP simulator serve as detailed attack plans. Rather like how the Thieves' Guild might plan a h
eist, red team operators follow the scenario timeline whilst adapting to blue team responses.

#### Scenario selection

Choose scenarios based on training objectives:

Playbook 1 - Opportunistic Hijack
- Difficulty: Beginner
- Duration: ~5 minutes
- Focus: Basic BGP monitoring, RPKI validation
- Use when: Testing fundamental detection capabilities

Playbook 2 - Credential Compromise
- Difficulty: Intermediate
- Duration: ~45 minutes
- Focus: Authentication monitoring, ROA change detection, multi-stage attacks
- Use when: Validating detection correlation across multiple systems

Playbook 3 - Sub-prefix Hijacking
- Difficulty: Advanced
- Duration: ~90 minutes
- Focus: Traffic analysis, RPKI maxLength exploitation, sustained attacks
- Use when: Testing advanced traffic monitoring and anomaly detection

Or [roll your own adapted for your specific context](index.rst).

#### Attack execution playbook

Red team operators receive detailed execution instructions derived from scenarios:

Example: Playbook 2 Execution guide

```markdown
## Attack: Credential Compromise to ROA Manipulation

Objective: Create fraudulent ROA to legitimise future BGP hijacking

Prerequisites:
- Access to test TACACS credentials
- Tor/VPN access configured
- ARIN test portal access
- BGP announcement capability (simulation or lab environment)

Timeline:

T+00:00 - Initial Access
- Action: Authenticate to TACACS server from Tor exit node
- Credentials: testadmin@victim-network.test
- Source IP: 185.220.101.45 (Tor exit)
- Expected Detection: Suspicious geographic login, Tor exit node detection
- If Detected: Document detection time, continue with modified approach

T+00:01 - Defence Evasion
- Action: Submit ROA request via ARIN test portal
- Target Prefix: 203.0.113.0/24
- Origin ASN: AS64513
- maxLength: /25 (enables sub-prefix hijacking)
- Expected Detection: Anomalous ROA request, maxLength policy violation
- If Detected: Document detection time, assess response

T+00:40 - Impact (ROA Publication)
- Action: Wait for ROA publication to test repository
- Monitor: Validator sync logs
- Expected Detection: ROA publication monitoring, change detection
- If Detected: Document detection time and alert quality

T+00:45 - Impact (Validator Acceptance)
- Action: Verify multiple validators accept ROA
- Check: routinator, cloudflare, ripe validators
- Expected Detection: Validator consensus change alerts
- If Detected: Document detection time, verify alert contains correct context

Success Criteria:
- ROA published without detection
- Multiple validators accept fraudulent ROA
- No defensive response within 60 minutes

Red Team Notes:
- Document all actions with precise timestamps
- Note any deviations from planned timeline
- Record blue team detection points
- Assess blue team response quality and timeliness
```

#### Operational considerations

Communication Protocol: Red team maintains secure communication channel separate from blue team monitoring. Think 
of it as the Thieves' Guild's sign language, observable if you know what to look for, but not in the normal course 
of business.

Safety rails: 

- All attacks confined to test environment or isolated production segments
- Kill switch procedures for immediate halt if real impact detected
- Clear distinction between test traffic and production traffic
- Mandatory pre-exercise validation of isolation

Stealth vs. Detection: Red team balances realistic attack simulation with learning objectives. Early exercises may be 
deliberately noisy; advanced exercises test true detection limits.

### Blue Team: Validating detection coverage

Blue team operates as they would during a real incident, with the added benefit of knowing an exercise is underway 
(though not necessarily when or what).

#### Exercise types

1. Announced Exercise (White Card)
- Blue team knows exercise is happening
- Focus: Process validation, tool effectiveness
- Example: "Between 09:00-17:00 today, red team will attempt BGP hijacking"

2. Partially Blind Exercise (Grey Card)
- Blue team knows exercise window but not specifics
- Focus: Alert triage, investigation procedures
- Example: "This week, red team will execute one of three scenarios"

3. Blind Exercise (Black Card)
- Blue team unaware exercise is occurring
- Focus: True detection capability, response time
- Example: Exercise conducted during normal operations
- Critical: Requires senior management awareness and kill switch

#### Detection Validation Checklist

For each scenario phase, blue team validates:

T+00:00 - Initial Access Detection

```
Detection Points:
  - [ ] Authentication log monitoring active
  - [ ] Geographic anomaly detection triggered
  - [ ] Tor exit node detection activated
  - [ ] Alert generated within 5 minutes
  - [ ] Alert contains sufficient context for investigation
  
Investigation:
  - [ ] Analyst reviewed alert within 15 minutes
  - [ ] Source IP identified as suspicious
  - [ ] Account activity examined
  - [ ] Timeline of account actions documented
  
Response:
  - [ ] Incident ticket created
  - [ ] Appropriate escalation occurred
  - [ ] Defensive actions considered (account suspension, MFA challenge)
```

T+00:01 - Defence Evasion Detection

```
Detection Points:
  - [ ] ROA creation monitoring active
  - [ ] ROA request logged and alerted
  - [ ] Anomaly detection identified unusual maxLength
  - [ ] Alert correlated with earlier suspicious login
  
Investigation:
  - [ ] ROA request examined for legitimacy
  - [ ] Prefix ownership validated
  - [ ] Requesting account cross-referenced with suspicious login
  - [ ] Threat assessment completed
  
Response:
  - [ ] ROA request blocked or flagged for review
  - [ ] Stakeholder notification (prefix owner, security team)
  - [ ] Additional monitoring deployed
```

T+00:40 - Impact Detection (ROA Publication)

```
Detection Points:
  - [ ] ROA publication monitoring detected change
  - [ ] Alert generated for new ROA
  - [ ] Historical comparison flagged unexpected ROA
  - [ ] Multiple data sources correlated
  
Investigation:
  - [ ] ROA legitimacy assessed
  - [ ] Publication timeline examined
  - [ ] Validator acceptance monitored
  - [ ] Full attack chain reconstructed
  
Response:
  - [ ] Incident declared
  - [ ] ROA revocation initiated
  - [ ] Validator operators notified
  - [ ] Communications plan activated
```

#### Real-Time Monitoring

Blue team maintains operational log during exercise:

```
09:15:00 - Exercise Start (Announced)
09:16:23 - Alert: Suspicious authentication from 185.220.101.45
09:17:45 - Analyst reviewing alert
09:18:12 - Identified as Tor exit node, account flagged
09:19:30 - Additional monitoring deployed on account
09:21:45 - Alert: ROA creation request from flagged account
09:22:10 - Analyst examining ROA request
09:23:45 - Request identified as suspicious (maxLength mismatch)
09:25:00 - Incident ticket IT-2026-0142 created
09:26:30 - Escalated to Network Security Team
09:28:00 - Request to block ROA submission sent to ARIN
09:45:00 - ROA published despite block request (FAILURE POINT)
09:46:15 - ROA publication detected by monitoring
09:47:00 - Incident escalated to Critical
09:50:00 - ROA revocation process initiated
```

### Purple Team coordination

The purple team (or neutral facilitator) ensures smooth exercise execution. Think of them as the referees in a game 
of Thud, ensuring both sides play fair and everyone learns something.

#### Pre-exercise responsibilities

1. Exercise Planning
```yaml
Exercise: Playbook 2 - Credential Compromise
Date: 2026-01-15
Time: 09:00-12:00 GMT
Type: Announced (White Card)

Participants:
  Red Team:
    - Alice (Lead)
    - Bob (Operator)
  Blue Team:
    - Charlie (SOC Analyst)
    - Diana (Network Security)
    - Eve (Incident Response)
  Purple Team:
    - Frank (Coordinator)

Environment:
  - Test TACACS: tacacs-test.example.com
  - Test RPKI: rpki-test.arin.net
  - Monitoring: SIEM test instance
  - Isolation: VLAN 2500 (isolated)

Success Criteria:
  - All detection points tested
  - Response procedures validated
  - Gaps documented
  - No impact to production systems

Safety:
  - Kill switch: Frank has authority to halt
  - Production isolation verified
  - Rollback procedures tested
  - Emergency contacts distributed
```

2. System Validation
- Test environment isolated from production
- Detection systems operational in test environment
- Communication channels established
- Documentation templates prepared

#### During exercise

Timeline Tracking: Purple team maintains authoritative timeline:

| Time     | Phase           | Red Action     | Blue Detection               | Blue Response         | Notes              |
|----------|-----------------|----------------|------------------------------|-----------------------|--------------------|
| 09:15:00 | Start           | -              | -                            | -                     | Exercise initiated |
| 09:16:23 | Initial Access  | Login from Tor | Alert generated              | Analyst assigned      | Detection success  |
| 09:21:45 | Defence Evasion | ROA request    | Alert generated              | Analyst reviewing     | Detection success  |
| 09:45:00 | Impact          | ROA published  | Alert generated (+45s delay) | Escalated to critical | Detection delayed  |
| 10:15:00 | End             | Withdraw       | -                            | Revocation initiated  | Exercise complete  |

Observation notes:

- Initial access: Excellent detection, rapid analyst response
- Defence evasion: Good detection, correlation with earlier alert noted
- Impact (ROA Publication): Detection delayed by 45 seconds due to polling interval
- Gap identified: No automated blocking of ROA requests from suspicious accounts

#### Post-exercise responsibilities

1. Immediate debrief (within 30 minutes)
- Quick wins and obvious issues
- What worked well
- Critical failures
- Immediate remediation needs

2. Detailed analysis (within 48 hours)
- Complete timeline reconstruction
- Detection effectiveness metrics
- Response procedure gaps
- Technology limitations

3. Improvement plan (within 1 week)
- Specific remediation tasks
- Priority assignments
- Timeline for fixes
- Validation criteria

### Feedback loops for improvement

Collaborative testing creates continuous improvement cycles:

#### Cycle 1: Detection gap remediation

```
Exercise Reveals Gap → Document Gap → Create Remediation Task → Implement Fix → Validate Fix in Next Exercise
```

Example:

```yaml
Gap Identified: ROA publication detection delayed by polling interval

Analysis:
  Current State: RPKI repository polled every 60 seconds
  Issue: 45-second delay in detecting ROA publication
  Impact: Gives attacker additional time for exploitation
  
Remediation:
  Task: Implement webhook-based ROA publication notifications
  Owner: Diana (Network Security)
  Priority: High
  Timeline: 2 weeks
  
Validation:
  Test: Next Playbook 2 exercise
  Success Criteria: ROA publication detected within 5 seconds
  Scheduled: 2026-02-01
```

#### Cycle 2: Response procedure enhancement

```
Slow Response Observed → Identify Bottleneck → Update Procedure → Train Staff → Test in Exercise
```

Example:

```yaml
Issue Identified: 15-minute delay between ROA request alert and escalation

Root Cause Analysis:
  - Analyst unsure which stakeholder to notify
  - No clear escalation criteria documented
  - Contact information not readily available
  
Improvements:
  1. Create ROA incident decision tree
  2. Document escalation criteria and contacts
  3. Add contacts to SIEM alert context
  4. Train analysts on new procedure
  
Validation:
  - Next exercise should show sub-5-minute escalation
  - Analyst should demonstrate decision tree usage
  - Contact information should be readily accessible
```

#### Cycle 3: Tool enhancement

```
Tool Limitation Discovered → Evaluate Solutions → Implement Enhancement → Integrate with Workflow → Exercise Validation
```

Example:
```yaml
Limitation: No correlation between authentication alerts and ROA requests

Enhancement Plan:
  Phase 1: Add correlation rule in SIEM
    - Link authentication events to RPKI actions by account
    - Enrich ROA alerts with recent authentication context
    - Timeline: 1 week
    
  Phase 2: Develop context dashboard
    - Display account activity timeline
    - Show related alerts and actions
    - Timeline: 3 weeks
    
  Phase 3: Automated risk scoring
    - Calculate risk score based on authentication and ROA patterns
    - Prioritise high-risk activities
    - Timeline: 6 weeks
    
Validation Schedule:
  - Phase 1: 2026-01-20 (mini-exercise)
  - Phase 2: 2026-02-10 (full exercise)
  - Phase 3: 2026-03-15 (full exercise)
```

#### Cycle 4: Scenario evolution

```
Attack Evaded Detection → Document Evasion Technique → Update Scenario → Enhance Detection → Re-test
```

Example:
```yaml
Evasion Technique: Red team split ROA request across multiple accounts

Current Scenario (Playbook 2):
  - Single account performs all actions
  - Detection relies on account-based correlation
  
Enhanced Scenario (Playbook 2.1):
  - Account A performs initial reconnaissance
  - Account B (compromised separately) submits ROA request
  - Account C validates publication
  - Requires detection based on behavior patterns, not account linking
  
Detection Enhancement:
  - Implement behavioral analysis for ROA requests
  - Monitor for unusual ROA creation patterns regardless of account
  - Alert on ROA requests for prefixes with recent suspicious activity
  
Validation:
  - Execute Playbook 2.1 in next advanced exercise
  - Blue team should detect based on behavior, not account
```

### Exercise maturity model

Collaborative testing progresses through maturity levels:

Level 1: Basic (Announced, Scripted)

- White card exercises
- Red team follows exact scenario timeline
- Blue team knows what to expect
- Focus: Tool validation, basic procedures

Level 2: Intermediate (Partially Blind, Adaptive)

- Grey card exercises
- Red team adapts to blue team detection
- Blue team knows exercise window but not specifics
- Focus: Detection correlation, investigation procedures

Level 3: Advanced (Blind, Adversarial)

- Black card exercises
- Red team actively evades detection
- Blue team unaware of exercise
- Focus: True detection capability, realistic response

Level 4: Continuous (Ongoing, Automated)

- Regular automated testing
- Synthetic attacks injected into monitoring
- Continuous validation of detection rules
- Focus: Sustained readiness, regression prevention

Disclaimer: The simulator is now maturity level 1, but [custom scenarios and integrations](index.rst) can 
easily be made.

## Measuring detection effectiveness

Numbers don't lie, though as Ankh-Morpork accountants demonstrate, they can be persuaded to remain very quiet about 
certain facts. Our metrics, however, are designed for transparency.

### Detection rate per scenario

Definition: Percentage of attack phases detected by blue team

Calculation:
```
Detection Rate = (Detected Phases / Total Phases) × 100%
```

Example: Playbook 2 Results

```
Scenario: Playbook 2 - Credential Compromise
Total Phases: 4

Phase 1: Initial Access (Tor Login)
  Status: DETECTED
  Time to Detection: 67 seconds
  Detection Method: Geographic anomaly alert + Tor exit node detection
  Alert Quality: Excellent (sufficient context for investigation)

Phase 2: Defence Evasion (ROA Request)
  Status: DETECTED
  Time to Detection: 145 seconds
  Detection Method: ROA creation monitoring + correlation with Phase 1
  Alert Quality: Good (some manual correlation required)

Phase 3: Impact (ROA Publication)
  Status: DETECTED
  Time to Detection: 45 seconds (from publication)
  Detection Method: RPKI repository polling
  Alert Quality: Fair (delayed due to polling interval)

Phase 4: Impact (Validator Acceptance)
  Status: NOT DETECTED
  Time to Detection: N/A
  Detection Method: No validator consensus monitoring configured
  Alert Quality: N/A

Detection Rate: 3/4 = 75%
```

### Tracking detection rates over time

```
# Example detection tracking
exercises = [
    {'date': '2026-01-15', 'scenario': 'Playbook 2', 'detection_rate': 0.75},
    {'date': '2026-01-22', 'scenario': 'Playbook 3', 'detection_rate': 0.50},
    {'date': '2026-02-01', 'scenario': 'Playbook 2', 'detection_rate': 1.00},  # After fixes
    {'date': '2026-02-10', 'scenario': 'Playbook 3', 'detection_rate': 0.75},  # Improvement
]

# Visualise improvement trend
import matplotlib.pyplot as plt

dates = [e['date'] for e in exercises]
rates = [e['detection_rate'] * 100 for e in exercises]

plt.plot(dates, rates, marker='o')
plt.axhline(y=80, color='r', linestyle='--', label='Target: 80%')
plt.xlabel('Exercise Date')
plt.ylabel('Detection Rate (%)')
plt.title('Detection Rate Improvement Over Time')
plt.legend()
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('detection_rate_trend.png')
```

### Detection rate by attack phase

```yaml
Initial Access:
  Playbook 1: N/A (no initial access phase)
  Playbook 2: 100% (4/4 exercises)
  Playbook 3: N/A (no credential-based access)
  Average: 100%
  Status: Excellent

Defence Evasion:
  Playbook 1: 75% (3/4 exercises)
  Playbook 2: 75% (3/4 exercises)
  Playbook 3: 50% (2/4 exercises)
  Average: 67%
  Status: Needs Improvement

Impact:
  Playbook 1: 100% (4/4 exercises)
  Playbook 2: 50% (2/4 phases detected)
  Playbook 3: 75% (3/4 phases detected)
  Average: 75%
  Status: Good, room for improvement
```

### Time to detection

Definition: Duration between attack action and blue team detection

Importance: Faster detection enables faster response and containment

Measurement Points:
1. Technical Detection: Time from attack action to alert generation
2. Analyst Detection: Time from alert generation to analyst awareness
3. Investigation Start: Time from analyst awareness to investigation initiation
4. Verification: Time from investigation start to threat confirmation

Example Timeline:

```
09:16:00 - Red Team Action: Login from Tor exit node
09:16:23 - Technical Detection: Alert generated (+23 seconds)
09:17:45 - Analyst Detection: Analyst opens alert (+1m 45s total)
09:18:12 - Investigation Start: Analyst begins investigation (+2m 12s total)
09:19:30 - Verification: Threat confirmed as suspicious (+3m 30s total)

Total Time to Detection: 3 minutes 30 seconds
```

### Time to detection metrics

Mean Time to Detect (MTTD):
```
MTTD = Σ(Time to Detection) / Number of Detections
```

Example Calculation:

```
Exercise: Playbook 2 (2026-01-15)

Phase 1 (Initial Access): 67 seconds
Phase 2 (Defence Evasion): 145 seconds
Phase 3 (Impact - ROA Pub): 45 seconds
Phase 4 (Impact - Validator): Not Detected

MTTD = (67 + 145 + 45) / 3 = 85.7 seconds
MTTD = 1 minute 26 seconds
```

### Detection time distribution

```python
import numpy as np
import matplotlib.pyplot as plt

# Detection times from multiple exercises (seconds)
detection_times = {
    'Initial Access': [67, 45, 52, 71, 39, 88],
    'Defence Evasion': [145, 178, 132, 201, 156, 142],
    'Impact': [45, 62, 51, 48, 73, 55]
}

fig, ax = plt.subplots()
ax.boxplot(detection_times.values())
ax.set_xticklabels(detection_times.keys())
ax.set_ylabel('Time to Detection (seconds)')
ax.set_title('Detection Time Distribution by Phase')
ax.axhline(y=60, color='g', linestyle='--', label='Target: 60s')
ax.axhline(y=120, color='orange', linestyle='--', label='Warning: 120s')
ax.axhline(y=180, color='r', linestyle='--', label='Critical: 180s')
plt.legend()
plt.tight_layout()
plt.savefig('detection_time_distribution.png')
```

### Time to detection goals

| Attack Phase    | Target MTTD | Warning Threshold | Critical Threshold |
|-----------------|-------------|-------------------|--------------------|
| Initial Access  | < 60s       | 120s              | 300s               |
| Defence Evasion | < 120s      | 300s              | 600s               |
| Impact          | < 30s       | 60s               | 180s               |
| Persistence     | < 180s      | 600s              | 1800s              |

### False positive analysis

False positives are the bane of SOC operations, rather like the Night Watch responding to every cat that knocks over a 
bin. Too many, and analysts develop alert fatigue; too few, and you might be missing real threats.

#### False positive rate

Definition: Percentage of alerts that are not actually malicious

Calculation:
```
FPR = (False Positives / Total Alerts) × 100%
```

Example:
```
Exercise Period: 2026-01-15 to 2026-01-22
Total Alerts: 247

True Positives (Real Threats): 12
  - Exercise-related: 8
  - Production threats: 4

False Positives (Benign Activity): 235
  - Legitimate ROA updates: 180
  - Scheduled maintenance: 32
  - Configuration changes: 23

FPR = (235 / 247) × 100% = 95.1%

Status: CRITICAL - Excessive false positives causing analyst fatigue
```

#### False positive categories

1. Noisy detection rules

```yaml
Alert: ROA maxLength Change Detected
Issue: Alerts on ANY maxLength change, including legitimate updates
False Positives: 180 in one week
Impact: High - Drowning out real threats

Remediation:
  - Add whitelist for known legitimate sources
  - Implement threshold (only alert if maxLength increases beyond /24)
  - Require additional suspicious indicators before alerting
```

2. Insufficient context

```yaml
Alert: BGP Announcement from New ASN
Issue: Alerts on legitimate new peering relationships
False Positives: 45 in one week
Impact: Medium - Time wasted investigating normal business

Remediation:
  - Enrich alert with ASN reputation data
  - Cross-reference with change management tickets
  - Implement learning period for new peerings
```

3. Over-sensitive thresholds

```yaml
Alert: Geographic Authentication Anomaly
Issue: Triggers on ANY foreign login, including legitimate travel
False Positives: 32 in one week
Impact: Medium - Alerts lack actionable intelligence

Remediation:
  - Adjust threshold to trigger only on high-risk countries
  - Implement impossible travel logic (human can't travel 5000km in 2 hours)
  - Add context: VPN usage, previous travel patterns
```

### Precision and recall

Precision: Of all alerts generated, how many were real threats?

```
Precision = True Positives / (True Positives + False Positives)
```

Recall: Of all actual threats, how many did we detect?

```
Recall = True Positives / (True Positives + False Negatives)
```

F1 Score: Harmonic mean of precision and recall

```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

Example:

```yaml
Exercise Results:
  True Positives: 12 (threats detected and alerted)
  False Positives: 235 (benign activity alerted)
  False Negatives: 3 (threats missed)

Precision = 12 / (12 + 235) = 0.0486 = 4.86%
Recall = 12 / (12 + 3) = 0.800 = 80.0%
F1 Score = 2 × (0.0486 × 0.800) / (0.0486 + 0.800) = 0.092 = 9.2%

Analysis:
  - Good recall (catching 80% of threats)
  - Poor precision (95% false positive rate)
  - Low F1 score indicates imbalanced performance
  - Priority: Reduce false positives without harming recall
```

### False positive reduction workflow

```
+---------------------------+
| Exercise generates alerts |
+-------------+-------------+
              |
              v
+---------------------------+
| Classify alerts           |
+-------------+-------------+
              |
              v
        +-------------------+
        | True or false     |
        | positive?         |
        +----+---------+---+
             |         |
     True    |         | False
 positive    |         | positive
             |         |
             v         v
+-------------------+   +----------------------+
| Document          |   | Categorise FP type   |
| detection success |   +----------+-----------+
+-------------------+              |
                                   v
                         +----------------------+
                         | Analyse root cause   |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         | Implement tuning     |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         | Validate in next     |
                         | exercise             |
                         +----------+-----------+
                                    |
                                    v
                            +---------------+
                            | FP reduced?   |
                            +----+-----+----+
                                 |     |
                               Yes     No
                                 |     |
                                 v     v
                   +------------------+  |
                   | Document         |  |
                   | solution         |  |
                   +------------------+  |
                                          |
                                          v
                               +----------------------+
                               | Investigate further  |
                               +----------+-----------+
                                          |
                                          +---- back to
                                               Analyse
                                               root cause
```

### Alert quality scoring

Not all true positives are equally useful. Score alert quality:

```
Alert Quality Dimensions:

1. Timeliness (0-25 points)
   25: < 30 seconds
   20: 30-60 seconds
   15: 60-120 seconds
   10: 120-300 seconds
   5: 300-600 seconds
   0: > 600 seconds

2. Context (0-25 points)
   25: Complete context (who, what, when, where, why)
   20: Most context (missing one element)
   15: Basic context (missing two elements)
   10: Minimal context (only what and when)
   5: Insufficient context
   0: No context

3. Actionability (0-25 points)
   25: Clear recommended actions included
   20: Suggested actions with some ambiguity
   15: Generic recommendations
   10: No recommendations but threat clear
   5: Unclear what action to take
   0: Alert provides no actionable information

4. Accuracy (0-25 points)
   25: Perfect accuracy, no false information
   20: Minor inaccuracies (e.g., wrong severity level)
   15: Some inaccurate context
   10: Significant inaccuracies
   5: Mostly inaccurate information
   0: Completely incorrect

Total Quality Score: 0-100 points
```

Example scoring:

```
Alert: "Suspicious ROA Creation Request Detected"
Timestamp: 09:21:45 (145 seconds after action)
Content: |
  Account 'admin@victim-network.net' submitted ROA creation request:
  - Prefix: 203.0.113.0/24
  - Origin ASN: AS64513
  - maxLength: /25
  
  Context:
  - Same account logged in from Tor exit node 185.220.101.45 at 09:16:23
  - Account flagged as suspicious in incident IT-2026-0142
  - Prefix ownership: AS65001 (MISMATCH with requested AS64513)
  - maxLength /25 permits sub-prefix hijacking
  
  Recommended Actions:
  1. Block ROA submission pending investigation
  2. Contact prefix owner for verification
  3. Escalate to Network Security team
  4. Monitor for subsequent hijack attempts

Scoring:
  Timeliness: 15/25 (145 seconds = 2m 25s)
  Context: 25/25 (Complete: who, what, when, where, why)
  Actionability: 25/25 (Clear, specific, prioritised actions)
  Accuracy: 25/25 (All information correct)
  
Total Quality Score: 90/100 (Excellent)
```

### Continuous metrics dashboard

Create a real-time dashboard tracking key metrics:

```
Detection Effectiveness Dashboard

Detection Rate:
  Current Month: 78%
  Last Month: 65%
  Trend: ↑ Improving
  Target: 80%
  Status: Near Target

Mean Time to Detect:
  Current: 92 seconds
  Last Month: 147 seconds
  Trend: ↓ Improving
  Target: < 60 seconds
  Status: Needs Improvement

False Positive Rate:
  Current: 87%
  Last Month: 95%
  Trend: ↓ Improving
  Target: < 20%
  Status: Critical

Alert Quality Score:
  Average: 72/100
  Last Month: 65/100
  Trend: ↑ Improving
  Target: > 80
  Status: Good

Exercises Completed:
  This Month: 4
  Total YTD: 24
  Scenarios Tested: Playbook 1 (8x), Playbook 2 (12x), Playbook 3 (4x)
```

## Conclusion

Collaborative testing transforms abstract threat models into concrete improvements. Like the endless training 
exercises at the Assassins' Guild (where students learn both to kill and to avoid being killed), our exercises build 
capability through practical adversarial collaboration.

The key principles:

1. Structured scenarios: Red team follows detailed blueprints derived from simulator scenarios
2. Realistic detection: Blue team validates capabilities under realistic conditions
3. Measured improvement: Metrics track progress over time
4. Continuous feedback: Every exercise reveals gaps and drives improvements
5. Maturity progression: Advance from announced exercises to blind testing as capabilities mature

As Commander Vimes would observe, "Training isn't about being better than the enemy. It's about being better than 
you were yesterday." Each exercise, each metric, each improvement cycle makes the defence more resilient.

The best defence is one that's been tested by a competent adversary. Though in Ankh-Morpork, it's usually wise to 
ensure the adversary knows it's just an exercise before things get out of hand.
