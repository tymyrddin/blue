# Collection: defender context

## The detection problem

Detecting collection is hard because modern collection is indistinguishable
from normal user activity. A user browsing SharePoint, downloading files,
and querying the HR system looks identical to an attacker who controls
that user's identity doing the same things. The underlying activity is the
same. The distinction is intent and context, neither of which is visible
in a log entry.

Effective collection detection requires answering three questions that many
organisations cannot currently answer:

- What does normal data access look like for each user, application, and
  system role?
- What volume, timing, and pattern of access is consistent with normal work?
- What deviations from that baseline are significant enough to investigate?

Without answers to these questions, collection goes undetected.

## Where defenders have visibility

Some collection activities do generate detectable signals:

Active Directory enumeration generates LDAP query volume anomalies and
specific event IDs (4662 for object access, 4624/4625 for authentication
patterns). BloodHound collection specifically generates characteristic
LDAP queries against AD object attributes.

Credential harvesting against LSASS generates Event ID 10 in Sysmon
(process access) and specific API call patterns that EDR tools monitor.
LSASS protection (RunAsPPL, Credential Guard) disrupts some techniques
and forces attackers toward louder alternatives.

Bulk file downloads from SharePoint and other SaaS platforms generate
API call volume that exceeds normal user behaviour. DLP products that
monitor cloud API activity can detect this, but only if they are
configured with realistic baselines.

Credential access from cloud instance metadata (the 169.254.169.254
endpoint) is logged in AWS CloudTrail and equivalent services. An
unexpected call to this endpoint from a process or user context that
does not normally use it is worth investigating.

## Where defenders are blind

SaaS enumeration using legitimate credentials: a valid OAuth token making
Graph API calls to enumerate SharePoint sites generates no security alert.
The activity is logged, but nobody is looking at the logs.

Supply chain compromise: malicious code in a build pipeline runs in the
CI/CD environment, which is often outside the EDR and SIEM coverage. The
build succeeds. The secrets are exfiltrated. No alert fires.

Shadow IT collection: employees uploading data to unapproved AI tools
and SaaS applications is invisible to a security team that only monitors
approved services.

## Detection coverage

Identity behaviour analytics that baseline normal access patterns per user
and alert on significant deviations: unusual access times, access to
resources the user has not previously accessed, bulk downloads, access from
unusual locations.

Cloud API monitoring that tracks API call volume, not just authentication
events. A user downloading 10,000 files in an hour is visible in SharePoint
audit logs; the question is whether anyone receives and acts on that signal.

CI/CD pipeline monitoring that detects when pipeline definitions change,
when secrets are accessed by unexpected processes, and when build artefacts
are uploaded to unexpected destinations.

Supply chain controls: hash pinning for dependencies, signature verification
for packages, scanning of third-party code before it executes in privileged
contexts.
