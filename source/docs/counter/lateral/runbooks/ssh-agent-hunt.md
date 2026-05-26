# SSH agent socket access

Hypothesis: an attacker with root on a Linux jump host is hijacking SSH agent forwarding
to authenticate to downstream hosts.

SSH agent forwarding creates a socket under `/tmp` that proxies authentication back to the
originating user's agent. An attacker with root can read the `SSH_AUTH_SOCK` environment
variable from any connected session and use that socket to authenticate downstream as the
forwarding user. The private key never leaves the originating machine; the socket does the
work. Detection requires auditd monitoring file access within `/tmp` and correlating that
access with outbound SSH connections.

Data sources: auditd on Linux jump hosts; requires the following rule in
`/etc/audit/rules.d/ssh-agent.rules`:

```
-a always,exit -F arch=b64 -S open,openat,connect -F dir=/tmp -F key=ssh_agent_access
```

Then hunt for socket accesses by non-owning processes:

```bash
# surface agent socket access events
ausearch -k ssh_agent_access --start today | aureport -f --input -

# manual parse: find opens on agent.* files and the UID accessing them
awk '
  /type=SYSCALL/ { uid=""; match($0,/uid=([0-9]+)/,a); uid=a[1] }
  /type=PATH/ && /agent\./ { print uid, $0 }
' /var/log/audit/audit.log
```

The socket file owner corresponds to the SSH session that created it. Legitimate accesses
come from the sshd process serving that session and the authenticated user's shell. Access
by a process with a different UID, particularly root (UID 0), is anomalous. Correlate the
access timestamp against sshd logs for outbound SSH connections from the jump host within
the following 60 seconds: socket access followed by a new outbound connection is the
hijacking pattern.
