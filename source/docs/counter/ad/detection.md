# Detecting AD attack paths

Most AD attack path techniques produce no malware telemetry. DCSync is a replication
protocol call. An ADCS ESC1 exploit is a certificate request. A shadow credential write
is a directory attribute modification. ACL escalation is a permission change followed by
operations the domain treats as routine. Detection is at the directory and PKI layers:
domain object SACLs for replication events, CA audit logs for certificate anomalies, and
directory change events for attribute and ACL modifications. Each requires explicit
configuration; none of these sources are populated by default.

## DCSync

Event ID 4662 fires on the domain NC object when a principal exercises DS-Replication
rights on it, provided a SACL is configured auditing those rights. The event records the
subject account, the specific rights GUIDs exercised, and the logon ID. Domain controllers
appear in this event stream continuously during normal replication; a non-DC account or a
source logon session not associated with a domain controller making a replication call is
the anomaly.

The critical GUID is `{1131f6ad-9c07-11d1-f79f-00c04fc2dcd2}` (DS-Replication-Get-Changes-All),
which is the right that permits replicating secret attribute data including password
hashes. DS-Replication-Get-Changes (`{1131f6aa-9c07-11d1-f79f-00c04fc2dcd2}`) covers
non-secret attributes and may appear in legitimate tooling.

```
Alert: Event ID 4662 on domain NC object,
  Properties include {1131f6ad-9c07-11d1-f79f-00c04fc2dcd2},
  SubjectUserName does not end in $ (not a computer account)
```

Without the domain object SACL, 4662 does not fire and DCSync is invisible in the
Security event log. Microsoft Defender for Identity detects DCSync via sensor data from
domain controllers without requiring the SACL; in environments without MDI, configuring
the SACL is the only detection path.

## Certificate issuance anomalies

The Certificate Authority logs issuances to the Windows Security event log when CA
auditing is enabled. Event ID 4887 fires when a certificate request is approved and a
certificate issued; it records the requester, the template used, and the certificate
request attributes, which include any Subject Alternative Name values specified in the
request.

ESC1 and ESC6 exploitation can appear in 4887 as a request where the Attributes field
contains a SAN value specifying a UPN different from the requester's identity. An
unprivileged account requesting a certificate whose SAN identifies a Domain Admin is
the indicator. This detection applies to attribute-style requests (web enrolment,
`certreq -attrib`); Certify and Certipy embed the SAN as an X.509 extension inside the
CSR, which does not appear in the Event 4887 Attributes field. Catching those requires
querying the CA database directly via certutil or reviewing issued certificates.

```
Alert: Event ID 4887, Attributes field contains 'san:',
  SAN UPN value does not match Requester account name
Alert: Event ID 4886 (request received) followed by 4887 from a non-admin account
  on a template with CT_FLAG_ENROLLEE_SUPPLIES_SUBJECT
```

CA auditing is not enabled by default. The setting is in the CA properties under the
Auditing tab; enabling "Issue and manage certificate requests" captures both events.

ESC8 exploitation (NTLM relay to web enrolment) appears in IIS access logs on the CA
server as POST requests to `/certsrv/certfnsh.asp` with NTLM authentication, where the
authenticating machine account is different from the source IP making the request.

## ACL changes on high-value objects

Event ID 5136 records modifications to Active Directory objects and fires when any
writable attribute on a SACL-monitored object changes. Monitoring 5136 on high-value
objects (Domain Admins group, AdminSDHolder object, the domain NC object, and privileged
service account objects) for DACL changes and sensitive attribute writes is the detection
baseline.

```
Alert: Event ID 5136 on Domain Admins group or AdminSDHolder object,
  AttributeLDAPDisplayName = nTSecurityDescriptor, SubjectUserName not a domain admin
Alert: Event ID 5136 on any user or computer object,
  AttributeLDAPDisplayName = msDS-KeyCredentialLink
Alert: Event ID 5136, AttributeLDAPDisplayName = userAccountControl,
  new value has bit 0x80000 set (TRUSTED_FOR_DELEGATION)
Alert: Event ID 5136, AttributeLDAPDisplayName = msDS-AllowedToActOnBehalfOfOtherIdentity,
  SubjectUserName not a domain admin
```

Volume management is necessary. Event ID 5136 fires on every directory modification,
including routine administrative changes. Scoping the SACL to specific high-value objects
rather than the entire directory, and filtering on specific attribute names, keeps the
alert volume manageable. Legitimate `msDS-KeyCredentialLink` changes appear in WHFB
environments when devices enrol; a baseline of expected sources and accounts is worth
building before alerting.

## Shadow credentials

Shadow credential writes are Event ID 5136 on `msDS-KeyCredentialLink`. The
authentication that follows a shadow credential write appears as a Kerberos AS-REQ
with a client certificate (PKINIT). If the certificate in that authentication is traceable
to a request not associated with a legitimate device enrolment, the combination of the
5136 event and the PKINIT AS-REQ is the indicator set.

In environments without Windows Hello for Business, any write to `msDS-KeyCredentialLink`
on a user object is anomalous. In WHFB environments, writes from known device provisioning
workflows are expected; writes outside those workflows are not.

## Delegation changes

Legitimate Kerberos delegation changes in a well-managed environment are infrequent and
tied to application deployments. Event ID 5136 for changes to `userAccountControl`
(setting TRUSTED_FOR_DELEGATION) or `msDS-AllowedToActOnBehalfOfOtherIdentity` outside
a known change window is worth prioritising.

Unconstrained delegation on any new object is notable; the TRUSTED_FOR_DELEGATION flag
being added to a workstation or service account not in the expected set of delegation
hosts is a higher-severity signal than the same change on a known application server.

*An attacker holds a compromised service account. Event ID 5136 fires at 02:30 on a
domain controller computer object: `msDS-AllowedToActOnBehalfOfOtherIdentity` was
modified, subject the service account. No SACL was configured on that object class. The
event is not logged. At 02:45 a TGS request appears for the cifs service on the domain
controller. At 03:00, Event ID 4662 fires on the domain NC object from a source that is
not a domain controller. The domain object SACL was configured eighteen months ago
after a prior incident. The alert fires. An analyst picks it up at 08:00 and finds the
02:30 access recorded in the DC's security log under a different event class, unreviewed.*
Last updated: 27 May 2026
