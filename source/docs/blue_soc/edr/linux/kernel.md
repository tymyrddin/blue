# Kernel-level monitoring

| Technique                     | 	Description	              | Tools                               |
|-------------------------------|----------------------------|-------------------------------------|
| eBPF Hooks	                   | Real-time syscall tracing	 | `bpftrace`, Falco                   |
| Auditd Rules	                 | Custom event logging	      | `auditctl -a always,exit -S execve` |
| LSM (Linux Security Modules)	 | Mandatory Access Control	  | SELinux (`sestatus`), AppArmor      |

