# Lateral movement techniques

The attacker's first question after establishing a foothold is where they are relative to
what they came for. The answer determines which movement techniques are relevant. A
compromised workstation in a flat network requires a different path than a foothold in a
DMZ with no direct route to the internal domain. The techniques below address the
Windows-centric AD environment that makes up the majority of enterprise targets; the SSH
and Linux coverage applies to mixed environments and cloud-adjacent infrastructure.

## Credential-based movement

Pass-the-hash replays an NTLM hash to authenticate over SMB or WMI without ever knowing
the plaintext password. The hash is harvested from LSASS on the compromised host using
Mimikatz or a comsvcs MiniDump dump, from the SAM database via offline or Volume Shadow
Copy access, or from NTDS.dit on a compromised domain controller. Once harvested, it authenticates against any host where
the account has access, as long as that host accepts NTLM.

Pass-the-ticket replays a Kerberos ticket. Tickets are extracted from memory (again via
LSASS) and injected into the current session. The ticket is valid until its expiry time,
typically ten hours for a TGT. It authenticates against any service the ticket was issued
for, from any machine the attacker controls.

Overpass-the-hash converts an NTLM hash into a Kerberos TGT by sending an AS-REQ to the
domain controller directly. This produces a Kerberos ticket from an NTLM hash, which is
useful where NTLM is blocked at target hosts but Kerberos is permitted.

Credential Guard raises the cost of all three by protecting NTLM hashes and Kerberos
tickets inside a virtualisation-based security enclave that the LSASS process context
cannot read directly. It does not prevent credential harvesting from other sources:
cached credentials in browser stores, plaintext credentials in scripts or configuration
files, or credentials entered into a process the attacker controls.

## Remote execution

PSExec, WMI, DCOM, and SCM-based service installation are the standard remote execution
channels. Each authenticates to the target and spawns a process there. They are
distinguishable by their artefacts: PSExec creates a PSEXESVC service and writes to
admin$; WMI execution appears under a WmiPrvSE.exe parent; DCOM activations are
identifiable through COM server process parentage; service installation via SCM produces
an Event ID 7045.

WMI remote execution is commonly preferred because it leaves lighter artefacts than
PSExec and its network traffic uses standard DCOM/RPC ports that are often open between
internal segments. The command form is `wmic /node:TARGET process call create "COMMAND"`;
the process spawns on the remote host with SYSTEM or the authenticating user's context
depending on how the call is made.

DCOM lateral movement uses COM objects that support remote activation. MMC20.Application,
ShellWindows, and ShellBrowserWindow are the objects most frequently cited in documented
attacks, because they are present on most Windows systems and support remote instantiation
via DCOM. The technique requires valid credentials and network access to DCOM ports (135
and a dynamic high port range).

## Kerberos abuse

Kerberoasting requests TGS tickets for service account SPNs. Any authenticated domain
user can request a ticket for any SPN. The ticket is encrypted with the service account's
password hash and returned to the requestor. The attacker takes the ticket offline and
cracks it. Service accounts with weak passwords, particularly those with overly broad
permissions, are the target. Group Managed Service Accounts use 240-character
automatically rotated passwords and are not practically Kerberoastable.

AS-REP roasting targets accounts with pre-authentication disabled. When pre-authentication
is not required, the domain controller returns an AS-REP message encrypted with the
account's password hash without requiring the client to prove knowledge of the password
first. The hash is crackable offline. The `DONT_REQ_PREAUTH` flag is occasionally set
legitimately (some legacy applications require it) and occasionally left set by
administrators who do not understand the implication.

Golden Tickets are forged TGTs created using the KRBTGT account's password hash. A forged
TGT appears valid to any service in the domain because the KDC issued it (as far as
Kerberos can verify). Golden Tickets require prior compromise of the KRBTGT hash,
typically from a domain controller. They persist even after password resets on individual
accounts, because the validity check is against the KRBTGT hash, not the user account.

Silver Tickets are forged TGS tickets for specific services, created using the service
account's hash rather than KRBTGT. They are narrower in scope but do not require KDC
interaction to use, which makes them harder to detect: no Kerberos authentication events
appear on the domain controller, because the forged ticket bypasses the KDC entirely.

## RDP

RDP lateral movement uses harvested credentials to open a remote desktop session on a
target host. The session is interactive: the attacker sees the target desktop and can
operate as the authenticated user. Where direct RDP access is blocked between network
segments, RDP over an established C2 channel or through a compromised intermediate host
provides a pivot.

Logon type 10 (RemoteInteractive) in Windows Security Event ID 4624 marks RDP
authentications. Logon type 7 marks session reconnections. An account authenticating via
RDP to a host it has never accessed before, from a source IP not in the account's normal
pattern, is the baseline detection signal.

## SSH agent hijacking

On Linux and macOS, SSH agent forwarding allows a user to authenticate to downstream
hosts using private keys stored on their local machine, without copying the keys to
intermediate hosts. The agent runs on the originating machine, and the forwarding
establishes a socket on the intermediate host through which authentication requests are
tunnelled back.

An attacker with root on a host where agent forwarding is active can enumerate the
SSH_AUTH_SOCK environment variable in connected user sessions, identify the socket file
(typically `/tmp/ssh-XXXXXXXX/agent.PID`), and use it to authenticate to any host the
victim user's key can access. The private key never leaves the originating machine; the
attacker is using the live socket as a proxy. The victim's SSH agent performs the
authentication on behalf of the attacker's session without the victim's knowledge.

Disabling agent forwarding (`ForwardAgent no` in ssh_config, or restricting it to
specific intended relay hosts) is the primary mitigation. The common deployment pattern
that allows forwarding on all connections to facilitate jump-host workflows is what the
technique exploits.

## BloodHound and AD path enumeration

SharpHound collects Active Directory data: group memberships, ACL edges, session
information, trust relationships, and local admin assignments. BloodHound processes this
data and exposes shortest-path queries. A query for the shortest path from a compromised
account to Domain Admins returns the minimal set of hops, intermediate accounts, and
machines the attacker needs to touch to reach that goal.

This is reconnaissance, not movement itself, but it makes the choice of movement
technique precise. Without it, the attacker guesses which accounts are worth targeting
and which machines are worth pivoting through. With it, the attack is a directed graph
traversal.

Detection relies on the volume and pattern of LDAP queries generated during collection:
SharpHound queries far more AD objects in a short time than any legitimate workstation
process, and its query patterns are recognisable. High-volume LDAP connections from an
endpoint to a domain controller, combined with SAMR and LSARPC calls to multiple hosts in
a short window, are the signal.

*A developer's workstation is the initial foothold. BloodHound maps the path: the
developer is local admin on a build server used for CI; the build server's service account
is a member of a group with RDP rights to one of the domain controllers. Three hops. PTH
to the build server using the NTLM hash extracted from LSASS on the developer's machine.
Kerberoast the build service account from the build server. Crack the ticket, which uses a
dictionary-derivable password set when the service account was provisioned two years ago.
Pass the ticket to the domain controller. Each step uses authentication mechanisms the
environment treats as expected behaviour.*
Last updated: 27 May 2026
