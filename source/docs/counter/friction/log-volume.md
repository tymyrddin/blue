# Log volume and the blind spots you bought

Detection runs on logs, and logs are priced by the gigabyte, ingested and retained. The control here
is visibility, and its cost scales with exactly the thing that makes it useful: the more an
organisation can see, the more it pays to see it, and the bill arrives monthly while the value
arrives only on the bad day.

The pressure that follows is downward, on volume. Verbose sources get trimmed, debug logging gets
disabled, and high-cardinality telemetry gets sampled at ingestion, each a reasonable economy and
each a blind spot bought in advance. The decision about which logs not to keep is a decision about
which incidents will be uninvestigable, made months earlier by someone reading a cost report rather
than chasing an intrusion.

Retention is the same trade in time. An attacker present for weeks is reconstructed from logs that
span weeks, and a retention window shortened to fit the budget caps how far back the investigation
can see. A thirty-day window against a ninety-day dwell time does not shorten the intrusion; it
shortens the part of it anyone can prove.

The economy that bites hardest is the quiet one: the source nobody is paying to collect because
nothing has ever needed it, right up until the morning it would have been the only record of how the
intruder got in. Log strategy is mostly the management of that bet, and the bet is placed long before
the hand is played.
Last updated: 12 June 2026
