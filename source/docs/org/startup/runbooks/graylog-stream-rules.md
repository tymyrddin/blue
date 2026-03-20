# Stream rules

Runbook for configuring Graylog streams. A stream is a real-time categorisation of incoming log messages. Messages matching a stream's rules are routed to that stream. Streams form the basis for alerts, separate index sets, and access control. Angua designed the initial stream layout; she thinks of streams the way she thinks of patrol routes.

## Default stream behaviour

By default, all messages go to the `All messages` stream. Leaving everything in a single stream is fine for a small installation but makes alert rules harder to manage and allows a log spike from one system to obscure another. Separate streams allow alert thresholds and retention policies to be set per category.

Do not delete the `All messages` stream. It is used for ad-hoc searches and as a fallback.

## Creating streams

Navigate to Streams in the top navigation bar and click Create Stream.

### Web access

Title: `Web access`
Description: Nginx and application HTTP access logs

Rules (match any):
- Field `source_system` matches exactly `nginx`
- Field `source_system` matches exactly `keycloak`

Remove from `All messages`: no (keep messages in both streams)

### Authentication events

Title: `Authentication events`
Description: Login attempts, failures, token issuance across all systems

Rules (match any):
- Field `source_system` matches exactly `keycloak`
- Field `log_type` matches exactly `auth`
- Field `message` contains `authentication failure`
- Field `message` contains `invalid credentials`

### Database

Title: `Database`
Description: PostgreSQL logs

Rules (match any):
- Field `source_system` matches exactly `postgresql`

### Security events

Title: `Security events`
Description: High-priority events requiring review; feeds the primary alert channel

Rules (match any):
- Field `level` is less than or equal to `3` (syslog severity: error and above)
- Field `source_system` matches exactly `fail2ban`
- Field `message` contains `POSSIBLE BREAK-IN ATTEMPT`
- Field `message` contains `Invalid user`

### Customer portals

Title: `Customer portals`
Description: All events from customer-facing application servers

Rules (match any):
- Field `source_system` matches exactly `seamstresses-portal`
- Field `source_system` matches exactly `mrs-cake-portal`

Add new portal source systems here as customers are onboarded.

## Starting streams

After creating each stream, it will be paused by default. Click Start Stream next to each one. Messages will begin routing immediately; previously ingested messages are not retroactively routed.

## Index sets per stream

Assigning a stream to a dedicated index set allows different retention periods. The `Customer portals` stream should have a longer retention than the `Web access` stream; customer portal events may be needed for compliance review.

Navigate to System, then Indices, and create an index set for customer portals:

- Title: `Customer portal logs`
- Index prefix: `customer-portals`
- Index shards: 3
- Index replicas: 1
- Rotation: size-based, 10GB
- Retention: keep 52 indices (approximately one year at current volume)

Assign this index set to the `Customer portals` stream by editing the stream and selecting it from the Index Set dropdown.

The default index set retention (20 indices, approximately 200GB) applies to all other streams. Review these limits if log volume grows.

## Verifying stream routing

Navigate to Search and set the time range to the last 15 minutes. Switch to the stream view by selecting a stream from the left panel. Messages routed to that stream should appear. If a stream shows zero messages when it should have traffic, check the rules and confirm that the expected fields exist on arriving messages. Use the `All messages` stream to find a recent relevant message and inspect its fields.

If a field used in a rule is absent from incoming messages, the rule will never match. Check the extractor configuration (see the input setup runbook) and the shipping configuration on the source server.
