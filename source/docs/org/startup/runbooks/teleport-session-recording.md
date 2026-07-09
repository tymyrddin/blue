# Session recording

Runbook for configuring, storing, and reviewing Teleport session recordings. Every SSH session through Teleport is recorded. This was Vimes' condition. The recordings are stored in encrypted form and retained for one year. This runbook covers configuration, storage, and the process for reviewing a recording when it is needed.

## How recording works

When a user connects to a server via Teleport SSH, Teleport intercepts the session at the proxy layer and records all input and output as a structured event stream. The recording captures keystrokes, command output, and timing information. It can be replayed later, showing exactly what happened during the session.

Recording happens on the node by default (`session_recording: node` in the Teleport configuration). This means the agent on each server records the session before it reaches the shell, so even if the proxy is compromised, the node's recording is unaffected.

Recordings are stored as encrypted files in Teleport's session storage, which is backed by PostgreSQL in the current deployment. For long-term retention, recordings are also exported to a Hetzner Storage Box.

## Enabling enhanced session recording

Standard recording captures the terminal stream. Enhanced session recording captures at a lower level using BPF, recording system calls made during the session. This provides additional forensic detail: file operations, network connections, and process execution, even if the terminal output was suppressed.

Enable BPF-based enhanced recording on each node. This requires a kernel version that supports BPF programs (Linux 5.8 or later; Debian 12 ships with 6.1):

```
apt install -y linux-headers-$(uname -r)
```

Add to the ssh_service section of `/etc/teleport.yaml` on each agent node:

```
ssh_service:
  enabled: yes
  enhanced_recording:
    enabled: yes
    command_buffer_size: 8
    disk_buffer_size: 128
    network_buffer_size: 8
    cgroup_path: /cgroup2
```

Restart the Teleport agent:

```
systemctl restart teleport
```

Enhanced recording is particularly important for production database servers and Vault nodes, where the consequences of a compromised session are highest. It is enabled on all servers by default; disable it only if specific performance constraints require it.

## Session storage configuration

Sessions are stored in the PostgreSQL backend configured in the Auth service. For the current deployment, this is the same `teleport` database used for cluster state. Teleport uses the audit log tables for session metadata and stores the session recordings as binary blobs.

Long-term archival to the Storage Box is configured via an export script that runs nightly. Create `/opt/backup/teleport-sessions.sh`:

```
#!/bin/bash
set -euo pipefail

export TELEPORT_AUTH_SERVER="teleport.golemtrust.am:3025"
BACKUP_DIR="/opt/backup/teleport-sessions"
DATE=$(date +%Y-%m-%d)
AGE_PUBKEY="age1..."
STORAGEBOX_USER="u123456"
STORAGEBOX_HOST="u123456.your-storagebox.de"

mkdir -p "$BACKUP_DIR"

tctl export --type=session > "$BACKUP_DIR/sessions_${DATE}.jsonl"
age -r "$AGE_PUBKEY" -o "$BACKUP_DIR/sessions_${DATE}.jsonl.age" "$BACKUP_DIR/sessions_${DATE}.jsonl"
rm "$BACKUP_DIR/sessions_${DATE}.jsonl"

rsync -az -e "ssh -p 23" "$BACKUP_DIR/"*.age \
  "${STORAGEBOX_USER}@${STORAGEBOX_HOST}:/teleport-sessions/"

find "$BACKUP_DIR" -name "*.age" -mtime +365 -delete

echo "Teleport session export complete: $(date)"
```

```
0 1 * * * /opt/backup/teleport-sessions.sh >> /var/log/backup.log 2>&1
```

## Reviewing a session recording

To list recent sessions for a specific user:

```
tctl audit sessions --user=ponder.stibbons --last=168h
```

To list sessions on a specific server:

```
tctl audit sessions --node=merchants-guild-app-02 --last=168h
```

Each session has a session ID. To play back a session in the terminal:

```
tsh play <session-id>
```

Playback is interactive: use the spacebar to pause, arrow keys to scrub forward and backward, and `q` to quit. The playback shows the terminal exactly as the user saw it, at the original speed or at an accelerated rate with the `-speed` flag.

To export a session recording as an ASCIICAST file for sharing with Vimes or external parties:

```
tsh play --format=pty <session-id> > session_<date>_<id>.cast
```

ASCIICAST files can be viewed with `asciinema play` or uploaded to `asciinema.org`. Do not upload recordings to public services; they may contain sensitive information. Share as files through internal channels only.

To view session events (structured log of what happened, without the terminal stream):

```
tctl get events --session-id=<session-id>
```

This shows command execution events, file access events (with enhanced recording), and network connection events.

## When to review a recording

Session recordings are reviewed:

- After any security incident where a compromised or suspicious session is involved
- When an employee leaves, to review their recent production sessions
- When an access request is flagged during Carrot's weekly audit review
- On request from Vimes or the Patrician's office, with appropriate legal basis

Reviews are logged. Record in the internal security log: the session ID reviewed, the reviewer, the date, and the reason. Adora Belle has confirmed this is consistent with the staff data protection policy; session recordings are covered under legitimate interest for security monitoring purposes and employees are informed of this policy during onboarding.

## Retention and deletion

Sessions older than one year are deleted from the active PostgreSQL storage. The archived copies on the Storage Box are retained for three years, consistent with potential legal hold requirements.

If a specific session must be held beyond three years (active litigation or regulatory requirement), Adora Belle flags it explicitly and the automated deletion scripts are configured to exclude it by session ID. The legal basis for extended retention is documented in the data protection register.
Last updated: 20 March 2026
