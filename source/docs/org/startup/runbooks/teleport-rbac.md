# RBAC policy examples

Runbook for Teleport's role-based access control. This document defines the roles in use, explains the design decisions behind them, and provides examples for creating new roles. Carrot drafted the initial role set. Each role reflects a real job function at Golem Trust.

## Role design principles

Roles are named after job functions. A role called `developer` is easier to reason about than a role called `ssh-non-prod-read-write`. When a developer's responsibilities change, the role changes; when a new developer joins, the role is assigned without re-examining permissions.

Every role specifies the minimum access required for the job. When in doubt, grant less and allow access requests to cover exceptional needs. The access request workflow (see the approval workflows runbook) exists for cases that fall outside the normal role scope.

Roles are applied to Teleport users via labels. Server labels (`env: production`, `role: database`) control which servers a role can access.

## Current roles

### developer

Granted to: software developers, Ludmilla Katzenzungen

```
tctl create -f - << 'EOF'
kind: role
version: v7
metadata:
  name: developer
spec:
  allow:
    node_labels:
      env: [staging, dev]
    logins: [developer, deploy]
    request:
      roles: [production-access]
      reason: true
      thresholds:
        - approve: 1
          deny: 1
  options:
    max_session_ttl: 8h
    require_session_mfa: false
    record_session:
      desktop: true
      default: best_effort
EOF
```

Developers have persistent access to staging and dev environments. Production access requires a request with a reason. Session MFA is not required for staging; it is required for production via the `production-access` role definition.

### sysadmin

Granted to: Ponder Stibbons

```
tctl create -f - << 'EOF'
kind: role
version: v7
metadata:
  name: sysadmin
spec:
  allow:
    node_labels:
      env: [production, staging, dev]
    logins: [ponder, root, deploy]
    db_labels:
      env: [production]
    db_users: [ponder, postgres]
    db_names: [keycloak, vaultwarden, teleport]
  options:
    max_session_ttl: 8h
    require_session_mfa: true
    record_session:
      desktop: true
      default: best_effort
EOF
```

Sysadmins have production access and database access. MFA is required on every session start. Production database access is direct, reflecting Ponder's operational role, but every session is recorded.

### security

Granted to: Carrot Ironfoundersson, Angua

```
tctl create -f - << 'EOF'
kind: role
version: v7
metadata:
  name: security
spec:
  allow:
    node_labels:
      "*": "*"
    logins: [security, root]
    review_requests: {}
    rules:
      - resources: [session]
        verbs: [list, read]
      - resources: [event]
        verbs: [list, read]
  options:
    max_session_ttl: 8h
    require_session_mfa: true
    record_session:
      desktop: true
      default: best_effort
EOF
```

Security personnel have access to all servers and can review all session recordings and audit events. The `review_requests` block grants approval rights for access requests.

### golem-operator

Granted to: Mr. Pump and his team (via certificate-based auth)

```
tctl create -f - << 'EOF'
kind: role
version: v7
metadata:
  name: golem-operator
spec:
  allow:
    node_labels:
      role: [infrastructure, network]
    logins: [golem-operator]
  options:
    max_session_ttl: 1h
    require_session_mfa: false
    record_session:
      desktop: true
      default: best_effort
EOF
```

Golems authenticate via certificate (they cannot operate a hardware authenticator). The role is restricted to infrastructure nodes and a dedicated Linux user. Sessions are recorded. TTL is one hour; the golem re-authenticates for each work period.

### auditor

Granted to: Adora Belle Dearheart

```
tctl create -f - << 'EOF'
kind: role
version: v7
metadata:
  name: auditor
spec:
  allow:
    rules:
      - resources: [session]
        verbs: [list, read]
      - resources: [event]
        verbs: [list, read]
      - resources: [user]
        verbs: [list, read]
      - resources: [role]
        verbs: [list, read]
  options:
    max_session_ttl: 8h
EOF
```

Auditors can read all sessions and events but cannot connect to any servers. Adora Belle uses this role to review what has been happening without having direct access to the infrastructure. She finds this arrangement satisfactory.

### vendor-guild

Granted to: third-party vendor accounts for the Merchants' Guild portal

```
tctl create -f - << 'EOF'
kind: role
version: v7
metadata:
  name: vendor-guild
spec:
  allow:
    node_labels:
      customer: merchants-guild
    logins: [vendor]
    request:
      annotations:
        reason: "reason"
  options:
    max_session_ttl: 2h
    require_session_mfa: true
    record_session:
      desktop: true
      default: best_effort
    require_reason: true
EOF
```

Vendor accounts can only access servers labelled `customer: merchants-guild`. MFA is required. Sessions are recorded. A reason is required for every connection. Maximum session duration is two hours. Vendor accounts are disabled when not in an active support window (see the certificate authentication runbook).

## Assigning roles to users

```
tctl users update ponder.stibbons --set-roles=sysadmin,auditor
tctl users update carrot.ironfoundersson --set-roles=security,editor
tctl users update angua --set-roles=security
tctl users update adora.belle.dearheart --set-roles=auditor,editor
tctl users update ludmilla.katzenzungen --set-roles=developer
```

Roles are cumulative: a user with both `developer` and `sysadmin` gets the union of both roles' permissions.

## Creating a new role

When a new team member joins or a new customer portal is set up, create a role following the existing pattern:

1. Name the role after its function
2. Use node label selectors to restrict to the relevant servers; label new servers at provisioning time
3. Set `max_session_ttl` to the longest reasonable session duration for the role
4. Set `require_session_mfa: true` for any role with production access
5. Leave session recording at `best_effort`; this records when possible and does not block the session if recording fails

Test the new role in staging before assigning it to a real user. Carrot reviews all new roles before they are deployed.
Last updated: 10 July 2026
