# Backups are cheap, restores are not

Taking a backup is nearly free and almost invisible: a scheduled job, a storage bill, a green tick in
the morning report. Restoring from one is none of those things, and the gap between the two is where
backup strategies quietly fail. An organisation knows it is backing up. It often does not know it can
recover, because recovery is the part nobody exercises until the day everything depends on it.

The friction is that a real restore test competes with production for the same systems, people, and
hours, and a test that genuinely proves recovery is disruptive enough that it keeps being deferred.
So the backups accumulate, untested, and the failure modes accumulate with them: the job that has
been silently skipping a database for a year, the archive that restores but takes a week, the
dependency that was never in scope. Each is invisible in the backup report and decisive in the
recovery.

Ransomware turned the backup from an insurance policy into a target, which raised the cost again. A
backup an attacker can reach and delete is a backup that fails exactly when it is needed, so the copy
now lives where a compromised administrator cannot delete it, write-once or offline or both, and that
isolation is its own operational friction: harder to manage, harder to test, harder to restore from
quickly.

The honest measure of a backup is not whether it ran but whether someone has restored from it
recently, against the clock. The organisations that can answer that question are the ones that paid
the friction the others deferred.
Last updated: 12 June 2026
