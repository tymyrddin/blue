# Filesystem integrity

| Technique	         | Implementation	              | Example                                  |
|--------------------|------------------------------|------------------------------------------|
| Inotify Watches	   | Real-time file changes	      | `inotifywait -m /etc`                    |
| SUID/SGID Hunting	 | Find privileged executables	 | `find / -perm -4000 -type f 2>/dev/null` |
| Immutable Files	   | Protect critical configs	    | `chattr +i /etc/passwd`                  |

