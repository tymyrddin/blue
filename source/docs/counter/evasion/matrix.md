# Evasion technique coverage matrix

A reference for which detection layers cover which attacker techniques. The table reflects
typical deployments; a minimally configured SIEM or an NDR with no baselining will perform
worse than the "Detects" entries suggest. Conversely, a mature deployment with deep tuning
may detect techniques listed as "Blind" through correlation with adjacent signals.

Cell values: `Detects` means a reliable primary signal exists with standard deployment.
`Partial` means a signal exists with significant caveats (see notes below the table).
`Blind` means no reliable signal in this layer under normal deployment conditions.

| Technique | EDR | SIEM | Network | Identity/UEBA | Cloud |
|-----------|-----|------|---------|---------------|-------|
| Fileless execution | Partial | Partial | Blind | Blind | Blind |
| BYOVD | Blind | Partial | Blind | Blind | Blind |
| LOLBin abuse | Detects | Detects | Partial | Blind | Blind |
| Direct syscalls | Partial | Partial | Blind | Blind | Blind |
| Process injection | Detects | Detects | Blind | Blind | Blind |
| DNS C2 | Blind | Blind | Detects | Blind | Blind |
| Cloud storage C2 | Blind | Partial | Partial | Partial | Detects |
| Steganographic C2 | Blind | Blind | Partial | Blind | Partial |
| Long-window / slow | Blind | Blind | Partial | Detects | Partial |
| Credential replay | Partial | Detects | Blind | Detects | Detects |
| LoTL persistence | Detects | Detects | Blind | Blind | Blind |

## Notes on partial entries

Fileless execution, EDR: Script block logging (Event ID 4104) captures PowerShell content if
AMSI is intact. An AMSI bypass defeats script block logging, leaving only process creation
events with the encoded command line but no decoded payload.

Fileless execution, SIEM: Depends on whether script block logging is enabled and AMSI is not
bypassed. The signal is upstream of the SIEM; if the EDR telemetry does not capture it, the
SIEM has nothing to correlate.

BYOVD, SIEM: A driver load event (Windows Event ID 7045, Sysmon Event ID 6) fires before
the callbacks are removed. After that, nothing. The window between the driver load and callback
removal is typically seconds; detection requires near-real-time alerting on driver loads.

LOLBin abuse, Network: Network connections from certutil, mshta, and bitsadmin are detectable
via Sysmon Event ID 3 (NetworkConnect) or NDR flow data. The payload content is encrypted; the
destination, timing, and the process making the connection are visible.

Direct syscalls, EDR: Kernel callbacks (process creation, thread creation, image load) still
fire. Userland API hooks, which provide argument-level visibility into sensitive calls,
are bypassed. The event fires; the context that makes it actionable may not.

Direct syscalls, SIEM: Process events log without the argument context that userland hooks
provide. Correlation with other events may still surface the technique.

Cloud storage C2, SIEM: Process creation events for rclone, aws-cli, or Azure CLI are
detectable if endpoint logging includes command lines. Upload volume anomalies require file
operation logging, which is not always enabled.

Cloud storage C2, Network: Upload volume to cloud endpoints and connection frequency to a
specific bucket are detectable at the NDR level without TLS inspection. TLS metadata
(SNI, certificate subject) may distinguish cloud storage API calls from browser traffic.

Cloud storage C2, Identity/UEBA: Outbound data volume baseline deviation is detectable if
the UEBA model tracks data transfer volume per identity, which many deployments do not.

Steganographic C2, Network: Upload/download asymmetry to image-hosting APIs and
semi-regular connection frequency to specific cloud buckets are detectable. LSB entropy
analysis of image content requires TLS interception and is expensive.

Steganographic C2, Cloud: API call patterns to cloud storage from unexpected process
contexts, and frequency anomalies against the account baseline, may surface in cloud
audit logs.

Long-window / slow, Network: Sustained low-volume outbound to a new destination and
gradual baseline deviation over weeks are detectable with NDR systems that maintain
long-term flow baselines. Point-in-time rules miss it; long-window statistical analysis
catches it.

Long-window / slow, Cloud: Gradual expansion of which cloud resources are accessed may
surface in cloud audit logs as first-access events for services not previously touched.

Credential replay, EDR: Pass-the-hash and pass-the-ticket generate authentication events
that can appear normal at the host level. The signal is present but requires correlation
with source IP and timing to distinguish from legitimate logon.

## Coverage by detection layer

### EDR and endpoint telemetry

EDR covers process-level behaviour: process creation with parent-child chain, command line
arguments, image loads, cross-process operations, and memory anomalies. It is the primary
detection layer for LOLBin abuse, process injection, and LoTL persistence mechanisms.

EDR is blind after BYOVD removes its kernel callbacks. It produces partial signal for
fileless and direct-syscall techniques where kernel callbacks fire but userland hook context
is missing.

Minimum deployment for reliable signal: Sysmon installed and configured to log process
creation (Event ID 1), network connections (Event ID 3), and process access (Event ID 10);
PowerShell script block logging enabled; AMSI enabled and not bypassed.

### SIEM and log correlation

The SIEM is the aggregation and correlation layer. It does not generate primary signals;
it correlates signals from EDR, authentication, and cloud logs across time windows and
identities.

Its value for evasion detection is in cross-event correlation: a sequence of driver load,
authentication from a new source, schema enumeration, and bulk object access, each of which
may fall below an individual alert threshold but together constitute an attack chain.

The SIEM is limited by what arrives in it. A BYOVD attack that removes EDR callbacks also
removes the telemetry stream the SIEM correlates. Network and identity events remain.

Minimum deployment: EDR telemetry, Windows Security event logs, authentication events from
identity provider, and cloud control plane logs all forwarding to the SIEM with retention
sufficient for the correlation window (typically 30-90 days for pattern detection).

### Network and NDR

Network detection is the primary layer for DNS C2, and a secondary layer for cloud storage
exfiltration and slow data egress. It operates independent of endpoint state: removing EDR
callbacks does not affect network visibility.

Its blindness to HTTPS content limits detection of cloud-based C2 and steganographic
techniques to metadata and behavioural signals (volume, frequency, destination concentration).

Minimum deployment: DNS query logging at the recursive resolver (not the endpoint); NetFlow
or connection logs from perimeter and internal segment boundaries; baselining per-host
outbound volume and destination profile over at least 30 days before anomaly alerting.

### Identity and UEBA

The identity layer (authentication logs, conditional access signals, and UEBA models) is
the primary detection surface for long-window attacks and credential replay.

It is blind to purely local techniques (fileless execution, process injection, LOLBin abuse)
that do not produce identity events. Its effectiveness for long-window detection depends
on the baseline period (30-60 days minimum) and ongoing model calibration.

Minimum deployment: authentication events from all identity providers (on-premises AD,
Entra ID, cloud IAM) forwarded to a UEBA system; a baseline period before scoring begins;
a suppression mechanism for known-legitimate anomalies (travel, incident response activity).

### Cloud control plane

Cloud audit logs (AWS CloudTrail, Azure Activity Log, GCP Cloud Audit Logs) record every
API call made to cloud services. They are the primary detection layer for cloud-native
attacks, cloud storage exfiltration, and privilege escalation via cloud IAM.

Cloud control plane visibility does not extend to endpoint activity. An attacker operating
entirely on a compromised workstation without touching cloud services produces no cloud
audit signal.

Minimum deployment: CloudTrail enabled in all regions (including unused ones); Azure
Unified Audit Log enabled; GCP Data Access logs enabled for Cloud Storage; retention
of at least 90 days; alerts on anomalous API call patterns and first-use of high-privilege
permissions.
Last updated: 10 July 2026
