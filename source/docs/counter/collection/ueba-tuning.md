# UEBA calibration

The gap between deploying anomaly detection and having anomaly detection that is operationally
functional is almost entirely a calibration problem. An uncalibrated UEBA system either generates
enough false positives to train analysts to ignore it, or is tuned so conservatively it misses
real incidents. Neither state resembles detection.

Calibration is ongoing work, not a one-time deployment step.

## User archetypes

Effective baseline modelling depends on understanding what different user types look like when they
are not doing anything suspicious. Treating all users as interchangeable produces noisy models;
role-aware baselines produce actionable ones.

Finance analyst: activity concentrated within business hours, typically 8am-6pm on working days.
Access focused on accounting and ERP systems, spreadsheets, shared finance directories. Limited
external data transfer. Minimal access to development infrastructure, source repositories, or
IT management tools. The access pattern is predictable and narrow. Anomalous signals for this
archetype: after-hours bulk SharePoint downloads, access to dev systems or source repositories,
API calls to HR or payroll systems from a user not normally in those systems, access from an IP
outside the office range.

Developer: irregular hours (late commits, weekend pushes) are normal. Broad access to development
and staging environments, CI/CD pipelines, code repositories. Moderate external data transfer
(dependency downloads, container image pulls) is expected. Access to secrets and configuration
vaults is part of the role. Anomalous signals: access to production databases outside deployment
windows, bulk reads of credentials or secrets beyond the role's scope, new cloud service
configurations, lateral movement to systems outside the development perimeter.

IT administrator: privileged access is expected across a wide range of systems. High variability
in working hours (incidents do not respect business hours). Access to identity management systems
and domain infrastructure is routine. The challenge for this archetype is that many individual
events that would be anomalous for other users are normal for IT admin accounts. Peer group
normalisation works better than absolute thresholds: flag IT admin behaviour that diverges from
other IT admins. Anomalous signals: bulk account modification
outside change management windows, service account key creation not tied to a tracked change,
access from geographic locations inconsistent with the person's role, authentication method
downgrade.

Contractor: access scope is bounded by the contract and the project. Activity outside contracted
hours is uncommon. The contractor's access set is narrower than employees in the same technical
role. Anomalous signals: access to systems outside the contracted project scope, activity well
outside contracted hours without an incident to explain it, session activity continuing past
contract end date, lateral movement to systems not related to the contracted work.

Executive: high-value target with access to board documents, financial data, and strategic
communications. Admin assistants with delegated access make the pattern complex: some of the
activity attributed to the executive account may legitimately originate from the delegate.
Anomalous signals: direct interactive access to systems the executive normally accesses through
delegates, bulk exports of sensitive documents, password or MFA changes outside the standard
IT process, access from new devices or locations.

## Learning window decisions

A model cannot score events until it has seen enough of them to establish what normal looks like
for the entity. Thirty days is a common minimum; sixty is more reliable for accounts with
irregular activity, since a thirty-day window may not capture the full range of legitimate
behaviour.

The learning window creates a gap: new accounts and dormant accounts that have been inactive
long enough to exhaust the lookback period restart learning. Two approaches
reduce the impact.

Peer group normalisation during the learning window: while the model is learning the individual
account's pattern, it can score events against the peer group baseline. A new developer whose
first-week activity looks nothing like other developers is worth noting even before an individual
baseline exists.

The dormant account return: if an account has been inactive for longer than the lookback period,
treat it as a new account. A three-month gap likely means
the person's role, access, and work pattern have changed enough that the old baseline is not
meaningful. Flag post-return activity that diverges significantly from the learning-window pattern
and from peer group.

## Feature weighting by organisation scale

The features that produce reliable signal differ between small and large environments.

Smaller organisations (under 200 users): peer groups are small, sometimes too small for meaningful
statistical normalisation. Time-of-day and day-of-week features tend to be more reliable than peer
comparison, because regular users have consistent schedules. Geographic features (new country, new
ASN) are high signal, because the environment is stable and legitimate travel is infrequent and
usually known in advance. Statistical models built for enterprise-scale populations may make
assumptions (normally distributed features, sufficient peer group size) that do not hold at small
scale. Threshold models often outperform statistical ones in these environments.

Larger organisations (2,000+ users): peer groups are large enough for statistical normalisation to
work. Finance-analyst-to-finance-analyst comparison is meaningful. Geographic features are noisier
(legitimate travel is more frequent). API call rate and resource access scope divergence tend to
be more reliable than geographic signals. Role-change integration with the HR system is worth
building: access changes correlated with role changes and offboarding events are expected; changes
not correlated with HR events warrant review.

## Feedback loop structure

Without a structured feedback loop, a UEBA model drifts from its intended calibration over time as
the environment changes and analyst suppressions accumulate without review.

Analyst disposition on every alert: at minimum, classify each alert as true positive, false positive,
or indeterminate. All three are useful. True positive events become positive training examples. False
positive events identify features or thresholds that need adjustment. Indeterminate events (plausible
but unconfirmed) are worth tracking as a signal quality indicator: a high indeterminate rate often
means the alert threshold is slightly too low.

Known-anomaly suppression: travel periods, on-call schedules, incident response activity, planned
maintenance windows, and scheduled deployments can all generate events that look anomalous but are
legitimate. These are worth suppressing from the alert queue during the relevant window, but the
events are still worth collecting and scoring. The suppression prevents alert fatigue; it does not
discard the signal. A suppression rule that is too broad (suppress all activity for user X during
travel) is itself a risk. Suppress the specific expected behaviour.

The reset cycle: revisit feature weights and suppression rules every four to six weeks based on
disposition data; conduct a full model review every quarter. Without a reset cycle, exclusion lists
accumulate and the model drifts toward permissiveness.

## False positive budget

A UEBA pipeline in operational use typically targets below 5% false positives. Reaching that level
requires several rounds of feedback-driven calibration.

Measurement: track analyst disposition on all alerts. False positive rate is FP divided by the sum
of FP, TP, and indeterminate. Many deployments measure false positive rate by gut feeling, which
makes calibration impossible.

When a feature persistently drives false positives: reduce its weight, add a context modifier
(suppress during business hours if it is an after-hours feature), or raise the threshold for that
specific feature independently of others. A single feature with a 40% false positive rate does not
require raising the overall alert threshold; it requires adjusting that feature.

The alert volume worth tracking: the number of alerts per analyst per week.
An environment with one analyst and 20 alerts per week has a different capacity constraint than
one with five analysts and the same volume. Calibrate to maintain a ratio where every alert can
receive investigation, not to minimise the absolute number of alerts.
