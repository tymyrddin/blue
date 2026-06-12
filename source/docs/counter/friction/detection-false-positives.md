# Detection false positive economics

Every analyst has a finite queue. An alert that is almost always a false positive trains the analyst
who reviews it to dismiss quickly. Eventually, they dismiss all alerts in that category quickly,
including the ones that are real.

Alert fatigue is not a motivational problem. It is a signal quality problem. A detection system
that fires on 90% false positives does not detect 10% of incidents: it provides something closer
to no detection, because the processing overhead eliminates the human capacity to investigate the
real ones.

A tuned detection rule is not one that fires rarely. It is one that fires with a high true positive
ratio. The exclusion list on a rule is calibration, not compromise. The goal is that when the rule
fires, the analyst has reason to investigate rather than reason to dismiss.

Measuring false positive rate requires tracking analyst disposition on every alert. Many environments
do not do this systematically. Without it, false positive rate is a feeling rather than a metric,
and calibration has no feedback signal. The "our detection is probably too noisy, but we're not sure"
state is common.

The practical consequence: the cost of a detection rule is not the engineering time to write it.
The cost is the analyst time consumed by every false positive it generates for as long as it runs.
A rule that generates ten false positives per analyst per week consumes roughly three hours of
analyst time per week, indefinitely, until it is tuned or disabled.
