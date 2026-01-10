# ROA poisoning and validation mapping logic

## What this correlation detects

A preparatory control-plane manipulation in which an adversary:

1. Introduces or alters ROA data (creation, modification, replacement, or expiry abuse)
2. Causes a change in RPKI validation outcome for an existing prefix–origin pair
3. Does not immediately announce a hijack

This is not the attack itself. This is the arming phase.

The objective is to reshape trust signals so that a later BGP action will appear legitimate.

## Why this matters

ROA changes are usually treated as administrative noise:

* Certificates roll
* ROAs expire
* Operators make mistakes

On their own, these events are boring. They become interesting only when validation states change, and no routing 
necessity explains the change

This phase is invisible to BGP-only monitoring and cannot be detected after the fact if you do not record it.

## Observable signals

Observable without packet inspection or probing:

* RPKI validator logs indicating:

  * ROA creation, modification, replacement, or expiry
  * Validation state transitions (`valid` ↔ `invalid` ↔ `not_found`)
* Timing and consistency of validation results across validators
* Absence of corresponding operational routing changes

What is *not* required:

* Router logs
* BGP announcements
* Traffic anomalies

This phase may occur days or weeks before any routing event.

## Required log sources

This correlation assumes access to:

RPKI validator logs

* Preferably from multiple independent validators
* With explicit validation-state transitions logged

Optional but useful:

* Registry or CA interaction logs
* Change management records (to rule out legitimate ops)

## Correlation logic (human-readable)

The detection logic is as follows:

1. A monitored prefix–origin pair experiences a ROA-related event
2. One or more validators report a change in validation state
3. No corresponding BGP announcement, withdrawal, or operational event is observed
4. Validator consensus is incomplete, inconsistent, or transient

When validation behaviour changes without routing pressure, raise a low-to-medium confidence alert for trust-signal manipulation.

This is not an accusation. It is a flagged setup condition.

## Temporal considerations

* ROA changes may propagate unevenly
* Validators may disagree for minutes to hours
* Correlation windows must therefore be long and tolerant

This is slow-moving ground preparation, not a burst event.

## Assumptions and limitations

Assumptions:

* Validator logs are retained
* Multiple validators are observed

Limitations:

* Legitimate maintenance can look identical
* Single-validator visibility is weak
* Attribution is not possible at this stage

This detection favours early warning over certainty.

## Evasion considerations

An adversary may:

* Stage changes during known maintenance windows
* Use expiry rather than explicit modification
* Poison only a subset of validators

These evasions reduce visibility but increase operational friction for the attacker.

## Expected outcome

A triggered correlation indicates:

* Trust infrastructure has shifted
* Later routing events must be treated with suspicion
* Subsequent playbooks should be escalated in confidence

This correlation feeds Playbook 3.

