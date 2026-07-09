# Centralised logging

Monitoring-enablement runbook. Forwards logs off each server to a separate destination, so that a root-level attacker who can edit or delete local logs cannot reach the copies that already left the machine. This is the control that gives an incident investigation a trustworthy timeline.

## When to run

During initial setup of any server holding data worth protecting. On an existing fleet that keeps logs only locally. The value is established before an incident.

## Why it is worth the effort

Logs on a compromised server can be modified or deleted by whoever holds root. An investigation that depends on local logs after a root-level compromise often finds the relevant entries gone. Logs forwarded as they are written survive on the destination, out of the attacker's reach. The trade-off is bandwidth, which is modest for text logs.

## The log destination

A dedicated logging server, hardened more tightly than the hosts it collects from:

- One purpose only: receiving logs. No other services exposed.
- Behind a firewall, reachable only from the hosts that ship to it.
- No unnecessary accounts.

A managed log service (a hosted SIEM or log platform) achieves the same separation without running the destination in-house, and is often the practical choice for a small team.

## Choosing a tool

`rsyslog` is installed by default on Debian and Ubuntu and has the simpler configuration syntax. `syslog-ng` handles complex routing more clearly. For a straightforward forward-everything setup, `rsyslog` is the lower-effort choice.

## Verify

After configuring forwarding, confirm logs arrive on the destination:

1. Generate a log event on a source host (an SSH login, or `logger "test message"`).
2. Confirm the message appears on the destination within a few seconds.
3. Confirm the destination is receiving from every host that should be shipping.

A source host whose entries stop appearing is either down or no longer forwarding; either is worth noticing.

## Done

Every server worth protecting forwards its logs. Test messages arrive on the destination. The destination runs no unnecessary services and is reachable only from its source hosts.

## Tamper resistance

A determined intruder who controls a source host can stop it forwarding, though they cannot recall what already shipped. For higher assurance, a passive collector (a second box receiving a copy of the log traffic, with no IP address of its own, listening in promiscuous mode for the destination's address and port) records the stream independently of the primary destination. This is worth considering where logs may become evidence.

## Follow-up

- Forwarded logs are only useful when something reads them. Pair with periodic [log review](../reading-logs.md) or alerting on the destination.
- Confirm log forwarding is part of the [server hardening sequence](../first-steps.md) for new hosts.
