# SSH host key warning

Triage runbook. Covers what to do when SSH refuses to connect with a host key warning. The warning can be routine or the only sign of an interception attempt, so the first task is telling those apart.

## Trigger

An SSH connection fails with `REMOTE HOST IDENTIFICATION HAS CHANGED` or `Host key verification failed`. The server's host key no longer matches the one cached in `~/.ssh/known_hosts`.

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
```

## First: is there an innocent explanation?

A changed host key has a few routine causes. Confirm whether one of these applies before clearing the warning:

- The server was rebuilt or reinstalled, which regenerates its host key.
- The server's SSH host key was deliberately rotated.
- The connection is to a LAN address that DHCP reassigned to a different machine.
- The connection goes through a jump host to several backends sharing one cached entry.

If none of these applies, treat the warning as a possible interception (a machine-in-the-middle presenting its own key) until proven otherwise.

## Risk

Clearing the warning and reconnecting without confirming the new key is genuine sends the login attempt, and any agent-forwarded credentials, to whatever host is answering. If the cause is interception, that is exactly the outcome the warning exists to prevent. Confirm the key out of band first.

## Confirming the key out of band

Obtain the server's real host key fingerprint through a channel other than the suspect SSH connection: the hosting provider's console, a configuration record, or a colleague already on a trusted session. On the server itself:

```
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Compare it to the fingerprint shown in the warning. A match confirms the key change is genuine. A mismatch means the connection is reaching something other than the intended server: stop, and do not reconnect over that path.

## Clearing a confirmed key change

Once the new key is confirmed genuine, remove the stale entry. The warning names the file and line:

```
ssh-keygen -R server-address
```

Reconnect. SSH prompts to accept the new key. Accept it, and the new key is cached.

## Done

The cause is identified. For a genuine change, the old key is removed and the new one accepted after out-of-band confirmation. For an unexplained mismatch, the connection was not completed and the incident is escalated.

## Do not paper over it

Setting `StrictHostKeyChecking no` or pointing `UserKnownHostsFile` at `/dev/null` silences the warning by disabling the check entirely. That removes the protection against interception for every future connection, not just this one. It is not a fix.

## Follow-up

- If the cause was a deliberate key rotation, see [key management](key-management.md).
- An unexplained mismatch on an internet-facing server warrants treating as a possible interception: escalate per [the first hour](../../incidents/first-hour.md).
