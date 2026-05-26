# Trends and defender context

## The landscape

Modern persistence has moved beyond the classic "drop a service, add a registry
key" playbook. The shift reflects endpoint detection maturity: classic mechanisms
are heavily monitored and frequently caught.

Where attackers have moved:

### Identity persistence

Identity persistence is now the highest-priority concern for many
organisations. Stealing a refresh token or planting an OAuth application gives
access that survives host reimaging, password resets, and endpoint agent
reinstallation. The persistence lives in the identity control plane, not on any
individual host, so endpoint-based detection misses it entirely. Cloud identity
persistence (cross-account roles, service principals added to privileged groups)
compounds this: a single planted role can outlast every other remediation action.

*A planted app registration in Entra ID often looks like: a display name that
blends with legitimate tooling ("EnterpriseSync", "Backup Agent"), created outside
business hours, with application-level rather than delegated permissions, a client
secret expiring in 12 or 24 months, and no entry in the organisation's service
account register. The creation and credential addition events appear in the Entra
audit log. Without a review process for new app registrations or an alert on
application-level permission grants, the entry persists indefinitely.*

### Living off the land

Living off the land at the OS level means using scheduled tasks, WMI
subscriptions, and services rather than custom implants. These are legitimate
operating system features; the malicious entry looks structurally identical to
the legitimate ones surrounding it. Detection requires knowing the expected state.

### Application-layer persistence

Application-layer persistence (web shells, database triggers, backdoored
configuration) survives host-level incident response. If the application is
redeployed from an unchanged repository, the backdoor comes back. This layer is
often missed because IR teams focus on the operating system and cloud, not on
application code and data stores.

### CI/CD and supply chain

CI/CD and supply chain persistence is a growing concern. A malicious step
buried in a pipeline definition, or a backdoored dependency on a private
registry, executes on every pipeline run with whatever credentials that pipeline
carries.

## Coverage across control planes

Effective persistence detection requires coverage across multiple control planes
simultaneously:

- Endpoint: Autoruns analysis (Sysinternals Autoruns, Velociraptor), WMI
  subscription enumeration, Sysmon event monitoring
- Identity: Azure AD audit logs (app registrations, role assignments, service
  principal changes), AWS CloudTrail (IAM user/role creation, policy attachment)
- Application: web shell detection (file integrity monitoring on web-accessible
  directories, anomalous HTTP request patterns), database audit logs
- CI/CD: pipeline definition change monitoring, secret access audit logs

No single tool covers all of these. Organisations that invest only in endpoint
detection will miss identity and cloud persistence. Organisations that monitor
cloud IAM but not CI/CD will miss pipeline-based persistence.

## The fundamental challenge

Persistence detection is inherently a baselining problem. You cannot know that
a WMI subscription is malicious unless you know what subscriptions should exist.
You cannot know that an IAM role is a backdoor unless you know what roles are
expected. This requires:

- Knowing the expected state (configuration management, documented baselines)
- Detecting deviations from that state (change monitoring, periodic comparison)
- Investigating deviations promptly (deviations that go uninvestigated for days
  give attackers time to layer additional mechanisms)

The attacker's advantage is that they can study the environment before planting
persistence and choose names, paths, and patterns that fit the existing noise.
The defender's advantage is that persistence is durable. It can be found days
or weeks after the initial compromise if the right hunting capability exists.
