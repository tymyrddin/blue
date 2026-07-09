# Backup

Backup is the control that determines whether a server can be recovered after prevention and detection fail. An untested backup is an unknown quantity.

## Coverage and limits

A backup that restores files does not restore the security controls that were compromised in the incident. Restoring from a backup made after a compromise reproduces the compromise. Backup is most useful combined with a clean rebuild: provision a fresh server, apply configuration, restore data from backup.

Configuration under version control handles the configuration side. A server whose configuration is managed in git can be reproduced from the repository; the backup covers the data that the repository does not.

## The 3-2-1 principle

Three copies, on two different media, with one off-site. The off-site copy is the one that carries the weight: a backup on an attached volume gets encrypted in a ransomware incident alongside the original. A backup in the same cloud account can be deleted by an attacker who has those credentials.

For a small organisation without enterprise backup infrastructure: the live data, a copy on a backup server in a different region or cloud account, and a copy on a storage service with different credentials from the primary infrastructure. Two copies in the same account under the same credentials is not three separate copies.

## Backup targets

Data. Database dumps, user uploads, email stores, application state.

Configuration. Ideally already in version control. If not, a backup of `/etc` and application configuration directories covers it.

A credentials inventory. Not credentials themselves, but a documented list of what credentials exist and where they are used. This is what makes it possible to rotate everything systematically after a compromise. It is frequently not backed up because it is not thought of as a file.

## Testing

A backup that has never been restored is a backup that may not work when it is needed. Testing means restoring to a separate environment and verifying the restored system is functional.

How often depends on how often the data changes and how much loss is acceptable. Monthly test restores for critical data are a reasonable baseline. The test is worth running after any significant change to the backup configuration.

## Recovery time

The question worth answering before an incident: if this server needed to be rebuilt from scratch, how long would it take?

Running through the rebuild process once, even partially, surfaces dependencies and gaps that are not visible until they are needed. A rebuild completed in hours is a different situation from one that takes days. The difference often comes down to whether the configuration is reproducible from version control and whether the restore process has been practised.
