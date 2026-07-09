# Bug bounty environment setup

Adora Belle's announcement that Golem Trust would pay researchers to break into its systems required a place for them to break into that was not the actual production systems. The bug bounty environment is a fully isolated replica of production, running on a dedicated Hetzner project with no route to any production infrastructure. Researchers test against realistic systems, realistic API surfaces, and realistic application behaviour, but every record they touch is synthetic. The environment resets weekly. This runbook covers provisioning the environment, the synthetic data generation, the DNS configuration, the network isolation requirements, the separate monitoring stack, and the automated daily health check.

## Hetzner project isolation

The bug bounty environment runs in its own Hetzner Cloud project named `golemtrust-bugbounty`. It shares no networks, no load balancers, and no Floating IPs with the `golemtrust-production` or `golemtrust-staging` projects.

Verify isolation by confirming that no Private Network peering exists between `golemtrust-bugbounty` and any other project:

```
hcloud network list --output json | jq '.[].name'
```

The output for the `golemtrust-bugbounty` project should list only `bugbounty-internal`. No other project's network names should appear.

Firewall rules allow inbound HTTPS (443) and HTTP (80, for redirect only) from the public internet on the load balancer nodes. All other inbound traffic is blocked. Outbound traffic from the cluster nodes is restricted to the Hetzner internal network and to specific external addresses required for application function (payment gateway test endpoints, DNS resolution). There is explicitly no outbound route to any `golems.internal` private network address.

## Kubernetes cluster configuration

The bug bounty cluster is provisioned with the same node types, Kubernetes version, and configuration as production. It uses the same Helm chart versions for all application workloads. The only deliberate differences are:

- All external integrations point to sandbox or test accounts (Royal Bank test gateway, Assassins' Guild test API)
- Database connection strings point to the bug bounty PostgreSQL instance
- Email delivery is disabled; all outbound email is captured by a Mailhog instance
- Secrets are separate; no production credentials are present

The cluster is defined in `golem-trust/infrastructure/bugbounty/cluster.tf`. Changes to the cluster configuration require a PR reviewed by Carrot and Angua before applying.

## Synthetic data generation

All data in the bug bounty environment is synthetic. No real customer records, no real transaction data, no real employee information. The data generation job uses Faker and runs as part of the weekly reset.

A representative data generation script for the customer portal:

```
#!/usr/bin/env python3
import json
import uuid
from faker import Faker
import psycopg2

fake = Faker("en_GB")

conn = psycopg2.connect(
    host="bugbounty-db.golems.internal",
    database="golemtrust_bugbounty",
    user="data-generator",
    password=open("/run/secrets/db-password").read().strip()
)
cur = conn.cursor()

for _ in range(10000):
    customer_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO customers (id, name, email, address, created_at)
        VALUES (%s, %s, %s, %s, NOW())
        ON CONFLICT DO NOTHING
        """,
        (
            customer_id,
            fake.name(),
            fake.email(),
            fake.address(),
        )
    )

conn.commit()
cur.close()
conn.close()
print("Synthetic data generation complete.")
```

The full generation scripts live in `golem-trust/bugbounty/data-generator/`. They cover all database tables that contain customer-like records. After generation, an automated consistency check confirms that no real email domains (the domains belonging to actual Golem Trust customers) appear in the generated data.

## Weekly reset

The reset CronJob runs every Monday at 04:00 UTC. It:

1. Scales down all application deployments to zero replicas
2. Drops and recreates all application databases
3. Runs the synthetic data generation scripts
4. Scales application deployments back up
5. Runs the health check suite (see below)
6. Posts a confirmation to `#bugbounty-ops` Slack channel

```
apiVersion: batch/v1
kind: CronJob
metadata:
  name: bugbounty-weekly-reset
  namespace: bugbounty-ops
spec:
  schedule: "0 4 * * 1"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: bugbounty-reset-sa
          restartPolicy: OnFailure
          containers:
            - name: reset
              image: harbor.golems.internal/bugbounty/reset-job:latest
              command: ["/scripts/weekly-reset.sh"]
              envFrom:
                - secretRef:
                    name: bugbounty-reset-secrets
```

If the reset job fails, Angua receives a PagerDuty alert. A failed reset means the environment may contain stale data from the previous week; the environment should be taken out of scope on the HackerOne and Intigriti programme pages until the reset is confirmed complete.

## DNS configuration

Bug bounty endpoints are served under `*.bugbounty.golemtrust.am`. This subdomain is entirely separate from `*.golemtrust.am` production DNS. The wildcard record points to the bug bounty load balancer's public IP.

Active endpoints in scope:

```
app.bugbounty.golemtrust.am        → Customer portal
api.bugbounty.golemtrust.am        → REST API
admin.bugbounty.golemtrust.am      → Admin interface (intentionally in scope)
mobile-api.bugbounty.golemtrust.am → Mobile application backend
```

The scope document published on HackerOne and Intigriti lists these endpoints explicitly. Researchers testing against any `*.golemtrust.am` endpoint that is not in this list should be redirected by Angua to the appropriate contact.

## Separate monitoring

All events from the bug bounty environment flow to a separate Graylog instance: `graylog-bugbounty.golems.internal`. This instance is completely independent of the production Graylog cluster. Researcher activity, including vulnerability exploitation attempts, must not contaminate production security monitoring with false positive signals.

The bug bounty Graylog instance is configured with a shorter retention period (30 days) and is accessible to Angua and the security team. Log data from this instance is treated as research activity logs unless there is evidence of a researcher attempting to pivot to production infrastructure.

Falco also runs in the bug bounty cluster, reporting to the bug bounty Graylog instance. This provides visibility into unusual container behaviour during active research sessions.

## Daily health check

A daily CronJob at 07:00 UTC verifies that all in-scope endpoints are responding correctly. The health check script:

```
#!/bin/sh
set -e

ENDPOINTS="
  https://app.bugbounty.golemtrust.am/health
  https://api.bugbounty.golemtrust.am/health
  https://admin.bugbounty.golemtrust.am/health
  https://mobile-api.bugbounty.golemtrust.am/health
"

FAILED=0
for endpoint in ${ENDPOINTS}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 ${endpoint})
  if [ "${STATUS}" != "200" ]; then
    echo "FAIL: ${endpoint} returned ${STATUS}"
    FAILED=$((FAILED + 1))
  else
    echo "OK: ${endpoint}"
  fi
done

if [ ${FAILED} -gt 0 ]; then
  exit 1
fi
```

If the health check fails, Angua is notified. Researcher reports of unreachable endpoints are checked against recent health check results before being triaged as potential findings.
