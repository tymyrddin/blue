# Design heuristics for robust correlation rules

Correlation is easy to get wrong. The previous page showed the ways it can fail silently, loudly, or misleadingly. 
This is the counterbalance: principles and heuristics that, when applied early, prevent most of those failures.

## Heuristic 1: Define explicit sequences

* Sequence matters: Every correlation should have a clear first, second, third… stage.
* Parent–child relationships: Encode which events must fire before others.
* State progression: Each step moves forward; nothing rewinds or skips arbitrarily.

Analysts can reason about the alert. Apparently, the system refuses to correlate out-of-order events.

## Heuristic 2: Bound optional signals

* Clearly mark optional steps.
* Optional signals should enhance confidence, not gate correlation.
* If an optional signal is missing, the correlation still fires at the last confirmed stage.

Reduces environmental dependency and avoids false negatives.

## Heuristic 3: Use precise field matching

* Each stage must check relevant fields consistently (e.g., prefix, ASN).
* Avoid “.*” everywhere unless absolutely necessary.
* Ensure normalization across log sources.

Prevents accidental correlations of unrelated events.

## Heuristic 4: Encode confidence progression

* Confidence levels should accumulate as the attack unfolds.
* Final alerts reflect the highest confirmed stage, not just the last event.
* Avoid resetting severity when optional steps fire.

Analysts understand how strong the evidence is and where gaps exist.

## Heuristic 5: Explicitly define exclusions

* Specify what does not belong in a correlation.
* Use boundaries to exclude benign operational events, unrelated prefixes, or maintenance logs.
* Make these exclusions explicit in the correlation definition.

Reduces noise amplification and false positives.

## Heuristic 6: Make timeframes intentional

* Define correlation windows based on how the attack actually progresses, not convenience.
* Short enough to prevent unrelated events linking, long enough to catch asynchronous actions.
* Document assumptions about timing for each step.

Prevents both missed detection and correlation drift.

## Heuristic 7: Keep enrichment and derived signals optional

* Only include signals that add insight without blocking detection.
* Derived signals (computed, enriched) should never replace core evidence.

Correlation remains grounded in observable events. Optional enhancements improve context but do not gate alerts.

## Heuristic 8: Treat correlation as a living artefact

* Correlations must evolve as decoders, log sources, and network environments change.
* Continuous testing is mandatory, not optional.
* Document changes in sequence, field mappings, confidence logic, and exclusions.

Avoids drift, rot, and silent failure over time.

## Heuristic 9: Human-readable encoding first

* Write correlation logic in a human-readable structured format before translating to platform-specific rules.
* Ensure each stage, sequence, and confidence level is unambiguous and traceable.
* Use diagrams or tables if necessary to clarify step relationships.

Rules become auditable, testable, and portable across monitoring platforms.

## Heuristic 10: Validate every correlation scenario

* Every correlation should have at least one ground truth scenario.
* Test both the complete sequence and plausible partial sequences.
* Confirm alerts fire only when expected and reflect intended confidence levels.

Detects silent failures, accidental correlations, and environmental assumptions before production deployment.

## TL;DR

Good correlation is not magic. It is a disciplined craft: Correlate what belongs together. Reject what does not. Make every alert explainable.

This mindset ensures your rules remain reliable, auditable, and actionable, no matter how complex the attack or how noisy the environment.
