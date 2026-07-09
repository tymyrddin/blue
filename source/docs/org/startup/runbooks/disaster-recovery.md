# Multi-region failover procedure

Runbook for executing a failover from Helsinki to Nuremberg. Follow this runbook when the [DR scenario triage playbook](../playbooks/dr-scenario-triage.md) has determined that a full multi-region failover is required (Scenario 2 with Helsinki unrecoverable, or Scenario 3: complete Helsinki loss).

Declare a DR event by notifying Adora Belle, Carrot, Ponder, and Cheery. One person (Cheery, or Carrot if Cheery is unavailable) takes the incident commander role and coordinates the response.

Start the timer. The 4-hour RTO begins from this declaration.

## Step 1: Assess and prioritise (0-30 minutes)

Determine which services are affected and which can be temporarily suspended. The priority order for restoration is:

1. Vault (all other services depend on it for secrets)
2. Keycloak (authentication for all customer portals)
3. Customer portals (direct customer impact)
4. Graylog and monitoring (needed for visibility, but not customer-facing)
5. Internal tooling (Vaultwarden, Teleport, etc.)

Do not attempt to restore everything simultaneously. Restore in priority order.

## Step 2: Provision Vault in Nuremberg (30-90 minutes)

Provision three new Hetzner CX31 instances in the Nuremberg region (`nbg1`). The instance types, OS, and network configuration mirror Helsinki.

Install Vault following the HA deployment runbook. Retrieve the backup password from the Bank of Ankh-Morpork vault (the physical one; Vault the software is not yet running). Restore the most recent Raft snapshot from the Nuremberg Storage Box:

```
vault operator raft snapshot restore vault_<date>.snap
```

Unseal the cluster manually using the unseal keys held by Adora Belle, Carrot, and Ponder (three of five keys are required).

Verify Vault is operational: `vault status` should show `Sealed: false`.

## Step 3: Provision core infrastructure in Nuremberg (90-180 minutes)

With Vault running, provision:

- PostgreSQL database server
- Keycloak instance
- Restore databases from the Nuremberg Storage Box

Database restoration uses the pg_dump exports archived in Restic. For PostgreSQL and Keycloak, follow the database restore procedure in the restore procedures runbook, using the Nuremberg Storage Box as the source.

Update DNS records to point `auth.golemtrust.am`, `vault.golemtrust.am`, and customer portal domains to Nuremberg IPs. DNS TTLs are set to 300 seconds (5 minutes) on all Golem Trust domains specifically to allow rapid failover. Confirm TTLs are correctly set during normal operations; a 24-hour TTL during a DR event means customers are not redirected for 24 hours.

## Step 4: Restore customer portals (180-240 minutes)

Restore the application servers for each customer portal in priority order (Seamstresses' Guild first, as the longest-standing customer).

Verify each portal is accessible from outside the private network before declaring it restored.

## Step 5: Validate and communicate

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
Last updated: 28 March 2026
