# Disaster recovery planning

Runbook for multi-region failover and disaster recovery procedures. This covers scenarios that exceed what a normal restore can address: complete loss of the Helsinki region, simultaneous failure of multiple systems, or scenarios where the primary infrastructure cannot be recovered within an acceptable timeframe. Cheery's risk register classifies these as low probability but high impact. That classification is why this runbook exists.

## Recovery objectives

Cheery established these targets after the backup discussion with Ponder. They are not aspirational; they are the minimum acceptable performance during a DR event.

| Metric | Target | Basis |
|---|---|---|
| Recovery Time Objective (RTO) | 4 hours | Time from declaring a DR event to restoring customer-facing services |
| Recovery Point Objective (RPO) | 24 hours | Maximum data loss acceptable; the daily backup cadence defines this |
| DR test success rate | 100% | Every quarterly test must succeed |

The 4-hour RTO was chosen because Golem Trust's SLAs commit to notifying customers of outages within one hour and restoring services within four. An outage lasting longer than four hours requires customer communication under the contracts with the Seamstresses' Guild and the Merchants' Guild.

The 24-hour RPO reflects the daily backup schedule. If higher data durability is required by a customer contract, the backup frequency must increase.

## DR scenarios

### Scenario 1: Single server failure

A single production server becomes unrecoverable (hardware failure, data corruption, accidental deletion).

Response: provision a replacement server in Helsinki, restore from Restic backup following the full server restore procedure (see the restore procedures runbook). Estimated time: 1-2 hours. This is within the RTO.

### Scenario 2: Multiple server failure in Helsinki

Two or more production servers fail simultaneously, or the Hetzner Helsinki datacenter experiences a significant outage.

Response: provision replacement servers in Helsinki if the datacenter is recoverable, or trigger the multi-region failover procedure if it is not.

Assess within 30 minutes whether Helsinki recovery is feasible. If not, proceed to multi-region failover.

### Scenario 3: Complete Helsinki loss

The entire Helsinki region is unavailable indefinitely (the dragon scenario Ponder mentioned; also fire, flood, or a sustained Hetzner outage).

Response: provision the complete infrastructure in Hetzner Nuremberg using the DR restore procedures. This is the full DR exercise covered by the Q4 quarterly test.

## Multi-region failover procedure

Declare a DR event by notifying Adora Belle, Carrot, Ponder, and Cheery. One person (Cheery, or Carrot if Cheery is unavailable) takes the incident commander role and coordinates the response.

Start the timer. The 4-hour RTO begins from this declaration.

### Step 1: Assess and prioritise (0-30 minutes)

Determine which services are affected and which can be temporarily suspended. The priority order for restoration is:

1. Vault (all other services depend on it for secrets)
2. Keycloak (authentication for all customer portals)
3. Customer portals (direct customer impact)
4. Graylog and monitoring (needed for visibility, but not customer-facing)
5. Internal tooling (Vaultwarden, Teleport, etc.)

Do not attempt to restore everything simultaneously. Restore in priority order.

### Step 2: Provision Vault in Nuremberg (30-90 minutes)

Provision three new Hetzner CX31 instances in the Nuremberg region (`nbg1`). The instance types, OS, and network configuration mirror Helsinki.

Install Vault following the HA deployment runbook. Retrieve the backup password from the Bank of Ankh-Morpork vault (the physical one; Vault the software is not yet running). Restore the most recent Raft snapshot from the Nuremberg Storage Box:

```
vault operator raft snapshot restore vault_<date>.snap
```

Unseal the cluster manually using the unseal keys held by Adora Belle, Carrot, and Ponder (three of five keys are required).

Verify Vault is operational: `vault status` should show `Sealed: false`.

### Step 3: Provision core infrastructure in Nuremberg (90-180 minutes)

With Vault running, provision:

- PostgreSQL database server
- Keycloak instance
- Restore databases from the Nuremberg Storage Box

Database restoration uses the pg_dump exports archived in Restic. For PostgreSQL and Keycloak, follow the database restore procedure in the restore procedures runbook, using the Nuremberg Storage Box as the source.

Update DNS records to point `auth.golemtrust.am`, `vault.golemtrust.am`, and customer portal domains to Nuremberg IPs. DNS TTLs are set to 300 seconds (5 minutes) on all Golem Trust domains specifically to allow rapid failover. Confirm TTLs are correctly set during normal operations; a 24-hour TTL during a DR event means customers are not redirected for 24 hours.

### Step 4: Restore customer portals (180-240 minutes)

Restore the application servers for each customer portal in priority order (Seamstresses' Guild first, as the longest-standing customer).

Verify each portal is accessible from outside the private network before declaring it restored.

### Step 5: Validate and communicate

Before declaring the DR event closed:

- Run the automated verify-all script from the staging environment (see below)
- Confirm all customer portals respond correctly
- Confirm authentication works for at least two test accounts
- Confirm Graylog is receiving logs from the restored infrastructure
- Send customer notifications if the outage exceeded the SLA notification threshold

## Verify-all script

Create `/opt/backup/dr-verify.sh` to run a quick sanity check on all critical endpoints:

```
#!/bin/bash
set -euo pipefail

FAILURES=0

check() {
  local NAME=$1
  local URL=$2
  local HTTP_CODE

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "PASS: $NAME ($HTTP_CODE)"
  else
    echo "FAIL: $NAME (HTTP $HTTP_CODE)"
    FAILURES=$((FAILURES + 1))
  fi
}

check "Keycloak OIDC" "https://auth.golemtrust.am/realms/golemtrust-internal/.well-known/openid-configuration"
check "Vault health" "https://vault.golemtrust.am/v1/sys/health"
check "Vaultwarden" "https://vault.golemtrust.am/alive"
check "Graylog" "https://graylog.golemtrust.am/api/system/lbstatus"
check "Seamstresses portal" "https://portal.seamstresses.am/health"
check "Merchants portal" "https://portal.merchants.am/health"

if [ $FAILURES -gt 0 ]; then
  echo "$FAILURES check(s) failed."
  exit 1
else
  echo "All checks passed."
fi
```

Run this script at the end of the DR procedure and after each major restoration step. A passing result means the infrastructure is functional from an external perspective.

## Post-DR review

After any DR event (real or test), hold a review within five business days. Cheery chairs it. The review covers:

- What caused the event
- How well the RTO and RPO were met
- What went smoothly and what did not
- Any changes to DR procedures, infrastructure, or documentation

The review output is a written report in the internal wiki. Adora Belle reads every DR report. If the RTO was not met, she will ask why and what is being done about it. Have an answer ready.
