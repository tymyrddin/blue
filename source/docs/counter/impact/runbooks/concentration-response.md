# Provider concentration failure: response runbook

Response when the impact lands on a third party the organisation depends on and does not control: a
cloud or platform outage, a shared-provider failure, a dependency that cannot be fixed from this side.
Pairs with the [concentration](../concentration.md) family.

## Establish what is actually down

```bash
# provider or local link? reach it from an independent path
curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' https://<provider-health-endpoint>
dig +short <provider-api-host> @1.1.1.1        # resolution from outside the estate
mtr -rwzc10 <provider-edge>                    # where the path actually breaks
```

- Check the provider's own status channel and Service Health / account-health API, not only the
  console, which may be down with everything else.
- Map the blast radius across functions, not hosts: which business processes stop, in what order, and
  which share this provider directly or transitively (its identity provider for auth, its DNS, its
  CDN, its queues). The transitive dependencies are the ones that surprise.

Accept early that the cause may not be fixable from this side or independently verifiable. The
provider's timeline is the timeline.

## Invoke continuity, not repair

Declare the incident and run the continuity plan rehearsed beforehand, not one invented now:

- Severity, and the degraded-mode service level (RTO / RPO) per affected function
- For each stopped process: its manual or alternate path, and the named owner who runs it
- Last known-good data: the backup timestamp, and the location of the copy to run from
- Who can authorise a failover, and to what

Fail over only to arrangements that are finished and tested. Confirm the secondary is actually live,
replication current and the DNS or traffic switch already exercised, before cutting to it; a secondary
announced but never completed is not an option in the morning. If borrowing alternate infrastructure
to keep critical traffic moving, treat that ground as untrusted: it belongs to someone, and routing
data over it tells them what moves.

## Manage the contagion

- Watch for second-order failure: settlement, identity, or logistics that silently depend on the same
  provider and fail a beat later. Check anything that authenticates through the provider's identity
  provider first, since that fails closed.
- Brief counterparties before the silence becomes the story. A few hours of unexplained outage
  reprices trust without a coin moving.

## Communicate first

Own the failure before a comfortable cover story mints enough witnesses to make the cover the more
damaging account.

## After

- Record which dependency was load-bearing and undeclared. Concentration risk is usually discovered,
  not designed, and the transitive dependencies are the gap.
- Re-test the failover that did not work, against the clock, before the next time.
