# Detecting lateral movement

Lateral movement detection sits at the identity layer. The techniques used: credential
replay, remote execution, Kerberos abuse. All produce authentication events. Malware
detections are largely absent: the attacker is using built-in tools and legitimate
protocols. The signals are in Windows Security event logs on domain controllers and target
hosts, Sysmon process creation events on target hosts, and auditd on Linux jump hosts.

The consistent limitation is that individual events are not meaningful in isolation. An
NTLM logon type 3 event is normal traffic. A Kerberos TGS request is normal traffic. The
anomaly is in the relationship between the event and its context: who is authenticating,
from where, to what, at what time, and whether that combination has been observed before.
A SIEM rule that alerts on every NTLM logon is useless. A rule that alerts on NTLM logon
from a source IP not in the account's prior 30-day access set, to a host in the server
tier, is useful.

## Credential replay

Pass-the-hash produces an NTLM logon type 3 (network) authentication from an unexpected
source. The characteristics that distinguish it from legitimate NTLM:

- The source IP is not the account's registered workstation or any IP seen in the prior
  access history for that account-target pair.
- The authentication uses NTLM where the account would normally use Kerberos (NTLM
  on workstations in a Kerberos-capable domain often indicates a tool defaulting to hash
  replay rather than ticket-based auth).
- The target is in the server tier or is a host the account has no documented reason to
  access.

```
Alert: Event ID 4624, LogonType=3, AuthPackage=NTLM,
  SourceIP not in account's 30-day access baseline for TargetHost
Alert: Event ID 4624, LogonType=3, AuthPackage=NTLM,
  TargetHost in server_tier AND SourceUser not in server_admins group
```

Pass-the-ticket is harder to distinguish at the authentication event level because the
ticket looks valid. The signal is the source IP: a Kerberos service ticket being used from
an IP that is not the workstation the TGT was originally issued to. This requires
correlating Event ID 4768 (TGT issued, with IP) against Event ID 4769 (TGS used, with IP)
for the same account.

Overpass-the-hash produces a Kerberos AS-REQ from a host that is not the account's
registered workstation. The AS-REQ is the first step in converting an NTLM hash to a
Kerberos TGT; it is abnormal for it to originate from any host other than where the
account is actively logged in.

```
Alert: Event ID 4768, source IP not matching account's known workstation
  (requires a workstation-to-account mapping baseline)
```

## Kerberos abuse

Kerberoasting generates a spike in Event ID 4769 (TGS requests) with encryption type
0x17 (RC4-HMAC) from a single source in a short window. Modern Kerberos clients request
AES; RC4 requests for multiple different service account SPNs within minutes from one
source are the pattern.

AS-REP roasting produces Event ID 4768 with pre-authentication type 0. Any occurrence
for a non-service account is worth investigating immediately; service accounts with this
flag set are worth auditing for removal.

Golden Ticket use is detectable through anomalies in the ticket itself: forged tickets
often contain a domain SID that does not match the current domain's SID (if the KRBTGT
hash was obtained from a backup or an older domain state), or they reference accounts that
do not exist or have inconsistent attributes. Microsoft ATA and Defender for Identity
specifically detect Golden Ticket indicators including tickets with an unusually long
lifetime, tickets issued without a corresponding TGT request, and tickets referencing the
privileged account RID 500 for accounts that are not Administrator.

Silver Ticket use leaves no KDC authentication events, because the ticket bypasses the
KDC. Detection falls to the service host: the service validates the ticket's PAC
signature. PAC validation has been enabled by default since MS14-068 (November 2014); a forged PAC
will fail validation on patched systems. It is occasionally disabled on specific service
hosts to reduce Kerberos overhead under constrained delegation, which restores the
exposure. Confirming PAC validation is active on high-value service hosts is worth
including in a hardening review.

```
Event ID 4769 (TGS request): filter for EncryptionType = 0x17 (RC4)
  Alert: >3 RC4 TGS requests within 10 minutes from one source to different SPNs
Event ID 4768 (AS request): filter for PreAuthType = 0
  Alert: any occurrence for user accounts (not service accounts with documented legacy
  requirement)
```

## Remote execution

PSExec produces a recognisable artefact chain: admin$ share access followed immediately
by a new service installation on the target. The service name is PSEXESVC in the original
tool; variants use random names to avoid that specific signature, but the pattern of
admin$ access followed by Event ID 7045 (service installation) from a workstation source
IP is not typical of legitimate administration.

```
Alert: Event ID 7045 (new service installed) on a server, preceded within 60 seconds
  by Event ID 5140 (share access) to admin$ from the same source IP, where the
  source IP is in the workstation range
```

WMI remote execution creates a process on the target host with WmiPrvSE.exe as the
parent. Legitimate WMI usage on servers typically involves known management tools with
consistent command lines. An unexpected process under WmiPrvSE.exe with encoded content,
a network utility invocation, or a path to a temporary directory is anomalous.

```
Alert: Sysmon Event ID 1 (process creation) with ParentImage matching WmiPrvSE.exe
  AND (CommandLine contains -enc OR CommandLine contains %TEMP% OR
  CommandLine matches net|certutil|powershell|cmd.exe with download patterns)
```

DCOM lateral movement produces a COM server process activation on the target. The
specific parent process depends on which COM object was instantiated, but mmc.exe,
explorer.exe, and svchost.exe appearing with unexpected child processes in a server
context are worth correlating with DCOM activation events in the Microsoft-Windows-COM
event channel.

## RDP

RDP authentication appears as Event ID 4624 logon type 10 (RemoteInteractive) on the
target. An account authenticating via RDP to a host it has not previously accessed, from
a source IP not in the account's normal access pattern, is the detection baseline.
Session reconnections appear as logon type 7.

Event ID 4778 (remote session connected) and 4779 (remote session disconnected) on the
target track session lifecycle and are useful for timeline reconstruction. An attacker
using RDP tends to connect, accomplish a task, and disconnect: short session duration on
a host the account has not previously used is characteristic.

```
Alert: Event ID 4624, LogonType=10, source IP not in account's prior RDP access set
  for that target host
Alert: Event ID 4624, LogonType=10 to a domain controller from any workstation IP
```

## SSH agent hijacking

Detection on Linux requires auditd. The relevant rule monitors OPEN and READ syscalls
on files matching the SSH agent socket path pattern:

```
-a always,exit -F arch=b64 -S open,openat -F dir=/tmp -F key=ssh_agent
```

A process accessing an SSH agent socket file where the process owner does not match the
socket owner is the indicator. Legitimate SSH agent use: the sshd process and the
authenticated user's shell access the socket; no other process is expected to. An attacker with
root who opens the socket owned by a different user (for example, an sshd process serving
a different session) is detectable through this mismatch.

Correlating the socket access event with a new outbound SSH connection from the host
within a short window provides the confirmation: the attacker used the hijacked socket to
authenticate to a downstream host.

## BloodHound and AD enumeration

SharpHound generates LDAP query volumes and patterns inconsistent with normal workstation
behaviour. A workstation authenticating to a DC and issuing hundreds of LDAP queries
across multiple object classes (users, computers, groups, GPOs) in a short burst is
anomalous. The specific query patterns (querying all group memberships, all ACL entries,
all computer objects) are recognisable if LDAP query logging is enabled on DCs.

SAMR and LSARPC calls to multiple hosts in quick succession indicate the session
enumeration component of SharpHound's collection. On each target host, SharpHound
establishes a SAMR connection to enumerate local group memberships and active sessions.

```
Alert: >500 LDAP connections from a single non-DC host to a DC within 15 minutes
Alert: SAMR connections from a single workstation to >15 distinct hosts within 60 minutes
```

*A developer's workstation is compromised. Within two hours, a PTH authentication event
appears on the file server tier: Event ID 4624, logon type 3, NTLM, source IP matching
the developer's workstation, target a build server the developer account has no prior
events against. The SIEM has no baseline for that account-target pair. The event is
logged, unreviewed, as routine NTLM traffic. Forty minutes later, a TGS request with
RC4 encryption appears on the domain controller for the build service account SPN. The
two events are not correlated. No alert fires.*
