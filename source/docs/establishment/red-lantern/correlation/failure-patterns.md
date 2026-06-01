# Common failure patterns in correlation detection

Correlation rules rarely fail loudly. They fail by telling plausible lies, or by saying nothing at all. Both are dangerous, and the quiet one more so.

What follows is a catalogue of the ways correlation logic tends to break, how each one shows itself, and what it usually says about the design underneath.

## Failure pattern 1: Silent non-detection

### Symptom

You know an attack sequence occurred. Logs are present. Individual events are visible. And no correlation alert is raised.

No errors. No warnings. Just absence.

### Usual cause

* One or more parent stages never fired
* A decoded field name does not match across stages
* State expired before the next step arrived
* Correlation leans on a signal that was assumed "always present"

### Danger

This is the default failure mode of correlation, and the most expensive. It manufactures false confidence: dashboards stay green while an attack walks straight through.

### Root cause

The logic was written optimistically rather than defensively. Optional signals were treated as mandatory. Field consistency was assumed rather than enforced.

## Failure pattern 2: Correlation without causation

### Symptom

Alerts fire correctly, and then investigation shows the events were unrelated. Different prefixes, different ASNs, different operational changes, somehow assembled into a "sequence".

### Usual cause

* Field matching is too broad
* Correlation rests on timing alone
* Shared-infrastructure events are being linked when they should not be

### Danger

This produces believable but false incident narratives. Analysts spend their time chasing ghosts, and trust in detection drains away fast.

### Root cause

The logic values completeness over precision. Boundaries were never explicitly encoded.

## Failure pattern 3: Order does not matter (but it ought to)

### Symptom

Events arrive out of sequence and still correlate.

A withdrawal precedes an announcement. Validation precedes observation. The timeline makes no sense, and the alert fires anyway.

### Usual cause

* Correlation does not enforce parent-child ordering
* State is reused incorrectly
* Temporal direction was assumed rather than encoded

### Danger

Attack narratives become internally inconsistent. Analysts cannot reason about what actually happened, only that "something matched".

### Root cause

The logic focuses on the presence of events, not the progression of state.

## Failure pattern 4: Timeframe inflation

### Symptom

Correlation works in testing, then in production unrelated events start linking hours or days apart. Alerts feel late, vague, oddly assembled.

### Usual cause

* Timeframes were stretched to "make it work"
* Expiry was loosened to mask missed correlations
* Asynchronous behaviour was over-accommodated

### Danger

Long timeframes blur causality. Correlation degrades into statistical coincidence with a memory.

### Root cause

Timeframes were tuned reactively, rather than grounded in how the attack actually unfolds.

## Failure pattern 5: Optional signals become accidental gates

### Symptom

A correlation works only when an extra signal happens to be present, even though that signal was meant to be optional. Without it, nothing fires.

### Usual cause

* Optional steps were placed wrongly in the sequence
* Confidence escalation was implemented as dependency
* The logic structure contradicts its stated intent

### Danger

Detection becomes environment-dependent. An attack is caught only in well-instrumented networks, and missed everywhere else.

### Root cause

The logic encodes convenience, not intent.

## Failure pattern 6: Confidence collapse

### Symptom

Later stages lower the severity, reset the alert, or overwrite earlier conclusions. An alert looks confident, then suddenly looks less sure of itself.

### Usual cause

* Severity is tied to the last event, not accumulated evidence
* Correlation resets state instead of extending it
* Levels are treated as classifications rather than confidence

### Danger

Analysts cannot trust the severity, and response decisions turn arbitrary.

### Root cause

Confidence progression was never treated as a first-class design constraint.

## Failure pattern 7: Noise amplification

### Symptom

Benign operational activity produces a flood of correlation alerts. Maintenance windows look like campaigns. Ordinary routing churn looks adversarial.

### Usual cause

* Boundaries are under-specified
* Correlation lacks exclusion logic
* Event selection is too permissive

### Danger

Alerts lose meaning, and analysts begin ignoring them, the real ones included.

### Root cause

Correlation was designed around attacks alone, not around the environment they have to hide in.

## Failure pattern 8: Correlation drift over time

### Symptom

Correlation worked six months ago. Now it does not, and nobody remembers changing anything important.

### Usual cause

* Decoders evolved
* Field names changed subtly
* Log sources were added, removed, or normalised differently

### Danger

The logic rots invisibly. The longer it runs untested, the less it resembles reality.

### Root cause

Testing was treated as a one-time validation, not a continuous discipline.

## Using this page

When a correlation misbehaves:

1. Work out which failure pattern it resembles.
2. [Trace that pattern back to intent](human-backbone.md): sequence, fields, boundaries, confidence.
3. Fix the logic, not the symptom.

The one move to resist is "just extend the timeframe". That is how most of these begin.

## Rule of thumb

If a correlation alert tells a story that feels convincing but cannot be explained step by step from observable events, it is lying.
