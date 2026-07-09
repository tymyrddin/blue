# Checking running processes

Malware often hides inside legitimate-looking processes, running quietly in the background. Checking
what is actually running is one of the few ways to detect activity that bypasses other controls.

## Windows: Task Manager

Open Task Manager (Ctrl+Shift+Esc or Ctrl+Alt+Del, then Task Manager).

1. Click the CPU or Memory column header to sort by usage.
2. Look for:
   * Unknown processes consuming significant resources.
   * Many instances of the same process name (`svchost.exe` with dozens of entries is unusual).
   * Names that imply legitimacy without it (`update_helper.exe`, `windows_service.exe`).
3. Right-click a suspicious process and select End Task.

Useful additions:

* Check the Startup tab and disable anything unrecognised that launches at boot.
* Microsoft's Process Explorer provides more detail than the built-in Task Manager and is worth downloading.

## Mac: Activity Monitor

Open Activity Monitor (Finder → Applications → Utilities).

Sort by CPU, Energy Impact, or Memory depending on what behaviour is being investigated.

Look for:

* Processes running that are unfamiliar.
* High Energy Impact when the machine is sitting idle.
* WindowServer consuming unusually high CPU (a possible screen-recording indicator).

Double-click a process and select Quit, or use `sudo kill -9 [PID]` in Terminal for resistant processes.

Additional checks:

* `top` in Terminal shows real-time process activity.
* `/Library/LaunchAgents/` may contain hidden startup scripts.

## Linux: htop

Install htop if not already present:

```bash
sudo apt install htop  # Debian/Ubuntu
sudo dnf install htop  # Fedora
```

Run `htop` and look for:

* Processes claiming to be `systemd` that are not running as root.
* Unknown scripts running as the current user (e.g., `./.config/updater`).
* Unexplained high CPU usage from processes with names like `minerd`.

To investigate a process: `ps aux | grep [process name]`

Check persistence locations:

* `crontab -l` lists scheduled tasks for the current user
* `systemctl list-units --type=service --state=running` lists active services
* `ls ~/.config/autostart/` shows user-level autostart entries

## Signs worth investigating

* Unknown processes using more than 20% CPU with no obvious cause
* Dozens of identical process names
* Unusual outbound network connections (check firewall logs)
* Files in `C:\Users\[You]\AppData\Local\Temp` running as programs
* Processes named after common applications running when those applications are closed
Last updated: 16 May 2026
