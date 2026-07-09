# Disaster recovery triage

Playbook for classifying a DR event and choosing the correct response. Use this when the situation exceeds what a normal restore can address: multiple simultaneous failures, extended regional unavailability, or any event where the path forward is not immediately obvious.

Once you have classified the scenario below, follow the linked runbook for the procedure.

## Recovery objectives

These targets are the minimum acceptable performance during a DR event.

| Metric | Target | Basis |
|---|---|---|
| Recovery Time Objective (RTO) | 4 hours | Time from declaring a DR event to restoring customer-facing services |
| Recovery Point Objective (RPO) | 24 hours | Maximum data loss acceptable; the daily backup cadence defines this |
| DR test success rate | 100% | Every quarterly test must succeed |

The 4-hour RTO reflects Golem Trust's SLA commitments to the Seamstresses' Guild and the Merchants' Guild. Outages exceeding four hours require customer notification under those contracts.

The 24-hour RPO reflects the daily backup schedule. If a customer contract requires higher data durability, the backup frequency must increase.

## DR scenarios

### Scenario 1: Single server failure

A single production server becomes unrecoverable (hardware failure, data corruption, accidental deletion).

Response: provision a replacement server in Helsinki, restore from Restic backup following the full server restore procedure (see the restore procedures runbook). Estimated time: 1-2 hours. This is within the RTO.

**This is not a DR event.** Do not invoke the multi-region failover procedure.

### Scenario 2: Multiple server failure in Helsinki

Two or more production servers fail simultaneously, or the Hetzner Helsinki datacenter experiences a significant outage.

Response: provision replacement servers in Helsinki if the datacenter is recoverable, or trigger the multi-region failover procedure if it is not.

**Decision point:** assess within 30 minutes whether Helsinki recovery is feasible.

- If Helsinki datacenter is recovering and replacement servers can be provisioned within the RTO window: stay in Helsinki and restore server by server.
- If Helsinki is unavailable indefinitely or recovery would breach the RTO: proceed to the multi-region failover procedure.

### Scenario 3: Complete Helsinki loss

The entire Helsinki region is unavailable indefinitely (fire, flood, sustained Hetzner outage, or similar).

Response: provision the complete infrastructure in Hetzner Nuremberg using the multi-region failover procedure. Declare a DR event and start the RTO timer.

**Proceed immediately to the [multi-region failover runbook](../runbooks/disaster-recovery.md).**

## Declaring a DR event

Notify Adora Belle, Carrot, Ponder, and Cheery. One person (Cheery, or Carrot if Cheery is unavailable) takes the incident commander role and coordinates the response.

Start the timer. The 4-hour RTO begins from this declaration.

For Scenario 2, use the 30-minute assessment window before declaring. For Scenario 3, declare immediately.
Last updated: 28 March 2026
