# Long-window detection

Rules-based detection is precise and brittle. It identifies known patterns reliably; it has no mechanism for detecting a pattern it has not been shown. An attacker who never triggers a rule is invisible to a rules-based system regardless of what they are doing.

Long-window attacks stay invisible to rules by staying within what any individual event would consider normal. A single authentication from an unusual location is suspicious. The same account authenticating from a slightly different location range over six weeks, with gradual shifts in working hours and a slow expansion of accessed resources, produces no individual event worth flagging. The deviation is in the aggregate.

## The complement to rules

Machine learning does not replace rules. It fills the space between them. Rules catch known-bad: credential spray patterns, known malware hashes, prohibited command lines. Statistical models catch drift: when an account's behaviour over the past 90 days has moved steadily away from its own baseline in ways that precede a specific class of incident.

The two are not in competition. A rules engine running alongside a UEBA (User and Entity Behaviour Analytics) pipeline produces one alert when a rule fires and a different alert when a model detects cumulative deviation. Both are worth attending to; neither substitutes for the other.

## Long-window attack patterns

A patient attacker working inside compromised credentials moves through several phases, each spanning days or weeks.

Initial access and reconnaissance: logging in to confirm the account works, browsing accessible systems without downloading anything, establishing a usage pattern that will look like a normal user to future baseline analysis. This phase is nearly undetectable at the event level. The signal, if any, is in the access pattern relative to what the genuine user normally does.

Data staging: accessing files outside the account's normal scope, incrementally and in volumes below DLP thresholds. Each individual access is not suspicious. The cumulative change in which resources the account reaches is.

Exfiltration preparation: creating archive files, accessing file servers not usually touched, sending unusually large attachments. Each event is individually explainable. The pattern is not.

## Features that carry signal

Not all behavioural features produce the same diagnostic value. The most consistent across deployments:

Working hours drift: a genuine account has a distribution of activity times. A compromised account used by someone in a different timezone drifts toward a different activity window. The drift is gradual; its direction is consistent.

*A finance analyst's account shows logins distributed 08:30–17:30 for the previous 90 days. Over six weeks post-compromise, the active window shifts to 01:00–09:00 UTC. No individual login is outside business hours for someone, somewhere. The aggregate pattern is inconsistent with the account's history and inconsistent with the analyst's location data from the previous year. That shift is what a statistical model finds; no individual event rule would.*

Peer group divergence: a finance analyst's access pattern looks like other finance analysts. A compromised account begins accessing systems the analyst's peers do not touch. The peer group acts as a normalisation reference; divergence from it narrows the space of legitimate explanations.

Command sequence entropy: interactive sessions on Unix systems have predictable command sequences for legitimate users. An attacker exploring an environment issues a more diverse set of commands, often in short bursts. The entropy of the session's command sequence is measurably different.

New resource access rate: how fast is the account expanding the set of resources it touches? Legitimate users' access sets grow slowly and correlate with organisational role changes. Attacker-controlled accounts tend to expand faster and in directions less correlated with role.

## Baseline and the learning window

A model cannot score events until it has seen enough of them to establish what normal looks like for the entity. Thirty days is a common minimum; sixty is more reliable for accounts with irregular activity. During the learning window, events are collected but not scored.

The learning window creates a gap that is sometimes exploitable: a new account, or one dormant long enough to exceed the lookback period, restarts learning. A detection pipeline worth considering flags accounts whose early post-baseline behaviour deviates unusually from their learning-window pattern.

## Tiered alerting

A single alert threshold creates a binary choice: act or ignore. A tiered approach separates soft signals from hard ones.

A lower threshold routes events to an analyst queue: worth reviewing. A higher threshold triggers immediate action (PagerDuty, automated session review, account suspension pending verification). The analyst queue absorbs false positive volume; the high threshold preserves signal-to-noise ratio for auto-response.

Calibrating the high threshold is consequential. Too high, and real incidents reach full impact before detection. Too low, and auto-response fires on legitimate anomalies (travel, incident response activity, on-call access), poisoning the feedback loop.

## False positive rate as a detection metric

An analyst who processes 40 false positives per week will treat the 41st alert the same way. False positive rate is not a comfort metric; it is a measure of whether the detection system is operationally functional.

A mature UEBA pipeline typically targets below 5% false positives. Reaching that level requires several rounds of feedback-driven model adjustment: identifying which features drive most false positives for a given user population and reweighting or adding context modifiers.

Context modifiers suppress expected anomalies: known travel periods, active incident response, planned maintenance windows, scheduled deployments. Without these, the pipeline generates noise precisely when an organisation is most active, and the signal becomes hardest to trust.

## The attacker who knows about the model

An attacker aware that the environment uses statistical detection can attempt to avoid triggering the model by staying within their estimated baseline: moving slowly, using legitimate tooling, mimicking the genuine user's access patterns.

The signal this produces is the account's baseline drifting. Legitimate users' baselines are relatively stable, correlated with role changes and seasonal patterns. An attacker deliberately tracking a baseline to avoid detection shifts it faster and in directions less correlated with the genuine user's role. The drift rate is itself a feature.

This is not a guaranteed detection. A sufficiently patient attacker can move within acceptable deviation for a long time. The practical value of statistical detection is not in making detection perfect, but in raising the operational cost: patience and careful mimicry take time and increase the attacker's exposure window.

## Related

- [UEBA pipeline implementation](../../org/enterprise/runbooks/ueba-pipeline.md)
- [Alert tuning](../../org/enterprise/runbooks/alert-tuning.md)
- [Identity persistence hunting](../persistence/runbooks/identity-persistence-hunt.md)
