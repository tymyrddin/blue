# Common failure patterns in correlation detection

Correlation rules rarely fail loudly. They fail by telling plausible lies, or by saying nothing at all. Both are dangerous.

This page documents the most common ways correlation logic breaks in practice, how to recognise each failure mode, and what it usually means about the underlying design.

## Failure pattern 1: Silent non-detection

### What it looks like

You know an attack sequence occurred. Logs are present. Individual events are visible.
But no correlation alert is raised.

No errors. No warnings. Just absence.

### What it usually means

* One or more parent stages never fired
* A decoded field name does not match across stages
* State expired before the next step arrived
* Correlation depends on a signal that was assumed “always present”

### Why this is dangerous

This is the default failure mode of correlation. It creates false confidence. Dashboards stay green while attacks walk straight through.

### Typical root cause

Correlation logic was written optimistically rather than defensively. Optional signals were treated as mandatory. Field consistency was assumed rather than enforced.

## Failure pattern 2: Correlation without causation

### What it looks like

Alerts fire correctly, but on investigation the events were unrelated.
Different prefixes, different ASNs, different operational changes — but somehow they formed a “sequence”.

### What it usually means

* Field matching is too broad
* Correlation relies on timing alone
* Shared infrastructure events are being linked incorrectly

### Why this is dangerous

This creates believable but false incident narratives. Analysts waste time responding to ghosts. Trust in detection erodes quickly.

### Typical root cause

Correlation logic values completeness over precision. Boundaries were not explicitly encoded.

## Failure pattern 3: Order does not matter (but should)

### What it looks like

Events arrive out of sequence, yet still correlate.

A withdrawal precedes an announcement. Validation precedes observation. The timeline makes no sense, but the alert fires anyway.

### What it usually means

* Correlation does not enforce parent–child ordering
* State is reused incorrectly
* Temporal direction was assumed rather than encoded

### Why this is dangerous

Attack narratives become internally inconsistent. Analysts cannot reason about what actually happened, only that “something matched”.

### Typical root cause

Correlation logic focuses on presence of events, not progression of state.

## Failure pattern 4: Timeframe inflation

### What it looks like

Correlation works in testing, but in production unrelated events begin to link hours or days apart.

Alerts feel “late”, vague, or strangely assembled.

### What it usually means

* Timeframes were extended to “make it work”
* Expiry was loosened to mask missed correlations
* Asynchronous behaviour was over-accommodated

### Why this is dangerous

Long timeframes blur causality. Correlation becomes statistical coincidence with a memory.

### Typical root cause

Timeframes were tuned reactively instead of being grounded in how the attack actually unfolds.

## Failure pattern 5: Optional signals become accidental gates

### What it looks like

A correlation works only when an extra signal is present, even though that signal was meant to be optional.

Without it, nothing fires.

### What it usually means

* Optional steps were placed incorrectly in the sequence
* Confidence escalation was implemented as dependency
* The logic structure contradicts the stated intent

### Why this is dangerous

Detection becomes environment-dependent. Attacks are detected only in “well-instrumented” networks.

### Typical root cause

The correlation logic encodes convenience, not intent.

## Failure pattern 6: Confidence collapse

### What it looks like

Later stages lower severity, reset alerts, or overwrite earlier conclusions.

An alert appears confident, then suddenly looks less certain.

### What it usually means

* Severity is tied to the last event, not accumulated evidence
* Correlation resets state instead of extending it
* Levels are treated as classifications, not confidence

### Why this is dangerous

Analysts cannot trust alert severity. Response decisions become arbitrary.

### Typical root cause

Confidence progression was not treated as a first-class design constraint.

## Failure pattern 7: Noise amplification

### What it looks like

Benign operational activity produces a flood of correlation alerts.

Maintenance windows look like attack campaigns. Normal routing churn resembles adversarial behaviour.

### What it usually means

* Boundaries are under-specified
* Correlation lacks exclusion logic
* Event selection is too permissive

### Why this is dangerous

Correlation alerts lose meaning. Analysts start ignoring them — including the real ones.

### Typical root cause

Correlation was designed around attacks only, not around the environment attacks must hide in.

## Failure pattern 8: Correlation drift over time

### What it looks like

Correlation worked six months ago. Now it does not. No one remembers changing anything important.

### What it usually means

* Decoders evolved
* Field names changed subtly
* Log sources were added, removed, or normalised differently

### Why this is dangerous

Correlation logic rots invisibly. The longer it runs untested, the less it reflects reality.

### Typical root cause

Testing was treated as a one-time validation, not a continuous discipline.

## How to use this page

When a correlation misbehaves:

1. Identify which failure pattern it resembles.
2. [Trace that pattern back to intent](human-backbone.md): sequence, fields, boundaries, confidence.
3. Fix the logic, not the symptoms.

Do not “just extend the timeframe”. That is how most of these failures begin.

## Rule of thumb

If a correlation alert tells a story that feels convincing but cannot be explained step by step from observable events, 
it is lying.
