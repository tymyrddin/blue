# Trade-offs in the detection system

Every choice below buys one thing by giving up another. None of them has a free side.

## Sensitivity vs specificity

High sensitivity (catches everything) brings a flood of false positives.

High specificity (only true positives) misses subtle attacks.

Where the system sits:

- Start specific, fewer alerts, higher quality
- Drift towards sensitivity over time, as baselines improve

## Real-time vs batch

Real-time processing gives immediate alerts, at a higher resource cost.

Batch processing gives delayed alerts, cheaper, and reads better for forensics.

Where the system sits:

- Real-time for critical signals
- Batch for trend analysis

## Centralised vs distributed

A centralised SIEM is a single pane of glass, and a single point of failure.

Distributed is resilient, and harder to correlate.

Where the system sits:

- Centralised Wazuh for primary detection
- An out-of-band backup for validation

## Automation vs human-in-loop

Full automation is fast, and carries the risk of false-positive damage.

Human approval is slower, and safer.

Where the system sits:

- Automate alerting and evidence collection
- Keep a human in the loop for defensive actions (announcements, filtering)
- The one exception: automated blackholing for a confirmed DDoS
