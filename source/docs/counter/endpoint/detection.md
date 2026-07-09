# Detecting endpoint attacks

Endpoint attack detection spans three tiers: the device itself (EDR telemetry), the identity layer (authentication and
token events in the identity provider), and the cloud control plane (API calls and resource access events). Modern
attacks that pivot off the device quickly are invisible to EDR-only detection programmes; identity and cloud telemetry
are where the activity continues.

## EDR detection signals

The highest-fidelity signals for the techniques in this domain:

Process injection is detectable through Sysmon Event ID 10 (process access to a remote process) combined with unusual
process tree relationships. A non-administrative process opening LSASS with `PROCESS_VM_READ` access is a reliable
indicator.

When Defender catches malicious code via AMSI scanning, it logs Events 1116 (detection) and 1117 (action taken) in
Microsoft-Windows-Windows Defender/Operational. A successful AMSI bypass will not produce these events. Script block
logging (Event 4104) is more reliable for catching bypass attempts: script blocks containing `AmsiScanBuffer`,
`amsiContext`, or common obfuscation patterns are worth alerting on.

LOLBin abuse is detectable through process command-line argument monitoring. Specific patterns to alert on: `certutil`
with `-urlcache` or `-decode` arguments; `mshta.exe` with a URL or remote path argument; `regsvr32.exe` with `/i:http`;
`wmic` with `process call create`.

```
Sysmon Event ID 1 (Process Create): command line contains certutil.*-urlcache OR mshta.*http
Sysmon Event ID 7 (Image Load): unsigned DLL loaded into signed process
Sysmon Event ID 17/18 (Pipe events): named pipe creation matching C2 framework signatures
```

Memory-only execution via PowerShell script block logging (Event 4104) captures the deobfuscated content of executed
scripts regardless of obfuscation at rest. This requires enabling script block logging via Group Policy.

## Identity provider detection

Authentication events in Entra ID, Okta, or equivalent produce high-fidelity alerts for:

- Successful authentication from a new device or IP address, particularly if the device is not Intune-enrolled or fails
  a compliance check.
- Token use from an IP address inconsistent with the user's normal location immediately following a device-bound
  authentication (PRT theft and replay from different infrastructure).
- High volume of service-to-service token requests from a single identity in a short window (automated cloud API
  enumeration).
- New credential added to an application registration or service principal.

Impossible travel detection flags authentications from two geographically distant locations within a timeframe that
makes physical travel impossible. This is a standard Entra ID Identity Protection signal.

## Cloud control plane detection

AWS CloudTrail, Azure Activity Log, and GCP Audit Logs are worth alerting on:

```
AWS: CreateAccessKey for any IAM user not in an approved automation account
AWS: AssumeRole from an unfamiliar source IP or at an unusual time
Azure: New credential added to an application (Entra audit log: "Add service principal credentials")
Azure: Download of multiple files from SharePoint within a short window (mass exfiltration pattern)
GCP: New service account key created
```

The most important metric is time-to-detect for cloud access following an endpoint compromise, measured as the gap
between the first post-compromise process creation event on the endpoint and the first cloud API call from attacker
infrastructure. In environments with good detection, this gap is typically minutes; where it runs to hours or more, the
cloud control plane signals are the last line.

## Behavioural baselines

Detection at the level described in the modern attack brief ("does this feel wrong?") requires user and entity
behavioural analytics (UEBA). The baseline questions:

- Does this user normally access this service from this location at this time?
- Does this user normally download this volume of data?
- Does this service account normally call these APIs?
- Has this user's access pattern changed abruptly?

UEBA is effective when baselines are stable and anomalies are meaningful. Alert fatigue from too many low-fidelity
signals degrades the programme; tuning requires deliberately testing the detection logic with the runbook techniques and
measuring which produce actionable alerts versus noise.

*Example. A finance analyst account accesses
`PayrollExport.xlsx` at 02:14 from 95.216.44.23, an IP with no prior sessions
for that identity. The account has not previously accessed the payroll directory.
The analyst's peers in the finance group have not accessed it from an external IP
in the past 90 days. No individual fact is conclusive. The combination of a
sensitive file, an unusual IP, an out-of-hours timestamp, and a peer group
divergence is unlikely to describe a legitimate user, and that is what fires the
alert.*

## Standing up the sensor

The endpoint telemetry these detections read, process creation, file access, authentication, and the
behavioural baseline behind the example above, is collected by the Wazuh agent. Its deployment is in
[Wazuh agent deployment](../../org/scale-up/runbooks/wazuh-agent-deployment.md).
Last updated: 09 June 2026
