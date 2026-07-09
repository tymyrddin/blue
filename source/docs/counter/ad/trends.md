# Active Directory attack paths

Active Directory is an authentication and authorisation graph. The techniques in this
section exploit the graph: they request what AD is configured to allow, use protocols it
was designed to support, and inherit permissions set by administrators over the lifetime
of a domain. None require a vulnerability in the conventional sense. The pre-conditions
are structural.

An attacker holding domain credentials, however unprivileged, can query which service
accounts have SPNs and request Kerberos tickets encrypted with their hashes. They can read
which certificate templates permit arbitrary subject names. They can traverse the ACL graph
to find WriteDACL edges that lead to Domain Admins in a few hops. The information is
available by design; the exploitability is a function of how the domain was configured.

## DCSync

DCSync abuses the MS-DRSR (Directory Replication Service Remote) protocol to request a
domain controller to replicate credential data. An attacker who holds the
DS-Replication-Get-Changes and DS-Replication-Get-Changes-All rights on the domain object
sends a DRSGetNCChanges call and receives NTLM hashes, Kerberos keys, and historical
password data in return. No code runs on the domain controller; the request is a
legitimate replication call processed normally.

These rights are held by Domain Admins, Enterprise Admins, domain controllers, and any
account an administrator has explicitly granted them. BloodHound identifies these accounts
via its HasDCSync edge. The technique is commonly associated with Mimikatz
(`lsadump::dcsync`), but the underlying DRSUAPI calls can be made through other tooling.

Detection depends on identifying replication requests from hosts that are not domain
controllers. Event ID 4662 fires on the domain object when these rights are exercised,
provided a SACL is configured on the domain object for DS-Replication access. That SACL
is not present by default.

## ADCS ESC attack paths

Active Directory Certificate Services introduces a second privilege escalation surface
inside the domain. Certificate templates define what can be enrolled, by whom, and what
the resulting certificate can be used for. Misconfigurations in these templates, or in
the Certificate Authority itself, create paths from an unprivileged domain account to a
certificate that authenticates as a Domain Admin.

ESC1 is the most direct: a template allows the enrolling user to supply an arbitrary
Subject Alternative Name, and the template carries the Client Authentication EKU
(`1.3.6.1.5.5.7.3.2`). An attacker requests a certificate specifying a Domain Admin in
the SAN field. The CA issues it. The certificate authenticates as the specified account
via PKINIT.

ESC4 covers templates with misconfigured write permissions on the template object itself.
WriteProperty or WriteDACL on the template allows an attacker to modify it to add the
conditions ESC1 requires, enrol, then restore the template. The change window is brief.

ESC6 applies when the CA carries the `EDITF_ATTRIBUTESUBJECTALTNAME2` policy flag, which
permits arbitrary SAN values on any template.
Any template with Client Authentication becomes an ESC1 equivalent when this flag is set.

ESC8 uses NTLM relay. The CA's web enrolment endpoint accepts NTLM authentication by
default. An attacker who triggers NTLM authentication from a machine account via Print
Spooler coercion, PetitPotam, or similar, and relays it to the web enrolment endpoint,
obtains a machine certificate. A domain controller machine certificate enables
pass-the-certificate attacks yielding domain-level access.

Detection surfaces at certificate issuance: the CA logs enrolment requests, subjects, and
Subject Alternative Name values. CA audit logging is not enabled by default.

## ACL-based escalation

Active Directory access control lists govern who can modify objects. Some ACL
relationships create privilege paths that are not immediately obvious. GenericAll on a
user object allows resetting that user's password without knowing the current one.
WriteDACL on a group allows an attacker to modify the group's DACL to grant themselves
write-member rights, then add themselves to the group. WriteOwner on any object allows
taking ownership and modifying it arbitrarily. These edges appear in BloodHound's graph
and are often what makes escalation from a compromised account to Domain Admins possible.

Service accounts with GenericAll over sensitive groups, helpdesk accounts with
password-reset rights scoped too broadly, and old automation credentials with ACL remnants
from prior configurations are common findings in BloodHound data. The rights were granted
deliberately; their exploitability depends on who ends up holding the account they were
granted to.

Event ID 5136 records directory object modifications and is the primary detection source
for ACL changes on high-value objects.

## Shadow credentials

Shadow credentials exploit the `msDS-KeyCredentialLink` attribute on user and computer
objects. An attacker who can write to this attribute on an account adds a key credential
entry. On the next authentication, PKINIT is used: the KDC validates the key and issues
a TGT. The attacker authenticates as the target account without knowing its password,
without changing it, and without producing a Kerberos event on the target account's
normal authentication path.

The technique requires write access to `msDS-KeyCredentialLink`, which may come from
GenericAll, GenericWrite, or a specific attribute-write right. Detection relies on
Event ID 5136 for modifications to `msDS-KeyCredentialLink` on accounts that are not
actively using Windows Hello for Business. WHFB uses the same attribute legitimately,
so excluding known WHFB device registrations before alerting is worth establishing.

## Delegation abuse

Kerberos delegation allows a service to act on behalf of a user when accessing downstream
services. Unconstrained delegation stores the forwarded TGT in LSASS memory on the
delegating server, where it is accessible to an attacker who can read that process.
Constrained delegation with protocol transition (the `TrustedToAuthForDelegation` flag)
allows a service to authenticate as any user to specific downstream services using
S4U2Proxy, without needing the user's credentials.

Both are legitimate features used in application hosting scenarios. A server with
unconstrained delegation that receives a connection from a domain controller (via Print
Spooler coercion or similar) stores the DC's machine account TGT in memory. An attacker
who compromises that server can extract the TGT and perform a DCSync. A service account
with constrained delegation over sensitive downstream services is a standing privilege
path.

Resource-based constrained delegation adds a further variant: the
`msDS-AllowedToActOnBehalfOfOtherIdentity` attribute on a target computer object controls
which principals can delegate to it. An attacker with write access to this attribute on a
computer object can grant themselves delegation rights, then obtain service tickets for
the target machine as any user via S4U2Proxy.

## Kerberoasting and AS-REP roasting

Both techniques extract offline-crackable material from normal Kerberos protocol
operations. Detection signals and hunting queries for both are in the lateral movement
section, alongside the credential-based movement techniques they enable. The connection
to AD attack paths is that service accounts targeted by Kerberoasting frequently hold
ACL rights or group memberships that create direct escalation paths. A cracked service
account ticket is often not the end of the path; it is the step that reaches the next
ACL edge.

*A junior IT support account has GenericWrite on a shared monitoring service account,
originally scoped for a helpdesk password-management workflow. The service account has
an SPN and WriteDACL on the Domain Admins group. The IT account is compromised in a
phishing incident. BloodHound maps the path in seconds. Kerberoast the service account;
the ticket uses RC4 and a seven-character password set when the account was provisioned
three years ago. Crack it in under an hour. Use WriteDACL to add a write-member
permission to the Domain Admins DACL. Add the service account. None of the individual
configurations were wrong in isolation. The path was only visible as a graph.*
Last updated: 10 July 2026
