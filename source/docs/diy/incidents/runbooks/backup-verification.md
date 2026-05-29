# Backup verification

## Cadence

Monthly for critical systems (databases, user data, configuration). After any significant change to the backup
configuration or infrastructure. Before a major system change where restore capability needs to be confirmed first.

## The untested backup problem

A backup that has never been restored is a backup of unknown quality. Corruption, incomplete coverage, and format
incompatibilities with the current software version are all discovered at restore time, which is the worst time to
discover them. The monthly test is cheap. The untested backup in a real incident is not.

## Confirming coverage

Before running the restore test:

1. List every system that holds data the organisation cannot lose: databases, user file uploads, application state,
   configuration, and secrets inventories.
2. Confirm backups are running on schedule. Check the backup provider's dashboard, the most recent backup timestamps, or
   backup job logs.
3. Confirm backups are stored in a location separate from the primary data: a different cloud account, a different
   region, or offline. A backup in the same account as the primary data can be deleted or encrypted by the same attacker
   who compromised the primary.

## Restore test

4. Select a non-production environment for the restore. Do not run restore tests against production systems.
5. Restore the most recent backup of the most critical system.
6. Verify the restored data is complete and usable:
    - For a database: spot-check records, confirm the application connects and responds, run a representative query
      against known data.
    - For file storage: confirm files are present and readable.
    - For configuration: confirm the service starts against the restored configuration without errors.
7. Note the time from backup selection to confirmed restore. This is the actual recovery time for a real incident. If it
   is unacceptably long, that is a finding.

## Recording the result

Document: date, system tested, backup age at time of restore, time taken, any issues encountered. File this alongside
the previous results to show a pattern of verified coverage over time.

## If the restore fails

A failed restore is a finding, not a reason to skip the test next month. Common causes:

- Backup job ran but produced an empty or corrupt archive: check the backup job configuration and logs.
- Format incompatibility: the backup was taken against an older software version. The restore process may require
  downgrading the software version, then upgrading.
- Missing dependencies: the backup covers the data but not the configuration or secrets needed to run it. Review backup
  coverage.
- Storage access issue: credentials used by the restore process have expired or been rotated. Update them.

Treat a failed restore as a production risk until it is resolved. The backup is not a backup until a restore succeeds.

## Follow-up

- Document failures and resolutions. A backup system that has had a failure and been fixed is more trustworthy than one
  that has never been tested.
- Schedule the next verification.

## Legal notes

Some data protection regulations require demonstrable ability to restore personal data within a defined timeframe.
Document verification results as evidence of ongoing capability.
