# Behavioural detection

Behavioural detection identifies attacks by what they do, not what they look like.
It is the primary detection mechanism for modern evasion techniques, and it is also
the primary source of alert fatigue.

## How EDR behavioural detection works

EDR products instrument the operating system at multiple levels to observe process
behaviour:

Kernel callbacks capture process creation, thread creation, image loads, and registry
changes. Every process creation event is recorded with parent-child relationship,
command line, and image path.

ETW (Event Tracing for Windows) provides structured telemetry from the CLR,
PowerShell, WMI, network stack, and other subsystems. Script block content, assembly
loads, and WMI query activity are visible here.

Userland API hooking intercepts calls to sensitive Windows API functions before they
reach the kernel, allowing the EDR to inspect arguments and block or alert.

These data streams are correlated in real time and against historical baselines to
identify sequences that match known attack techniques.

## What works

Suspicious process ancestry is a reliable signal. The following parent-child
relationships are rarely legitimate:

```text
Word.exe          → PowerShell.exe, cmd.exe, wscript.exe
Outlook.exe       → PowerShell.exe, cmd.exe
mshta.exe         → cmd.exe, PowerShell.exe
wmic.exe          → cmd.exe, PowerShell.exe
regsvr32.exe      → network connection
certutil.exe      → network connection
svchost.exe (user session) → cmd.exe or PowerShell.exe
```

Specific command line patterns remain reliable for less-sophisticated attackers:

```text
# common indicators
powershell -enc               # base64-encoded command
powershell -nop -w hidden     # hidden execution
iex (Invoke-Expression)       # download and execute
DownloadString, DownloadData  # in-memory download
-bypass ExecutionPolicy       # bypassing script execution policy
```

Living-off-the-land via high-risk binaries is well-covered by most EDR products:

- `certutil` making outbound connections
- `mshta` executing remote content
- `regsvr32` loading remote SCT files
- `wmic` spawning processes

## Alert fatigue: where it breaks down

Behavioural rules that are too broad generate alerts on legitimate administrative
activity. When every PowerShell script that IT runs generates an alert, analysts learn
to dismiss PowerShell alerts. This is the exploitation the attacker relies on.

The solution is baseline: alerts that are relative to what is normal for the specific
user and system are far more actionable than absolute rules. An alert for "PowerShell
with encoded command" is low value; an alert for "PowerShell with encoded command
from a user who has never previously run PowerShell" is high value.

UEBA (User and Entity Behaviour Analytics) systems maintain per-user and per-system
baselines and alert on deviation rather than absolute behaviour. This significantly
reduces false positive rates for LoLbin and script-based attacks while maintaining
sensitivity.

## Tuning detection rules

Effective behavioural detection requires tuning to the specific environment:

```yaml
# example Sigma rule: PowerShell encoded command from unusual parent
title: PowerShell Encoded Command from Office Application
status: stable
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    ParentImage|endswith:
      - '\WINWORD.EXE'
      - '\EXCEL.EXE'
      - '\OUTLOOK.EXE'
    CommandLine|contains: ' -enc '
  condition: selection
falsepositives:
  - Legitimate automation from office applications (rare; document if present)
level: high
```

Rules that generate more than 5-10 false positives per analyst per week are effectively
disabled by alert fatigue. Tune aggressively, document exclusions, and review quarterly.

## Detection gaps for modern evasion

Fileless execution: an encoded PowerShell command that downloads and runs a script
entirely in memory may not match any file-based rule. Script block logging (Event ID
4104) captures the executed content but requires that AMSI is not bypassed.

Direct syscalls: userland API hooks are bypassed, removing the EDR's ability to
inspect arguments to sensitive functions. Kernel callback telemetry still fires, but
without the argument context that userland hooks provide.

BYOVD with callback removal: kernel callbacks are removed, eliminating process
creation and image load telemetry. The EDR continues running but sees nothing. This
is the most significant gap in current behavioural detection.

Slow and low: an attacker who runs one or two commands per day, spaced to look like
normal admin activity, may never produce a single alert. Dwell time in these cases
is measured in months. Detection requires long-term correlation and anomaly analysis
across extended time windows.
