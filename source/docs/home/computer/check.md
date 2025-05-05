# Task Manager/Activity Monitor: Your Malware Nightclub Bouncer

Your computer is like a VIP club—some processes belong, others are just there to cause trouble. Malware loves to 
sneak in, disguise itself, and party in the background while stealing your data or mining crypto. Here’s how to 
spot and kick out the troublemakers before they wreck the place.

## Windows: Ctrl+Shift+Esc (The "Who Let This In?" check)

1. Open Task Manager (Ctrl+Shift+Esc or Ctrl+Alt+Del → Task Manager).
2. Click the CPU or Memory column to sort by usage.
3. Look for:
   * Unknown processes hogging resources (e.g., `BonziBuddy.exe`—yes, that purple gorilla malware still exists).
   * `svchost.exe` with 50+ instances (legit Windows processes don’t need an army).
   * Weird names like `update_helper.exe` (real updates don’t hide).
4. Right-click → End Task on anything suspicious.

Tip:

* Check the "Startup" tab—disable anything sketchy launching at boot.
* Use Process Explorer (Microsoft’s advanced tool) for deeper checks.

## Mac: Activity monitor (The "Why Is My Fan Screaming?" tool)

1. Open Activity Monitor (Finder → Applications → Utilities).
2. Sort by:
   * CPU (for mining malware)
   * Energy Impact (for battery-draining pests)
   * Memory (for data-hungry spyware)
3. Look for:
   * Processes you don’t recognize (e.g., kworker going wild).
   * High "Energy Impact" when you’re not doing anything.
   * "WindowServer" using too much CPU (could be a screen recorder).
4. Double-click → Quit (or `sudo kill -9 [PID]` in Terminal for stubborn malware).

Tip:

* Use `top` in Terminal for real-time process tracking.
* Check `/Library/LaunchAgents/` for hidden startup scripts.

## Linux: htop (The "This isn’t systemd, liar!" Checker)

1. Install htop (if you don’t have it):

```bash
sudo apt install htop  # Debian/Ubuntu
sudo dnf install htop  # Fedora
```

2. Run `htop` (or `top` if you’re old-school) and look for:
   * Processes pretending to be systemd (real ones run as root).
   * Unknown scripts running as your user (e.g., `./.config/updater`).
   * High CPU/memory usage from something like minerd (crypto miner red flag).
3. Highlight → F9 → `SIGKILL` to nuke it.

Tip:

* Use `ps aux | grep [suspect]` to trace process origins.
* Check `crontab -l` for malicious scheduled tasks.

## The "Definitely Malware" checklist

* Unknown processes using >20% CPU for no reason.
* Dozens of identical processes (like `svchost.exe` spam).
* Weird network activity (check your firewall logs).
* Files in `C:\Users\[You]\AppData\Local\Temp` running as programs.
* "Google Update" running when Chrome isn’t open (classic malware disguise).

## Why this matters in 2025

* Fileless malware runs in memory, avoiding detection—Task Manager is your last line of defense.
* Crypto miners drain your CPU silently—catch them before your PC sounds like a jet engine.
* Spyware hides behind fake "Windows Update" processes—always verify.

TL;DR: Be the bouncer. If a process can’t explain why it’s there, kick it out. 🔥