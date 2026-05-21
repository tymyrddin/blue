# Server audit commands

A server audit covers configurations, logs, permissions, and vulnerabilities across the operating system. Below is a checklist for the six most widely used server platforms.

## Linux (Ubuntu, CentOS, RHEL, Debian)

### User & Permissions

```
cat /etc/passwd
# Lists all local user accounts. Look for unexpected system users or accounts with shell access they do not need.

cat /etc/shadow
# Shows password hashes. Readable only by root. World-readable shadow files expose password hashes to all users.

sudo -l
# Lists what commands the current user can run with sudo. Useful for spotting privilege escalation paths.

ls -la /home/
# Checks home directory permissions. World-readable home directories expose personal files to all users on the system.
```

### SSH & Network Security

```
ss -tulnp
# Displays listening sockets and associated services. Unexpected services are worth investigating.

grep "PermitRootLogin" /etc/ssh/sshd_config
# Checks whether root login over SSH is permitted. Permitting it is a significant exposure.

journalctl -u sshd
# SSH logs. Look for repeated failures, unusual login times, or connections from unexpected sources.
```

### System Integrity

```
rpm -Va
# (RHEL/CentOS) Verifies package files against the package database. Modified binaries indicate unauthorised changes.

debsums -a
# (Debian/Ubuntu) Same purpose: checks system files against their expected checksums.

crontab -l
# Lists scheduled tasks. Useful for identifying scripts scheduled to run outside business hours.

sudo lynis audit system
# Comprehensive security audit with detailed recommendations. Covers a wide range of configuration checks.
```

### Logging & Monitoring

```
tail -f /var/log/auth.log
# Live stream of login attempts and sudo use. Useful during an active investigation.

df -h
# Disk usage. A full filesystem can prevent logging and cause service failures.

top
# Real-time CPU and memory usage. High utilisation from an unexpected process is worth investigating.
```

## Windows Server (2019/2022)

### User & Group Policies

```
Get-LocalUser
# Lists local user accounts. Look for dormant accounts or accounts with unexpected permissions.

Get-LocalGroupMember Administrators
# Shows who has local administrator access. Worth reviewing for accounts that no longer need it.

gpedit.msc
# Opens Group Policy Editor. Check password policies, account lockout settings, and the status of security software.
```

### Security & Services

```
Get-Service | Where-Object {$_.Status -eq "Running"}
# Lists running services. Look for unrecognised or third-party services not in the expected inventory.

Get-NetFirewallRule | Select Name,Enabled
# Displays all firewall rules. Disabled rules are often the ones that reveal past workarounds.

auditpol /get /category:*
# Shows audit policy settings. Identifies what is and is not being logged.
```

### Logs & Event Tracking

```
# Event Viewer -> Security logs
# Review login attempts, policy changes, and privilege use.

Get-WinEvent -LogName "Microsoft-Windows-PowerShell/Operational"
# Logs PowerShell activity. Useful for spotting scripts run outside normal operations.
```

### Patch & Vulnerability Management

```
wmic qfe list
# Lists installed Windows updates. A sparse list indicates the system is behind on patches.

Invoke-WebRequest -Uri "https://example.com/script.ps1" -OutFile "script.ps1"
# Check user downloads for scripts retrieved from external sources.
```

## macOS Server (Monterey & later)

### User & File Permissions

```
dscl . list /Users
# Lists all user accounts, including service accounts that may have accumulated over time.

sudo ls -la /Users/
# Checks home directory visibility. World-readable home directories carry the same risk as on Linux.
```

### Security & Remote Access

```
sudo systemsetup -getremotelogin
# Shows whether SSH remote login is enabled.

sudo defaults read /Library/Preferences/com.apple.loginwindow
# Reveals login policies. Look for auto-login or other settings that reduce authentication requirements.
```

### Logs & System Integrity

```
log show --predicate 'eventMessage contains "Failed"'
# Shows failed authentication events. A high volume may indicate a brute-force attempt.

csrutil status
# System Integrity Protection status. Disabled SIP removes a significant OS-level protection.
```

## FreeBSD

### User & Access Control

```
cat /etc/passwd
# List users and check for accounts with shell access that no longer need it.

sudo pkg audit
# Checks installed packages against known vulnerabilities. Worth running regularly.
```

### Network & Firewall

```
sockstat -l
# Shows listening network sockets. Useful for identifying exposed services.

ipfw list
# Lists firewall rules (if IPFW is used). Look for overly permissive rules or gaps in coverage.
```

### Logs & Jail Security

```
tail -f /var/log/auth.log
# Authentication logs. Useful for spotting login attempts and sudo use.

jls
# Lists running jails (FreeBSD's lightweight virtualisation). Verify the inventory matches expectations.
```

## AIX (IBM Unix)

### User & Permissions

```
lsuser -a ALL
# Lists all user account attributes. Useful for checking unusual privilege assignments.

lssec -f /etc/security/user -s default
# Reviews system-wide password policies. Short minimum lengths or absent expiry are worth flagging.
```

### System & Logs

```
lssrc -a
# Shows all active subsystems and services. Look for services that are running unexpectedly.

errpt -a
# Detailed error log. Verbose, but useful for catching hardware or OS-level issues.
```

## Solaris (Oracle)

### User & Security

```
cat /etc/passwd
# List users. Accounts with /bin/bash access that do not need it are worth reviewing.

auths list
# Shows assigned authorisations. Helps identify users with permissions beyond their role.
```

### Network & Logs

```
netstat -an
# Lists open ports and listening interfaces.

svcs -a
# Lists all SMF services. Verify the running set matches the expected inventory.
```
