# Measuring a detection's false-positive rate

Turns "our detection is probably too noisy" into a number, so a rule can be tuned against evidence
rather than feeling. Pairs with [detection false positives](../detection-false-positives.md).

## Capture analyst disposition

The rate cannot be measured without recording the verdict on every alert. If the case management
system does not capture it, add a required field before anything else. For each alert, record:

- rule / detection name
- disposition: true positive, false positive, benign-expected, or duplicate
- time spent triaging (even a coarse bucket: under 5 min, under 30, over 30)

## Compute per-rule, not in aggregate

For a rolling 30-day window, per rule:

- volume          = alerts fired
- true_positive   = dispositioned true positive
- tp_ratio        = true_positive / volume
- analyst_hours   = sum of triage time

Rank by analyst_hours descending. The worst rules are the ones eating the
most time at the lowest tp_ratio, not the loudest by volume alone.

## Act on the ranking

- A rule firing mostly false positives provides closer to no detection than partial detection, because
  it trains the analyst to dismiss the category, real ones included. Tune it or disable it; leaving it
  noisy is the more expensive choice.
- Tune by raising the true-positive ratio, not by making the rule fire less. An exclusion that removes
  a known-benign source is calibration, not compromise. Record each exclusion with a reason and a
  review date.
- A rule that cannot be made to fire with reason to investigate is a candidate for retirement, or for
  demotion to a correlation input rather than a standalone alert.

## Make it standing

Re-run the ranking on a schedule. False-positive rate drifts as the estate changes, and a rule tuned clean last 
quarter is noisy again the moment a new source matches it.
