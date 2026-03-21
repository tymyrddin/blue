# Post-incident review

A post-incident review is not a debrief about what went wrong. It is a structured process
for learning from what happened and updating the systems, runbooks, and capabilities that
the incident exposed as insufficient. It produces a short list of actionable improvements
and a record that the organisation took its obligations seriously after the event.

Run the review within five days of the incident being contained. The details are fresh.
The people involved are available. The evidence is preserved. Waiting longer produces a
less accurate account and a less motivated team.

## Prerequisites

- Incident contained and recovery complete.
- All GDPR notification obligations met or in documented progress.
- Incident log complete, with timeline and decisions recorded throughout.

## The review meeting

Invite the full SIRT plus any staff member whose actions or systems were material to the
incident. This may include the affected user, application owners, or department managers
depending on the nature of the incident. The review is not a blame exercise. That
framing must be stated explicitly at the start of the meeting and enforced throughout.

The facilitator is the incident lead or, if the incident lead is subject to review
themselves, an independent senior manager.

Work through the incident timeline in order. For each phase, ask:

What did we know at this point and how did we know it? This establishes whether the
detection capability is adequate or whether the incident was detected later than it should
have been.

What decisions were made and on what basis? This establishes whether the decision-making
process was clear, whether the right people were involved, and whether the runbooks
supported or failed the decision.

What happened as a result? This establishes whether the actions taken were effective and
whether there were unintended consequences.

For the Fabulist Incident scenario, the timeline would be reviewed in six stages matching
the tabletop exercise: the initial phishing email, the executable opening, the lateral
movement period, the detection, the containment decisions, and the notification decisions.

## Outputs

The review produces three outputs.

The first is an incident report. This is a written account of the incident: what happened,
when, how it was detected, what the impact was, what was done in response, and what was
reported to whom. It is factual and chronological. It is not an assessment of blame. It
is retained as part of the organisation's data breach record and may be requested by the
supervisory authority. The documentation lead drafts it from the incident log. The DPO
and incident lead review and approve it before it is filed.

The second is a list of improvements. Each item on the list names a specific gap that the
incident revealed: a control that was absent, a process that failed under pressure, a
runbook that gave the wrong answer, a system configuration that enabled the attacker. Each
item has an owner and a realistic timeline. The list is reviewed at the next SIRT meeting.

The third is an update to the relevant runbooks. If the breach response runbook missed a
step that turned out to matter, add it. If the GDPR notification runbook gave the wrong
guidance on a question the DPO had to answer from first principles, update it. If the
SIRT structure did not include someone who turned out to be essential, add them. The
runbooks are the institutional memory of what was learned. Keep them current.

## Feeding back into the simulation programme

Every real incident improves the next tabletop exercise. If the Fabulist Incident
simulation did not include a decision point that the real incident required, add it to the
scenario. If participants in the tabletop made a decision that turned out to be wrong in
the real event, note it in the debrief notes for the next cohort.

The simulation and the real response should converge over time. The closer the tabletop
decisions are to the decisions the real incident required, the more the simulation is
preparing the team for what actually happens. That convergence is a measure of the
programme's quality.

## Metrics

Track across incidents and simulations:

- Time from initial compromise to detection.
- Time from detection to containment.
- Time from awareness to supervisory authority notification.
- Whether notification was made within 72 hours.
- Number of individuals affected.
- Number of improvement actions generated.
- Number of improvement actions completed within their timeline.

Review the metrics annually. A downward trend in time to detection and time to containment
indicates that the detection capability and the response process are improving. A consistent
failure to meet the 72-hour notification window indicates that the notification runbook or
the DPO's process needs attention.
