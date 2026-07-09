# Log reading commands

Operational runbook. A reference for the commands used to read and search server logs during an investigation. For what the patterns in those logs mean, see [reading server logs](../reading-logs.md); this page is the command set to get at them.

## When to use

During a [log review](../reading-logs.md), an incident investigation, or any time a specific event needs to be found in the logs. Useful alongside the analytical pages, which describe what to look for once the log is open.

## Reading a log

`less` opens a file and allows scrolling:

```
less /var/log/syslog
```

Space pages down, arrow keys move a line at a time, `Shift+G` jumps to the end (the most recent entries), `/pattern` searches forward. `q` quits.

For a compressed, rotated log, `zless` opens it without unpacking it first.

## Searching

`grep` finds matching lines. To pull every entry for one address and save it:

```
grep "user@example.com" /var/log/mail.log > /tmp/result.txt
```

`zgrep` searches compressed logs, useful across rotated files:

```
zgrep -i error /var/log/syslog.*.gz
```

## Watching live

`tail -f` follows a log as new lines arrive, useful during an active investigation:

```
tail -f -n 20 /var/log/syslog
```

The `-n 20` shows the last 20 lines first, then follows. `Ctrl+C` stops.

## Login history

`last` reads the login record:

```
last                    # recent logins
last | grep adminuser   # one account's login history
last reboot             # when the system restarted
```

`lastb` reads the failed-login record (`/var/log/btmp`), which is where brute-force attempts show up:

```
sudo lastb
```

## Kernel messages

`dmesg` shows the kernel ring buffer, useful for hardware and driver events:

```
dmesg | less
```

## On a possibly compromised system

The commands above read the logs on the local disk. A root-level attacker can edit or delete those logs, so a clean local result does not prove much on a compromised host. Logs already shipped to a [centralised destination](centralised-logging.md) are the more trustworthy source. Treat local-only logs on a suspect machine as potentially incomplete.

## Follow-up

- For the patterns worth searching for and what they indicate, see [reading server logs](../reading-logs.md).
- For getting logs off the server so they survive a compromise, see [centralised logging](centralised-logging.md).
Last updated: 29 May 2026
