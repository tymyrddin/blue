# Database access workflows

Runbook for requesting, approving, and using database access through StrongDM. Every connection to a Royal Bank database goes through this workflow. Applications use it. Developers use it. DBAs use it. There is no other path to the database. Mr. Bent asked Carrot how this was enforced. Carrot showed him the ACL policy. Mr. Bent made a note in his portfolio.

## Access request workflow

### For applications

Applications do not go through the approval workflow. They are pre-approved service accounts with narrow permissions and short-lived credentials from Vault. An application's StrongDM access is configured once by Ponder, tied to a specific database and schema, and does not require human approval on each connection.

Applications connect to StrongDM's local proxy port. StrongDM records the session. Credentials are rotated by Vault after each session (default TTL: 4 hours, see the StrongDM deployment runbook).

Application credentials are never visible to application developers. The application receives a connection string from Vault that points to the StrongDM proxy; the StrongDM proxy handles authentication to the actual database.

### For human users (developers, DBAs, analysts)

Human access requires approval for each session. The access request workflow:

1. The user submits an access request in the StrongDM web interface or CLI
2. The request includes: the database resource, the intended purpose, and the estimated duration
3. The request is routed to two approvers: the user's manager and Carrot (or designated security reviewer)
4. Both approvals are required before access is granted
5. Access is valid for 4 hours by default, maximum 8 hours
6. On expiry, the session ends and credentials are rotated

Submit a request via the CLI:

```
sdm access request \
  --resource "Royal Bank Production DB" \
  --duration 2h \
  --reason "Investigating query performance issue, incident #83"
```

A reason is mandatory. One-word reasons are rejected at the approval stage. "Investigation" is not a reason. "Investigating slow query on transactions table, referenced in incident #83" is a reason.

### Approving a request

Approvers receive a notification via Slack (`#db-access-approvals`) and email. To approve via CLI:

```
sdm access approve <request-id>
```

To deny:

```
sdm access deny <request-id> --reason "No active incident. Please raise one first."
```

The dual-approval requirement means both approvers must act. If the manager approves and Carrot denies, access is not granted. If the first approver acts but the second does not respond within 30 minutes, Slack escalation fires. If neither has responded within 60 minutes and the request is marked urgent, Adora Belle receives a direct notification.

## Connecting to a database

Once a request is approved, the user connects via the StrongDM CLI:

```
sdm connect "Royal Bank Production DB"
```

StrongDM opens a local proxy port and outputs the connection details:

```
Connected to Royal Bank Production DB
  Local address: 127.0.0.1:15432
  Session ID: <uuid>
  Expires: 2026-03-20 14:47:00 UTC
```

The user then connects using any standard PostgreSQL client:

```
psql -h 127.0.0.1 -p 15432 -U <username> -d royalbank
```

StrongDM intercepts the connection, authenticates to the actual database using the Vault-issued credential, and proxies the session while recording every query. The user does not see the actual database credentials.

When the session expires, the connection is closed. The user must request access again for a new session.

## What is recorded

StrongDM records:

- The full query text for every statement executed
- The user who executed it, their authentication method, and which approvers approved the session
- The response row counts (not the response data itself, which may contain sensitive customer information)
- Session start and end times
- The client IP address

Query content is stored in the Hetzner Object Storage audit bucket with a 7-year retention lock. The query log is viewable in the StrongDM admin console by users with the `auditor` role (Carrot, Adora Belle, Cheery).

Response data is not recorded. StrongDM passes the result rows directly to the client without logging them. If a query result needs to be preserved for an investigation, the analyst records it separately and logs that they have done so.

## Emergency access

If the StrongDM approval workflow is unavailable during an active incident (StrongDM gateway down, no approvers reachable), the emergency database access procedure applies:

1. Contact Carrot or Ponder by mobile. Their numbers are in Vaultwarden, collection: Emergency Contacts.
2. One of them retrieves the emergency PostgreSQL credentials from the Bank of Ankh-Morpork vault envelope.
3. The connection is made directly, bypassing StrongDM, to the specific database required.
4. Every command executed is logged manually in a text file and committed to the incident record immediately after the session ends.
5. The emergency credentials are rotated as soon as the incident is resolved.
6. A post-incident review is mandatory. Bypassing StrongDM is an exceptional event that requires a written explanation acceptable to Mr. Bent.

Emergency access bypasses audit logging at the StrongDM layer. The manual log is the substitute record. Mr. Bent has been informed of this procedure and has accepted it, with the condition that the manual log is countersigned by two people.

## Quarterly access review

Every quarter, Carrot runs an access review for all human StrongDM accounts. The review covers:

- Which accounts exist and whether they are still needed
- Access frequency: accounts that have not been used in 90 days are suspended
- Reason quality: a sample of access reasons is reviewed to confirm they reference actual incidents or work items
- Session duration: sessions that ran to the maximum allowed duration repeatedly may indicate the default TTL is too short for that user's work pattern, or that a user is not scoping their work appropriately

The review output is a written report shared with Adora Belle. Any accounts suspended or removed are documented with the reason.
Last updated: 20 March 2026
