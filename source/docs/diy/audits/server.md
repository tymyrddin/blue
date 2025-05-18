# Server audit commands

A server audit ensures security, compliance, and performance by reviewing configurations, logs, permissions, and vulnerabilities. Below is a step-by-step checklist (with comments) for auditing the 6 most widely used server operating systems.

## Linux (Ubuntu, CentOS, RHEL, Debian)

### User & Permissions

```
cat /etc/passwd
# Lists all local user accounts. Look out for unexpected system users or shell access granted to accounts that shouldn’t have it.

cat /etc/shadow
# Shows password hashes. Only root should read this. If it's world-readable, start panicking.

sudo -l
# Lists what commands the current user can run with sudo. Good for spotting privilege escalation risks.

ls -la /home/
# Checks home directory permissions — world-readable home folders are an open invitation to nosey neighbours.
```

### SSH & Network Security

```
ss -tulnp
# Displays listening sockets and their associated services. Anything unexpected here could be a backdoor with a welcome mat.

grep "PermitRootLogin" /etc/ssh/sshd_config
# Checks if root login over SSH is allowed. It shouldn’t be. Really.

journalctl -u sshd
# SSH logs. Look for repeated failures, odd login times, or mysterious IPs from parts of the internet that rarely mean well.
```

### System Integrity

```
rpm -Va
# (RHEL/CentOS) Verifies package files for changes. Modified binaries are a sign something (or someone) has been fiddling.

debsums -a
# (Debian/Ubuntu) Same idea — ensures system files match the originals.

crontab -l
# Lists scheduled tasks. Great for spotting sneaky scripts that run at 3am.

sudo lynis audit system
# Runs a full audit with security suggestions. Think of it as a very judgy system health check.
```

### Logging & Monitoring

```
tail -f /var/log/auth.log
# Live stream of login attempts and sudo use. Very handy when someone’s poking about.

df -h
# Disk usage. Because nothing breaks faster than a server with 100% disk.

top
# Real-time CPU and memory usage. A mystery process eating 99% of CPU? That’s your clue.
```

## Windows Server (2019/2022)

### User & Group Policies

```
Get-LocalUser
# Lists local user accounts. Handy for spotting dormant or rogue accounts.

Get-LocalGroupMember Administrators
# Shows who has admin access. Spoiler: it’s often more people than you’d like.

gpedit.msc
# Opens Group Policy Editor. Check for password policies, account lockout settings, and whether someone’s disabled Windows Defender *again*.
```

### Security & Services

```
Get-Service | Where-Object {$_.Status -eq "Running"}
# Lists running services. Look for anything unusual — especially third-party services that don’t belong.

Get-NetFirewallRule | Select Name,Enabled
# Displays all firewall rules. Disabled rules are often the interesting (and worrying) ones.

auditpol /get /category:*
# Shows audit policy settings. Crucial for knowing what gets logged — and what doesn’t.
```

### Logs & Event Tracking

```
# Event Viewer → Security logs
# Use GUI to review login attempts, policy changes, and other delightful surprises.

Get-WinEvent -LogName "Microsoft-Windows-PowerShell/Operational"
# Logs PowerShell activity. If you didn’t write that script, best find out who did.
```

### Patch & Vulnerability Management

```
wmic qfe list
# Lists installed Windows updates. If this comes back nearly empty, someone's fallen asleep at the patch wheel.

Invoke-WebRequest -Uri "https://example.com/script.ps1" -OutFile "script.ps1"
# Check user downloads for suspicious scripts. Just because it’s got “example.com” doesn’t mean it’s friendly.
```

## macOS Server (Monterey & later)

### User & File Permissions

```
dscl . list /Users
# Lists all user accounts, including forgotten admin accounts from five years ago.

sudo ls -la /Users/
# Checks home directory visibility. Same concern as Linux — nosy users and world-readable folders.
```

### Security & Remote Access

```
sudo systemsetup -getremotelogin
# Tells you if SSH is enabled. If you didn’t know it was on, that’s a red flag.

sudo defaults read /Library/Preferences/com.apple.loginwindow
# Reveals login policies. Look for auto-login or insecure settings.
```

### Logs & System Integrity

```
log show --predicate 'eventMessage contains "Failed"'
# View failed login attempts. Expect a few fat-fingered errors — or a brute-force attack.

csrutil status
# System Integrity Protection. Should be enabled unless you've got a good reason (and no, "because I was bored" isn’t it).
```

## FreeBSD

### User & Access Control

```
cat /etc/passwd
# Same as Linux — list users and check for dodgy shell access.

sudo pkg audit
# Checks installed packages against known vulnerabilities. Worth running regularly.
```

### Network & Firewall

```
sockstat -l
# Shows listening network sockets. Quick way to check what’s exposed to the world.

ipfw list
# Lists firewall rules (if IPFW is used). Look for gaps wide enough to drive a lorry through.
```

### Logs & Jail Security

```
tail -f /var/log/auth.log
# Auth logs. Essential for spotting login attempts and sudo use.

jls
# Lists running jails (FreeBSD’s lightweight virtualisation). Make sure no one’s hiding in them.
```

## AIX (IBM Unix)

### User & Permissions

```
lsuser -a ALL
# Lists all user account attributes. Good for checking odd privileges.

lssec -f /etc/security/user -s default
# Reviews system-wide password policies. If users are allowed 3-character passwords, you’ve got work to do.
```

### System & Logs

```
lssrc -a
# Shows all active subsystems/services. Look out for ones that shouldn’t be running.

errpt -a
# Lists detailed error logs. Very verbose, very IBM — but useful for catching hardware or OS-level issues.
```

## Solaris (Oracle)

### User & Security

```
cat /etc/passwd
# Yes, again — still relevant. Users with `/bin/bash` access can do damage.

auths list
# Shows assigned authorisations. Helps spot if users have permissions they shouldn’t.
```

### Network & Logs

```
netstat -an
# Lists open ports and listening interfaces. Because Solaris likes to whisper its secrets quietly.

svcs -a
# Lists all SMF services. If a malicious service is running, it’ll probably be here — pretending to be helpful.
```