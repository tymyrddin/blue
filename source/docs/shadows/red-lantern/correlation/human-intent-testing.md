# Human-intent testing workflows for correlation rules

Testing correlation rules does not have to start with scripts or log injection. You can validate intent, confidence, and sequence with structured exercises that are purely analytical, yet directly map to operational rules.

## Step 1: Map the attack scenario

* Identify the stages of the attack you want to test.
  Example (multi-stage BGP attack):

  1. BMP announcement observed
  2. RPKI validation confirms legitimacy
  3. Optional router acceptance
  4. BMP withdrawal

* For each stage, note:

  * Required signals (fields, log sources)
  * Optional signals (enhancements, confidence boosters)
  * Expected confidence level if stage is reached

Makes sequences explicit before any logs or rules are involved. Analysts can reason about gaps or inconsistencies early.

## Step 2: Define success and failure criteria

* Success: Correlation fires exactly when all required stages are observed, with correct confidence progression.
* Partial sequence: Optional stages missing; correlation fires at last confirmed stage.
* Failure: Missing required stages, out-of-order events, or incorrect field matching prevents correlation.

Provides a clear “ground truth” against which to judge correlation logic, even before generating logs.

## Step 3: Walk through sequences manually

* Take each scenario and step through the events in order:

  * Mark which stages should trigger correlations.
  * Note whether optional signals are present or absent.
  * Check that confidence level matches expectations.

* For edge cases:

  * Swap order of stages
  * Remove optional signals
  * Introduce extraneous events

Ensures rules are sensitive to order, optionality, and noise without executing anything.

## Step 4: Visualise correlation chains

* Use tables, flowcharts, or diagrams to represent:

  * Event stages
  * Required and optional fields
  * Expected confidence level progression
  * Boundaries/exclusions

Provides a quick reference for analysts, simplifies hand-off to developers, and documents correlation intent for audit.

## Step 5: Validate sequence integrity

* Confirm that:

  * Required stages cannot be skipped
  * Optional stages enhance confidence but do not block correlation
  * Out-of-order events do not trigger false correlations
  * Boundaries prevent unrelated events from linking

Detects logical flaws early, without waiting for logs or a monitoring engine.

## Step 6: Simulate timing assumptions

* Even without timestamps, consider plausible delays between stages:

  * “Fast” progression vs. “delayed validator response”
  * Optional signals that might arrive asynchronously

* Note whether the correlation logic, as designed, would still fire correctly.

Prepares rules for real-world network behaviour without requiring execution or environment setup.

## Step 7: Document findings and update rules

* Record any ambiguities, sequence issues, or confidence misalignments.
* Update human-readable correlation definitions before coding or platform-specific implementation.

Ensures that the operational ruleset reflects deliberate design choices rather than accidental behaviour.

## Step 8: Repeat for multiple scenarios

* Test medium and advanced attacks, multi-source events, and optional signal variations.
* Treat each correlation as a living artefact; validate whenever new scenarios, signals, or decoders are introduced.

-
