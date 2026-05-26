# Linux endpoint detection and response

Linux EDR typically uses eBPF programs for kernel-space telemetry, auditing subsystems, and process lineage
tracking through `/proc` monitoring. Container-aware monitoring covers namespace crossings and pod-to-pod
communications in orchestrated environments. The main detection areas are privilege escalation (SUID binaries,
capability abuse), persistence (cron jobs, systemd services), and memory-only malware or kernel rootkits.

## Kernel-level monitoring

| Technique                    | Description               | Tools                               |
|------------------------------|---------------------------|-------------------------------------|
| eBPF hooks                   | Real-time syscall tracing | `bpftrace`, Falco                   |
| Auditd rules                 | Custom event logging      | `auditctl -a always,exit -S execve` |
| LSM (Linux Security Modules) | Mandatory access control  | SELinux (`sestatus`), AppArmor      |

## Filesystem integrity

| Technique         | Implementation                   | Example                                  |
|-------------------|----------------------------------|------------------------------------------|
| Inotify watches   | Real-time file change monitoring | `inotifywait -m /etc`                    |
| SUID/SGID hunting | Find privileged executables      | `find / -perm -4000 -type f 2>/dev/null` |
| Immutable files   | Protect critical configs         | `chattr +i /etc/passwd`                  |

## Container security

Runtime container monitoring:

```bash
docker exec <container> ps aux
sudo sysdig -c spy_users
```

## Threat hunting with open source

| Tool    | Purpose                    | Command example                   |
|---------|----------------------------|-----------------------------------|
| Osquery | SQL-based endpoint queries | `SELECT * FROM process_events`    |
| Falco   | Behavioural detection      | `falco -r rules/falco_rules.yaml` |
| Lynis   | Compliance auditing        | `lynis audit system`              |
