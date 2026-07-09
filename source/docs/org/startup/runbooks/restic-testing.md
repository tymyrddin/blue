# Testing protocols

Runbook for quarterly restore testing. Cheery Littlebottom manages this personally. The first test restored the entire Merchants' Guild database to a separate system in 47 minutes. Subsequent tests aim to beat this time while also covering a wider range of scenarios. A test that produces the same result each time is not really testing; it is rehearsing.

## Testing schedule

Tests run on the first Monday of January, April, July, and October. Cheery schedules them six weeks in advance and sends calendar invitations to Ponder and Dr. Crucible, who are required to be available for the duration.

Each quarterly test covers a different scenario:

| Quarter | Scenario |
|---|---|
| Q1 (January) | Full database restore: restore a production database to a staging instance |
| Q2 (April) | Configuration restore: restore the Nginx and application configuration on a decommissioned server |
| Q3 (July) | Full server restore: provision a new instance and restore a complete server from backup |
| Q4 (October) | DR scenario: restore from the Nuremberg DR Storage Box as if the Helsinki site were unavailable |

The Q3 and Q4 tests are the most demanding and most important. Run simpler tests in Q1 and Q2 to maintain familiarity with the tooling; run the harder scenarios when the team's skills are fresher from the earlier tests.

## Pre-test checklist

Before starting any test:

- Confirm the Vault cluster is healthy and backup passwords are accessible
- Confirm the Storage Box is reachable from the test environment: `restic snapshots`
- Confirm that at least one snapshot from the previous week exists
- Provision the test environment (a staging Hetzner instance, billed to the DR test project)
- Notify the team that a restore test is in progress; no production changes should be made during the test window
- Start a timer

The timer is important. Cheery records the elapsed time for every test. This is the RTO measurement: how long does a recovery actually take? The first test was 47 minutes. The target is under 60 minutes for a database restore and under four hours for a full server restore.

## Database restore test (Q1)

Target: restore the `keycloak` database to the staging environment and verify that Keycloak can start against the restored data.

1. List available snapshots on `db.golemtrust.am` and select the most recent daily snapshot
2. On the staging database server, restore the pg_dump export from Restic
3. Decrypt the dump with the age private key (retrieved from the Bank of Ankh-Morpork vault for the test; return it afterwards)
4. Create a fresh database `keycloak_test` and restore into it
5. Point the staging Keycloak instance at `keycloak_test`
6. Start staging Keycloak and log in with a test admin account
7. Verify that realm configuration, users, and client settings are present and correct

Record:
- Snapshot ID used
- Snapshot age (how old is the data being restored?)
- Time from starting the restore to completing the Keycloak login
- Any errors encountered and how they were resolved

## Configuration restore test (Q2)

Target: restore Nginx and application configuration to a blank Debian 12 instance and verify that a web request is served correctly.

1. Provision a blank Debian 12 staging instance
2. Install Nginx and the application runtime (same versions as production)
3. Restore `/etc/nginx` and the application configuration directory from Restic
4. Start Nginx and the application
5. Make a test HTTP request and verify a 200 response

This test specifically validates that configuration is being backed up and that a server can be rebuilt from configuration backup alone, without needing the application data.

## Full server restore test (Q3)

Target: restore a complete server to a new Hetzner instance from Restic backup.

Choose a server for this test that can be reprovisioned without disrupting production. The `graylog-3` node (the tertiary Graylog node) is a good candidate; the Graylog cluster continues to operate with two nodes.

1. Provision a new CX31 instance in Helsinki with Debian 12
2. Install Restic
3. Restore the complete filesystem from the most recent weekly snapshot
4. Reboot and verify that all services start
5. Confirm that `graylog-3` re-joins the Graylog cluster
6. Confirm that logs are shipping to the restored node

This tests not just the data but the full service recovery, including the systemd units, configuration, and network integration.

## DR restore test (Q4)

Target: restore from the Nuremberg DR Storage Box as if Helsinki were completely unavailable.

1. Revoke SSH access from the test environment to the Helsinki Storage Box (edit `/etc/hosts` to make it unreachable, or temporarily remove the SSH key from the Storage Box authorised keys)
2. Configure Restic to use the Nuremberg Storage Box
3. Confirm that the Nuremberg repository contains the expected snapshots (`restic snapshots`)
4. Restore the `keycloak` database using the Nuremberg snapshot
5. Verify the restoration as per the Q1 test
6. Restore SSH access to Helsinki and confirm it still works

The DR test specifically measures how old the most recent snapshot in Nuremberg is. The DR sync runs weekly (Monday at 03:00); a Q4 test run on a Wednesday will use data that is at most two days old. Record the data age in the test report.

## Recording results

After each test, record the results in Vault:

```
vault kv put kv/golemtrust/backup-status/restore-test \
  last_test="$(date -Iseconds)" \
  result="passed" \
  scenario="Q1-database-restore" \
  host_tested="db.golemtrust.am" \
  time_to_restore_minutes="<elapsed>" \
  notes="<any issues or observations>"
```

Also record results in the internal wiki with a short narrative: what was tested, what happened, what was learned, and whether any changes to backup configuration or procedure are warranted.

If the test fails, record the failure reason. Do not mark a failed test as passed. A failed test is information: it tells you what is broken before a real incident forces you to find out. Cheery treats a failed test the same way she treats a found accounting error: it is preferable to finding it now, and the response is to fix the underlying problem, not the record.

## Lessons learned register

Maintain a lessons learned register in the wiki alongside the test results. Common findings from the first few tests and their resolutions:

The first test revealed that the age private key was not documented in the restore procedure. Added to the runbook.

The Q3 test revealed that the `teleport` agent configuration was not backed up because the token file was excluded by the backup script's exclusion patterns. Updated the exclusion list to include only the token file itself.

Each test should attempt to find at least one thing that can be improved. A test that finds nothing can be improved is probably not thorough enough.
Last updated: 10 July 2026
