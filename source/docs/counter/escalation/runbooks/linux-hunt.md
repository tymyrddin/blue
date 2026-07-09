# Linux privilege escalation hunting

Four audits: SUID binary baseline comparison, sudoers misconfiguration scan, capability
enumeration, and container escape precondition checks.

## SUID binary audit

Hypothesis: a SUID binary has been added or modified outside the system baseline,
providing a privilege escalation path.

Data source: filesystem scan.

```bash
# generate current SUID/SGID inventory
find / -type f \( -perm -4000 -o -perm -2000 \) -ls 2>/dev/null | \
  awk '{print $3, $5, $11}' | sort > /tmp/suid_current.txt

# compare against baseline
# to create baseline: cp /tmp/suid_current.txt /etc/security/suid_baseline.txt
if [ -f /etc/security/suid_baseline.txt ]; then
    echo "=== new or changed SUID/SGID binaries ==="
    diff /etc/security/suid_baseline.txt /tmp/suid_current.txt | grep '^>'
    echo "=== removed SUID/SGID binaries ==="
    diff /etc/security/suid_baseline.txt /tmp/suid_current.txt | grep '^<'
fi
```

Beyond new entries, flag any binary in the current inventory whose name matches known
GTFOBins escalation paths regardless of when it appeared:

```bash
# binaries that allow shell escape or arbitrary command execution when run as SUID
gtfobins_list="find vim vi nano perl python python3 ruby awk gawk nawk mawk \
  bash sh ash dash ksh zsh less more man env tee tar curl wget lua php node"

find / -type f -perm -4000 2>/dev/null | while read f; do
    name=$(basename "$f")
    for b in $gtfobins_list; do
        if [ "$name" = "$b" ]; then
            echo "GTFOBins SUID match: $f"
        fi
    done
done
```

Most Linux distributions do not ship these binaries with SUID. Findings here are
post-installation changes: application installers, misconfigured provisioning scripts, or
manual additions. Each finding warrants a check of who owns the binary and when the
permission was last modified (`stat -c "%y %U" <path>`).

## sudoers misconfiguration scan

Hypothesis: sudo rules allow a lower-privileged user to execute commands that permit
shell escape or arbitrary file access.

Data source: /etc/sudoers and /etc/sudoers.d/.

```bash
# parse all sudo rules; flag NOPASSWD, unrestricted ALL, wildcard arguments
grep -h -v '^[[:space:]]*#\|^$\|^Defaults' \
  /etc/sudoers /etc/sudoers.d/* 2>/dev/null | \
  grep -v 'Cmnd_Alias\|User_Alias\|Host_Alias\|Runas_Alias' | \
  while IFS= read -r line; do
    flag=""
    echo "$line" | grep -q 'NOPASSWD'          && flag="$flag NOPASSWD"
    echo "$line" | grep -qE '\(ALL.*\).*ALL'    && flag="$flag UNRESTRICTED"
    echo "$line" | grep -qF '*'                 && flag="$flag WILDCARD"
    [ -n "$flag" ] && echo "[$flag ] $line"
  done

# separately flag env_keep preserving LD_PRELOAD or LD_LIBRARY_PATH
grep -h 'env_keep' /etc/sudoers /etc/sudoers.d/* 2>/dev/null | \
  grep -i 'LD_PRELOAD\|LD_LIBRARY'
```

NOPASSWD entries warrant documentation of purpose and a check that the account is still
active and scoped. Wildcard argument rules merit review of the permitted binary against
GTFOBins: if the binary appears there, the rule may allow unrestricted escalation
regardless of the intended scope.

## Capability audit

Hypothesis: a binary or running process holds Linux capabilities beyond its functional
requirement, allowing privilege escalation without a SUID bit.

Data source: filesystem and /proc.

```bash
# file capabilities: binaries with elevated capabilities
getcap -r / 2>/dev/null | \
  grep -E 'cap_setuid|cap_sys_ptrace|cap_dac_override|cap_sys_admin|cap_net_raw'
```

```bash
# process capabilities: find running processes with elevated effective capability sets
# CapEff in /proc/<pid>/status is a hex bitmask
# cap_setuid = bit 7 (0x80), cap_sys_admin = bit 21 (0x200000)
# cap_sys_ptrace = bit 19 (0x80000), cap_dac_override = bit 1 (0x2)

for status in /proc/[0-9]*/status; do
    capeff=$(grep '^CapEff:' "$status" 2>/dev/null | awk '{print $2}')
    [ -z "$capeff" ] && continue
    capval=$((16#$capeff))
    if (( (capval & 0x80) != 0 || (capval & 0x200000) != 0 )); then
        pidnum=$(echo "$status" | grep -oP '\d+')
        comm=$(cat "/proc/$pidnum/comm" 2>/dev/null)
        user=$(stat -c '%U' "/proc/$pidnum" 2>/dev/null)
        printf 'pid=%-6s comm=%-20s user=%-15s CapEff=%s\n' \
          "$pidnum" "$comm" "$user" "$capeff"
    fi
done
```

cap_setuid on a Python or Perl interpreter is functionally equivalent to a SUID root
shell. cap_sys_admin on any process inside a container is a container escape precondition.
Either finding from a process running as a non-root user, outside an expected service
context, is worth immediate investigation.

## Container escape precondition check

Hypothesis: a container is running with configuration that allows escape to the host.

Run from inside the container to assess the escape surface:

```bash
# confirm container context
if [ -f /.dockerenv ] || grep -q 'docker\|lxc\|containerd' /proc/1/cgroup 2>/dev/null; then
    echo "[context] running inside container"
fi

# privileged mode: cap_sys_admin present in effective capabilities
capeff=$(grep '^CapEff:' /proc/self/status | awk '{print $2}')
capval=$((16#$capeff))
if (( (capval & 0x200000) != 0 )); then
    echo "[HIGH] cap_sys_admin present: container likely running --privileged"
fi

# Docker socket exposure
if [ -S /var/run/docker.sock ]; then
    echo "[HIGH] Docker socket accessible: host daemon reachable from container"
fi

# writable cgroup release_agent
agent=$(find /sys/fs/cgroup -name release_agent 2>/dev/null | head -1)
if [ -n "$agent" ] && [ -w "$agent" ]; then
    echo "[HIGH] cgroup release_agent writable: $agent"
fi

# host PID namespace sharing
host_pid=$(readlink /proc/1/ns/pid 2>/dev/null)
self_pid=$(readlink /proc/self/ns/pid 2>/dev/null)
[ -n "$host_pid" ] && [ "$host_pid" = "$self_pid" ] && \
  echo "[HIGH] sharing host PID namespace"

# host network namespace sharing
host_net=$(readlink /proc/1/ns/net 2>/dev/null)
self_net=$(readlink /proc/self/ns/net 2>/dev/null)
[ -n "$host_net" ] && [ "$host_net" = "$self_net" ] && \
  echo "[HIGH] sharing host network namespace"

# sensitive host path mounts
mount | awk '{print $3}' | grep -E '^/etc$|^/var/run$|^/proc$|^/sys$' | \
  while read mp; do echo "[MEDIUM] host path mounted at $mp"; done
```

Any HIGH flag is a concrete escape path. Privileged mode and Docker socket exposure are
the most frequently observed. Cgroup release_agent writability and host
namespace sharing appear more often in older Kubernetes node configurations and
development environments where isolation was relaxed for convenience.
Last updated: 26 May 2026
