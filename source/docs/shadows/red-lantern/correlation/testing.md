# Testing correlation logic

## Why correlation rules must be tested deliberately

Correlation rules fail quietly. Single-event detections either fire or they do not. Correlation rules depend on a 
chain of assumptions: multiple decoders, correct field extraction, correct sequencing, state retention across time, 
and correct expiry. If any part fails, nothing alerts. There is no obvious error, just a comforting silence.

Testing exists to break that silence on purpose. The goal of correlation testing is not to prove that correlation 
works once. The goal is to prove that it works only when it should, and fails when it must.

## What testing validates

Each encoded correlation must be tested against five questions:

1. Does the intended sequence trigger the alert?
2. Does an incomplete sequence fail to trigger it?
3. Does incorrect ordering prevent correlation?
4. Do events outside the timeframe fail to correlate?
5. Does noise or unrelated activity remain excluded?

If any of these answers is wrong, the correlation logic is wrong, regardless of how elegant the XML looks.

## Testing philosophy: intent before mechanics

Testing is performed against *intent*, not implementation detail.

We are testing: *“When these observable events occur in this order, within this window, the system must recognise the attack.”*

Rule IDs, decoders, and platforms are implementation details. The encoded correlation is the contract.

## Testing ROA poisoning correlations

### Intended behaviour

ROA poisoning detection relies solely on RPKI signals.

A valid test confirms that:

* A single suspicious RPKI event produces a low-confidence alert.
* Multiple independent validator confirmations raise confidence.
* Optional authentication or management logs enhance context but are not required.

### What to test

* Positive case: Multiple validators report conflicting or malicious ROA state for the same prefix and origin AS within the defined window.
* Negative case: A single validator report does not escalate to high confidence.
* Boundary case: Validator updates arriving asynchronously still correlate within the allowed timeframe.
* Exclusion case: BMP announcements or router logs alone do not trigger this correlation.

If non-RPKI signals are required to trigger ROA poisoning detection, the correlation is mis-specified.

## Testing RPKI cover hijack correlations

### Intended behaviour

RPKI cover hijack detection ties routing activity to trust validation.

The detection logic asserts:

1. A routing announcement is observed.
2. RPKI validation confirms legitimacy.
3. A subsequent withdrawal increases confidence but is optional.

### What to test

* Positive case: Announcement followed by valid RPKI state results in a confirmed alert.
* Confidence progression: Withdrawal increases severity but absence of withdrawal does not suppress detection.
* Temporal asymmetry: Validation and withdrawal may arrive at different times; correlation must tolerate this.
* Exclusion case: Router syslog alone does not trigger this detection.

If withdrawals are mandatory, or if validation arriving later breaks detection, the correlation logic is too rigid.

## Testing multi-stage BGP attack correlations

### Intended behaviour

This correlation models a chained attack across routing, trust, and control planes.

It asserts:

1. A BMP announcement initiates suspicion.
2. RPKI validation confirms trust state.
3. Optional router acceptance raises confidence.
4. A withdrawal completes the attack narrative.

Each step increases confidence but should not invalidate earlier conclusions.

### What to test

* Complete sequence: All stages occur in order and produce a high-confidence alert.
* Partial sequence: Missing later stages do not suppress earlier alerts.
* Optional signal handling: Router acceptance enhances confidence but is not required.
* Order enforcement: Later-stage events arriving before earlier ones must not correlate.
* Time window enforcement: Events outside the defined windows must not link.

If the system correlates out-of-order events or ignores time boundaries, the detection is unreliable.

## Testing sequence integrity

Correlation is directional.

Testing must explicitly verify that:

* Parent stages fire before child stages.
* Child stages do not retroactively bind to unrelated parent events.
* State expires cleanly after the timeframe.

A system that correlates “eventually” instead of “correctly” will generate convincing but false narratives.

## Testing exclusion and noise resistance

Correlation rules must be selective.

Testing must confirm that:

* Unrelated routing churn does not trigger correlations.
* Background validator updates do not escalate alerts.
* Benign operational changes do not resemble attack sequences.

False positives in correlation are worse than missed alerts. They fabricate incidents.

## Testing confidence signalling

Each correlation uses alert levels to encode confidence.

Testing must verify that:

* Confidence increases monotonically with evidence.
* Confidence does not decrease or reset unexpectedly.
* Optional signals only ever increase confidence, never gate it.

If analysts cannot trust alert severity to reflect evidentiary strength, the correlation has failed operationally.

## Testing as a continuous process

Correlation testing is not a one-time activity.

It must be repeated when:

* Decoders change
* Timeframes are tuned
* New correlations are added
* Simulator scenarios evolve
* Log sources are added or removed

Correlation logic drifts silently. Testing is the only thing that keeps it honest.

## Outcome of successful testing

When testing is complete:

* Every encoded correlation fires only on its intended attack pattern.
* Confidence levels reflect evidence, not guesswork.
* Time and order matter, and are enforced.
* Noise stays noise.

At that point, the correlation rules stop being hopeful XML and become operational instruments. And there will still be 
[false positives and false negatives for various reasons](failure-patterns.md).
