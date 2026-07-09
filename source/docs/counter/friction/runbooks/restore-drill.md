# Running a restore exercise

Proves that a backup can actually be recovered from, against the clock, before the day it is the only
option. Pairs with [backups are cheap, restores are not](../backup-restore-testing.md).

## Pick a system whose loss would hurt

- An identity store, a production database, a critical file share. A drill against the easy system proves the easy system.
- Decide the success criteria before starting: recovered to which point in time, within how long, with
  what verified intact. A restore that returns data nobody has checked is not a proven restore.

## Restore to isolation

- Restore into an isolated environment, never over the live system
- Restore from the off-site or object-locked copy you would actually use in an incident, not the fast local one
- Time it: start the clock at "decision to restore", stop it at "verified usable"

## Verify, do not assume

- row counts / file counts against a known baseline
- application starts and a transaction completes end to end
- dependencies were in scope (the database without its keys is not a recovery)
- the most recent data is present (catch the job that has been silently skipping
  a table or a share for months)

## Record what broke

- Note the gap between the measured restore time and the recovery-time objective the business
  believes it has. That gap is the finding.
- Log any silent failure the drill surfaced: the skipped source, the week-long archive, the missing
  dependency. Each was invisible in the green backup report and decisive in the recovery.

## Make it standing and adversarial

- Schedule the drill; an untested backup decays back to unknown.
- Test the isolated, write-once, or offline copy specifically, because that is the one that has to
  survive an attacker who reaches the live backups, and it is the harder one to restore from quickly.
Last updated: 10 July 2026
