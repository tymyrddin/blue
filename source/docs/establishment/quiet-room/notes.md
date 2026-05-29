# Design notes

## The real privacy risk of using Suricata

The actual privacy concern with Suricata is what it logs, not where it's from. Network flows contain IP addresses, which
are personal data under GDPR. A thesis from Instituto Superior Técnico explicitly demonstrated using Suricata with rules
designed to log only personal data accesses, reducing logs by ~48.8% while maintaining GDPR compliance.

This is a parody lever: the Establishment could argue "we only log data the DPF covers" while relying on a
foundationally American tool, creating a beautifully circular deniability chain.

Not a problem the Establishment would admit exists. The legal framework now explicitly permits EU-US data transfers
under the DPF, and Suricata is used by European CSIRTs (including the Dutch NCSC). If anything, the Establishment would
frame any concern as "procedural uncertainty" in the State of the City Survey, acknowledged but never actioned.

The real privacy question is whether the Office's MISP instance is properly configured. That's where a
GDPR violation could actually happen.

The Establishment does not have a privacy policy. It does not acknowledge it processes data. It does not respond to
subject access requests. Whether US intelligence agencies can access Suricata logs is therefore moot,
because the Establishment will never confirm the logs exist.

## The reliability scale

The 1-5 scale in the overview mirrors a standard tradecraft calibration: source reliability on one axis, information
confidence on another. The mapping is not documented anywhere that an outside observer would find. The Establishment
would describe the scale as "operationally derived".

The practical effect: material from the Society arrives as source category "Society notification" and is almost
always reliability 3 or 4 on first receipt. The Society's track record means its material is not treated as
unconfirmed. The Receiving Desk's anonymous channel, by design, caps at reliability 2 unless correlation lifts it.
This asymmetry is not described in any public document. It is the system working as intended.

## The selective Wazuh problem

The overview states that Wazuh telemetry is ingested "on a selective basis" and that "the selection criteria are
internal." This is accurate, and the selection criteria are worth noting for design purposes.

Wazuh generates substantial host-level noise. Most of it is irrelevant at the Quiet Room's level of analysis: patch
status, scheduled task changes, local user activity. What the Quiet Room wants from Wazuh is narrower: authentication
events from systems that touch the signals pipeline, and configuration changes to sensor infrastructure.

The selection is implemented as a Wazuh group assignment, not a filtering rule. Hosts are added to the relevant group
when deployed. Hosts not in the group do not forward to the Quiet Room at all. This means the selection is
maintained at deployment time, not at analysis time, which creates a different kind of blind spot: a host added
after the group configuration was last reviewed may not forward at all.

## Classification automation and the adjudication boundary

The open question about automating reliability scoring has a resolution: scores are auto-assigned on intake
based on source taxonomy, analyst review is required before material is escalated or routed above the
threshold, and manual override is available at any stage.

The reasoning is worth recording here because the failure mode is easy to miss. Fully automated scoring
would have the Quiet Room making credibility assessments, which is the Long Table's function. The two
layers are separated precisely so that intake metadata and assessment credibility do not collapse into each
other. A system that auto-scores everything looks like a triage system but behaves like an assessment
system, and the difference only surfaces when a high-volume period produces a string of auto-elevated
material that nobody reviewed before it reached the Long Table.

The analyst gate at the threshold is the mechanism that keeps the boundary real. The automation handles
volume. The analyst handles adjudication. These are different problems and the Quiet Room is not the
right place to solve the second one.

## The drop log

Material below the routing threshold is logged before being dropped. The drop log is retained for 90 days. It is not
reviewed by the Long Table. It is not reviewed by anyone in the normal course of operations.

The design intention is that the drop log exists for retrospective analysis: if a later high-confidence event
suggests something earlier was missed, the drop log provides the look-back window. In practice, retrospective
analysis requires someone to initiate it. The drop log does not initiate anything.

This is not a flaw. It is the correct tradeoff for a triage layer that processes volume. The alternative, reviewing
all dropped material, would collapse the signal-to-noise benefit the classification step provides. The Quiet Room
characterises and routes. The drop log is the record of what it did not route, available to whoever decides later
that it should have.