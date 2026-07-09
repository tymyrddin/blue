# File integrity monitoring with Samhain

Assurance runbook. Installs Samhain, a host-based intrusion detection system, and establishes a trusted baseline of the filesystem so that later tampering (modified binaries, new SUID files, hidden processes) can be detected. The baseline is only meaningful if taken on a clean system, which is why timing is the whole game.

## When to run

Immediately after provisioning a server, before it is exposed to any network traffic. A baseline taken later, on a server that has already been internet-facing, cannot be trusted to represent a clean state.

## Why timing decides everything

Samhain detects change against a baseline. If the baseline is built on a system that is already compromised, it faithfully records the compromised state and reports it as clean. A baseline is only as trustworthy as the moment it was taken. Taken on a fresh, unexposed system, it is a reliable reference; taken after exposure, it proves nothing.

## What it covers

Samhain checks file integrity, watches logs, detects rootkits, monitors ports, and flags rogue SUID executables and hidden processes. It is a detection control: it catches an intruder who is already in but still present.

## Setup, briefly

Samhain ships as source, so setup is more involved than a typical `apt install`. The full build (download, GPG signature verification, `./configure`, `make`, `make install`) is on the project site. Verify the download signature before building: it is the step that confirms the source has not been tampered with.

```
gpg --verify samhain-current.tar.gz.asc samhain-current.tar.gz
```

A `Good signature` line, with a fingerprint matching the one published on the project site, confirms the source is genuine.

## Building the baseline

This is the step everything rests on. On the freshly provisioned, not-yet-exposed system:

```
sudo samhain -t init
```

On a minimal system this produces a large volume of warnings about missing files and unmatched policies. That is expected. Work through them in `/etc/samhainrc` to distinguish genuine configuration from expected absences, then re-run until an update produces no output:

```
sudo samhain -t update
```

### Risk

Do not run `init` twice carelessly, and never re-init on a server that has been exposed. A re-init absorbs whatever the current state is into the baseline, including any tampering. From that point the tool reports clean and detects nothing.

## Configuration pointers

In `/etc/samhainrc`, files are grouped by how they are checked:

- Critical files (`/etc/passwd`, binaries in `/usr/sbin`) go in `ReadOnly`: all changes flagged.
- Logs that grow normally go in `GrowingLogFiles`: shrinkage is flagged (an intruder scrubbing logs), growth is not.
- Samhain's own binary, config, and database go in `IgnoreNone`: once running as a daemon it does not need to touch these, so any access is suspicious.
- A decoy file (named to look interesting, e.g. `tripwire`) placed and watched in `IgnoreNone` alerts on anyone poking around.

## Verify

Run a check against the baseline and confirm a deliberate change is caught:

```
sudo samhain -t check --foreground
```

With a clean baseline this reports nothing. Touch a watched file (a test file in a watched directory), re-run, and confirm Samhain reports the change. Then start the daemon:

```
sudo samhain -t check -D
```

## Done

Baseline built on a clean, unexposed system. A test change is detected. The daemon runs. The baseline and config are in `IgnoreNone`. The download was signature-verified before building.

## Follow-up

- Samhain detects; it does not recover. A confirmed tampering finding feeds [the first hour](../../incidents/first-hour.md) and the [compromise investigation](intruder-path.md).
- Forward Samhain's alerts off the host ([centralised logging](centralised-logging.md)), so an intruder with root cannot quietly suppress them.
Last updated: 10 July 2026
