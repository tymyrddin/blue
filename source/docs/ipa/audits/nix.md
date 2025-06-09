# Checking Linux, Unix or BSD systems for spyware and remote access

These systems have a reputation for being secure and private — but they can still be abused. If you’re supporting 
someone who uses (or has been given) a Linux or BSD computer, this guide helps you check for tampering without needing 
a computer science degree.

This applies to systems like Ubuntu, Debian, Linux Mint, Manjaro, Fedora, FreeBSD, and similar.

---

## 1. Check for remote access software

The first thing to check is whether someone else has set up remote control tools — often disguised as helpful tech.

To check for common remote tools, open the Terminal (usually Ctrl+Alt+T or found in the menu), and type:

```bash
ps aux | grep -E 'teamviewer|anydesk|vnc|ssh'
```

Look out for:

* `teamviewer`
* `anydesk`
* `x11vnc` or `tightvnc`
* `sshd` (if running for an unknown user)

If you see anything like that running, and **you didn’t install it**, it’s a red flag. Make a note of what you find. 
You can then stop it temporarily by running (replace `toolname`):

```bash
sudo systemctl stop toolname
```

*But don’t uninstall yet — it might be evidence.*

## 2. Review which apps start automatically

Spyware often runs silently at login. Here's how to check.

**On most Linux desktops:**

1. Open **Startup Applications** or **Session & Startup** in the system settings.
2. Look for any unfamiliar items, especially anything with:

   * Random names (e.g., `helper.sh`, `sys_monitor`)
   * Terminal commands
   * Network tools

*You can disable these with a click — they won’t start next time. Don’t delete them straight away if unsure.*

**On BSD or command-line systems:**

Check your `.profile`, `.bashrc`, or `.xinitrc` files in your home folder for anything you didn’t add.

```bash
nano ~/.bashrc
```

Look for strange lines like:

```bash
nohup script.sh &
```

*If it’s logging keystrokes or connecting out to the internet, you’ll often spot something like that here.*

## 3. Look for suspicious user accounts

Abusers may create hidden user accounts to keep remote access open.

To list all user accounts, open a terminal and type:

```bash
cut -d: -f1 /etc/passwd
```

You’ll see a list. Most will be system accounts (like `daemon`, `syslog`, `root`), but look out for extra usernames you don’t recognise.

To remove a suspicious user (only if you're sure), you can run:

```bash
sudo deluser username
```

*Again, take notes or screenshots before deleting — this might be useful later.*

## 4. Check for suspicious network behaviour

If you’re concerned that the device is talking to someone it shouldn’t:

Run this in the terminal:

```bash
netstat -tulnp
```

Or, for a simpler view:

```bash
ss -tunap
```

Look for unfamiliar external connections — especially anything marked `ESTABLISHED` that isn't from your browser, 
updates, or known apps.

If it lists a remote IP address you don't recognise, it could be a remote session or spyware.

You can use:

```bash
who
```

to see if someone else is currently logged in.

## 5. Use ClamAV to scan for malicious files

Linux malware is rare — but not unheard of. ClamAV is one of the few scanning tools available for Linux/BSD.

To install and use it:

```bash
sudo apt install clamav -y
sudo freshclam
sudo clamscan -r --bell -i /
```

This scans the whole system and lists any infected files.

*It can take some time — but it’s thorough.*

---

## Notes

Linux, Unix and BSD machines may seem obscure, but they’re sometimes used in abusive contexts precisely *because* they’re harder to understand. If someone’s ex-partner “helped” them set up a system like this, it’s worth giving it a closer look.

Take screenshots or photos of anything suspicious before removing it. Better yet, ask a trusted tech person to review it if possible.
