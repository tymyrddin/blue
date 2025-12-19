# Trade-offs of our system

## Sensitivity vs specificity

High sensitivity (catches everything) → Many false positives 

High specificity (only true positives) → Miss subtle attacks

Our approach: 

- Start specific (fewer alerts, higher quality)
- Tune towards sensitivity over time as baselines improve.

## Real-time vs batch

Real-time processing: Immediate alerts, higher resource cost  

Batch processing: Delayed alerts, cheaper, better for forensics

Our approach: 

- Real-time for critical signals
- Batch for trend analysis.

## Centralized vs distributed

Centralized SIEM: Single pane of glass, single point of failure  

Distributed: Resilient, harder to correlate

Our approach: 

- Centralized Wazuh for primary detection
- Out-of-band backup for validation.

## Automation vs human-in-loop

Full automation: Fast response, risk of false-positive damage  

Human approval: Slower, but safer

Our approach:

- Automate alerting and evidence collection
- Require human approval for defensive actions (announcements, filtering)
- Exception: Automated blackholing for confirmed DDoS
