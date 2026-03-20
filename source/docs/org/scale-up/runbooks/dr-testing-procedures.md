# DR testing procedures

Runbook for conducting disaster recovery exercises. An untested DR plan is a hypothesis. The dragon attack exercise demonstrated that the system could fail over successfully; it also produced 17 documented lessons learned that improved the procedures. DR exercises run quarterly. Each exercise tests a different scenario. The results are documented and reviewed, and any gaps are addressed before the next exercise.

## Exercise schedule

Four exercises per year, rotating through scenarios:

Q1: Automated failover test. Simulate Helsinki unavailability from the Frankfurt monitor. Verify that the failover sequence executes correctly and that Nuremberg becomes active within the target window. Measure: time from simulated outage to DNS cutover, and time to full service availability in Nuremberg.

Q2: Database recovery test. Promote the Nuremberg replica manually and verify that applications connect to it successfully. Re-establish replication after the exercise. Measure: time to database promotion, data integrity check.

Q3: Component failure test. Take down one non-redundant component (for example, a single Vault node, a Keycloak instance, or a Kubernetes node) and verify that the cluster handles it gracefully without triggering a full failover. Measure: service availability during component failure, time to automatic recovery.

Q4: Full DR exercise. Simulate a complete Helsinki loss. Execute the full failover to Nuremberg manually (without relying on automation) and bring all services up in Nuremberg. Measure: total time from simulated loss to full service restoration, data loss assessment.

## Pre-exercise checklist

Before each exercise:

- Inform the Royal Bank of Ankh-Morpork liaison at least 48 hours in advance. The exercise causes a brief planned interruption and must not be mistaken for an actual incident.
- Confirm Nuremberg replication lag is below 1 second. Do not proceed if lag is elevated; fix replication first.
- Confirm Nuremberg Kubernetes workloads are deployed (scaled to zero) and images are cached in Nuremberg Harbor.
- Confirm the Frankfurt monitor is running and health checks are passing.
- Confirm Vault is unsealed in both regions.
- Assign roles: exercise lead (Carrot), database operator (Ponder), DNS operator (Ludmilla), observer (Cheery for documentation).
- Set DNS TTL to 60 seconds at least 24 hours before the exercise (to ensure cached TTLs have expired before the exercise begins).
- Create a shared document for real-time notes during the exercise.

## Conducting the automated failover test (Q1)

This test verifies that the monitor detects failure and executes the failover sequence without human intervention.

1. Announce start of exercise in `#incidents` and `#infra-alerts`.

2. Block Helsinki health check endpoints from the Frankfurt monitor using a Hetzner firewall rule on the Frankfurt instance (simulates Helsinki being unreachable from the monitor's perspective without taking Helsinki down):

```
hcloud firewall add-rule monitor-block-hel1 \
  --direction out \
  --destination-ips 95.216.x.x/32 \
  --protocol tcp \
  --port 443 \
  --action block
```

3. Start the clock. Record the exact time of the first simulated failure.

4. Watch the monitor logs: `journalctl -fu failover-monitor`

5. Record the time of each step in the failover sequence:
   - First health check failure detected
   - Third consecutive failure (failover trigger)
   - PagerDuty alert sent
   - PostgreSQL promotion completed
   - DNS records updated
   - Kubernetes workloads scaled up in Nuremberg
   - First successful health check via Nuremberg

6. Verify service functionality from an external location (not Frankfurt, which is blocked):

```
curl -sf https://api.golemtrust.am/health
curl -sf https://auth.golemtrust.am/health/live
```

7. Remove the firewall block to restore Helsinki connectivity:

```
hcloud firewall delete-rule monitor-block-hel1 --id <rule-id>
```

8. Do not initiate automatic failback. Proceed to the recovery procedure (see recovery procedures runbook) to manually restore Helsinki as primary.

## Metrics to capture

For every exercise, capture and record:

- T0: simulated outage begins
- T1: first alert sent to on-call
- T2: DNS records updated to Nuremberg
- T3: first successful external health check via Nuremberg (full service restoration)
- T3 - T0: total customer-facing downtime
- Replication lag at time of PostgreSQL promotion
- Any manual steps required that should have been automated
- Any automated steps that failed or required retry

Target metrics based on the dragon attack exercise:

- T1 - T0: under 3 minutes (alert within 3 minutes of outage)
- T3 - T0: under 15 minutes (full service restoration within 15 minutes)
- Data loss: under 5 minutes of writes (RPO)

## Lessons learned process

After each exercise, hold a 60-minute review within 48 hours. Cheery chairs the review and documents the output.

The review covers:
- Timeline reconstruction against the captured metrics
- What went to plan
- What did not go to plan
- Any manual intervention required that should have been automated
- Any unexpected dependencies discovered during the exercise

Findings are categorised as:
- Runbook gap: the procedure was wrong or incomplete
- Automation gap: a step was manual that should be automated
- Monitoring gap: something was not observed that should have been
- Training gap: the team was uncertain about a step

Each finding is assigned an owner and a resolution target date. Findings are tracked in the `ansible-playbooks` repository under `dr/lessons-learned.md`. All findings from an exercise must be resolved before the next exercise of the same type. Otto Chriek reviews the lessons learned register as part of the quarterly ISO 27001 review.
