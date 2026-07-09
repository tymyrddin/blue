# Device forensic check

The instinct when something feels wrong is to shut the device down. This stops the activity,
which is sometimes the right choice. It also destroys evidence of what was happening, which
makes understanding it significantly harder. If you plan to report the incident, leave the
device running and document everything: screenshots, case numbers, timestamps.

The commands below capture active network connections at the moment you run them. What they
show is a list of processes communicating with external addresses. Some will be immediately
recognisable: cloud sync, update services, the browser. Others will not.

## Windows

Open Command Prompt as administrator and run:

```
netstat -ano | findstr ESTABLISHED
```

This lists active connections with the process ID (PID) attached. To identify what process
owns a PID:

```
tasklist /FI "PID eq [PID]"
```

Replace `[PID]` with the number from the netstat output. Look for processes with names that
resemble common system processes but are running from unusual directories, or that appear to
be communicating with IP addresses you cannot account for.

## Mac

Open Terminal and run:

```
lsof -i
```

For active connections only:

```
lsof -i | grep ESTABLISHED
```

The output shows the process name, PID, and remote address. Look for application names
with no corresponding open window, or connections to addresses in locations that have no
obvious relationship to software you use.

To investigate a specific process: `ps aux | grep [process name]`

## Linux

```
ss -tnp
```

Or, if `ss` is not available:

```
netstat -tnp
```

Both show active connections with process names. Additional:

```
lsof -i | grep ESTABLISHED
```

```
ps aux | grep [suspicious process name]
```

## Making sense of the output

Most people have never looked at their active connections before. The first time is
disorienting: there are more than expected, and many belong to background services that are
entirely normal. Running this check during a quiet period, before an incident, is worth doing
so you know what your baseline looks like. What does not fit the baseline is the signal.

For anything unfamiliar: paste the IP address into [VirusTotal](https://www.virustotal.com)
or run a whois lookup. Identify the owning process. Check where that executable sits on disk.
A legitimate process in an unexpected directory is worth investigating. A connection to a
major cloud provider is not automatically benign.

Document what you find acting on each item immediately. The pattern matters more
than any single connection.

Save output to a file for reporting:

* Windows: `netstat -ano > connections.txt`
* Mac/Linux: `lsof -i > connections.txt`
