# ROA poisoning and validation mapping logic

## The pattern

A preparatory control-plane manipulation, in which an adversary:

1. Introduces or alters ROA data (creation, modification, replacement, or expiry abuse)
2. Causes a change in RPKI validation outcome for an existing prefix-origin pair
3. Does not immediately announce a hijack

This is not the attack. It is the arming phase. The point of it is to reshape trust signals so that a later BGP action arrives looking legitimate.

## Slipping past as noise

ROA changes are usually waved through as administrative noise:

* Certificates roll
* ROAs expire
* Operators make mistakes

On their own these are boring, and boring is exactly the cover. They turn interesting only when a validation state changes and no routing necessity explains the change.

This phase is invisible to BGP-only monitoring, and cannot be reconstructed after the fact if it was never recorded.

## Observable signals

Visible without packet inspection or probing:

* RPKI validator logs indicating:

  * ROA creation, modification, replacement, or expiry
  * Validation state transitions (`valid` ↔ `invalid` ↔ `not_found`)
* Timing and consistency of validation results across validators
* Absence of any corresponding operational routing change

What is *not* needed:

* Router logs
* BGP announcements
* Traffic anomalies

This phase may sit days or weeks ahead of any routing event.

## Required log sources

This correlation assumes access to:

RPKI validator logs

* Preferably from multiple independent validators
* With validation-state transitions logged explicitly

Optional, but useful:

* Registry or CA interaction logs
* Change management records, to rule out legitimate ops

## Correlation logic (human-readable)

Shape of the detection:

1. A monitored prefix-origin pair experiences a ROA-related event
2. One or more validators report a change in validation state
3. No corresponding BGP announcement, withdrawal, or operational event is observed
4. Validator consensus is incomplete, inconsistent, or transient

When validation behaviour changes without routing pressure behind it, a low-to-medium confidence alert for trust-signal manipulation is warranted.

This is not an accusation. It is a flagged setup condition.

## Temporal considerations

* ROA changes may propagate unevenly
* Validators may disagree for minutes to hours
* Correlation windows must therefore be long and tolerant

Slow-moving ground preparation, not a burst event.

## Assumptions and limitations

Assumptions:

* Validator logs are retained
* Multiple validators are observed

Limitations:

* Legitimate maintenance can look identical
* Single-validator visibility is weak
* Attribution is not possible at this stage

Detection favours early warning over certainty, which is the right trade for an arming phase.

## Evasion considerations

An adversary may:

* Stage changes during a known maintenance window
* Use expiry rather than explicit modification
* Poison only a subset of validators

Each of these buys less visibility, at the cost of more operational friction for the attacker.

## Expected outcome

A triggered correlation says:

* Trust infrastructure has shifted
* Later routing events are worth treating with suspicion
* Subsequent playbooks carry more confidence than they would cold

This correlation is [Playbook 1](../response/playbooks.md) in the response sequence, and feeds into 
[Playbook 3](../response/playbooks.md).
