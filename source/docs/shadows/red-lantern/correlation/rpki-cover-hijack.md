# RPKI cover hijack

## What this correlation detects

An active BGP hijack or interception in which an adversary:

1. Announces a prefix or sub-prefix
2. Ensures the announcement appears RPKI-valid
3. Achieves routing acceptance under that cover
4. Operates briefly, then withdraws or stabilises

Unlike noisy hijacks, this attack succeeds by abusing trust, not ignoring it.

## Why this matters

Classic hijack detection looks for:

* invalid routes
* sudden origin changes
* obvious leaks

This attack does none of that.

If you only alert on `invalid`, you miss it.
If you alert on every announcement, you drown.

Only correlation across systems reveals intent.

## Observable signals

Observable without payload inspection:

* BGP announcements and withdrawals for monitored prefixes (via BMP)
* Route attributes consistent with legitimate origin
* RPKI validation results indicating `valid`
* Prior or concurrent ROA state changes (contextual, not required)

No DPI. No traffic capture. No heroics.

## Required log sources

This correlation assumes access to:

* BMP (BGP Monitoring Protocol): Authoritative view of announcements and withdrawals
* RPKI validator logs: Validation outcome for the observed prefix–origin pairs

Optional but useful:

* Historical ROA change records
* Prefix ownership metadata

Router syslog is not required and not authoritative for routing truth.

## Correlation logic (human-readable)

The detection logic is as follows:

1. A BGP announcement for a monitored prefix or sub-prefix is observed via BMP
2. The announcement is classified as RPKI-`valid` by one or more validators
3. The route attracts traffic (inferred by propagation or persistence)
4. The prefix is later withdrawn or replaced without operational justification

When a routing event both looks legitimate and behaves tactically, raise a high-confidence alert for an RPKI-covered hijack.

## Temporal considerations

* Announcement and validation occur close in time
* Withdrawal may be delayed
* Correlation must allow non-symmetric timing

Short attack, long memory.

## Assumptions and limitations

Assumptions:

* BMP visibility exists for relevant peers
* Validator results are trustworthy enough for consensus

Limitations:

* Persistent hijacks may evade withdrawal-based logic
* Partial BMP visibility reduces confidence
* Detection is late-stage by design

This favours accuracy over immediacy.

## Evasion considerations

A capable adversary may:

* Maintain the route indefinitely
* Announce exact prefixes only
* Limit propagation to reduce visibility

Each evasion trades stealth for operational complexity.

## Expected outcome

A triggered correlation indicates:

* Routing trust has been successfully abused
* Immediate mitigation is required
* Trust anchors and ROAs must be audited

This is not a false positive you ignore.
This is a control-plane incident.

## Related playbooks

* Playbook 2: ROA poisoning and validation mapping
* Incident response: prefix filtering, ROA rollback, validator cross-checking
