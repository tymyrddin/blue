# Rego policy development

Rego is the policy language used by OPA. It is a declarative language designed for expressing rules over structured data: given an input document and a set of data documents, a Rego policy returns a decision. Dr. Crucible describes it as "like SQL for access control, but more honest about what it is doing." This runbook covers the Rego constructs used in Golem Trust policies, the structure of input documents for each integration type, helper rule patterns, and the development workflow including the OPA playground and code formatting.

## Policy structure

Every Rego file begins with a package declaration and optionally imports built-in libraries:

```
package golem_trust.kubernetes.pods

import rego.v1
```

Default rules declare the baseline decision when no other rule matches:

```
default allow := false
default deny := []
```

Allow and deny rules then describe conditions under which the decision changes:

```
allow if {
    not any_violation
}

deny contains msg if {
    input.request.object.spec.securityContext.runAsUser == 0
    msg := "Containers must not run as root (UID 0)"
}
```

The `deny contains msg` pattern collects all violations into a set rather than short-circuiting at the first one. This gives admission webhook callers a complete list of problems in a single rejection.

## Example: Royal Bank databases must have encryption enabled

This policy is evaluated against Terraform plan JSON during the CI pipeline. The input is the Terraform plan's resource change set:

```
package golem_trust.terraform.rds

import rego.v1

default allow := false

allow if {
    count(violations) == 0
}

violations contains msg if {
    resource := input.resource_changes[_]
    resource.type == "aws_db_instance"
    resource.change.actions[_] in {"create", "update"}
    not resource.change.after.storage_encrypted
    msg := sprintf(
        "RDS instance '%s' must have storage_encrypted = true (Royal Bank requirement GTF-DB-001)",
        [resource.address]
    )
}

violations contains msg if {
    resource := input.resource_changes[_]
    resource.type == "aws_db_instance"
    resource.change.actions[_] in {"create", "update"}
    resource.change.after.engine in {"mysql", "postgres"}
    not regex.match(`^TLS`, resource.change.after.parameter_group_name)
    msg := sprintf(
        "RDS instance '%s' must use a TLS parameter group",
        [resource.address]
    )
}
```

## Example: Production access requires two approvals

This policy is called by the StrongDM integration. The input contains the access request metadata and the approval list from the ticketing system:

```
package golem_trust.strongdm.access

import rego.v1

default allow := false

allow if {
    input.resource.environment == "production"
    count(valid_approvals) >= 2
}

allow if {
    input.resource.environment != "production"
    count(valid_approvals) >= 1
}

valid_approvals contains approver if {
    approval := input.approvals[_]
    approval.status == "approved"
    approval.approver != input.requestor
    approver := approval.approver
}
```

## Example: Containers must not run as root

This Gatekeeper policy covers Kubernetes pod admission:

```
package golem_trust.kubernetes.runasroot

import rego.v1

default allow := false

allow if {
    count(violations) == 0
}

violations contains msg if {
    container := input.review.object.spec.containers[_]
    not container.securityContext.runAsNonRoot
    msg := sprintf(
        "Container '%s' must have securityContext.runAsNonRoot: true",
        [container.name]
    )
}

violations contains msg if {
    container := input.review.object.spec.containers[_]
    container.securityContext.runAsUser == 0
    msg := sprintf(
        "Container '%s' must not run as UID 0",
        [container.name]
    )
}
```

## Writing helper rules and functions

Helper rules reduce duplication. A helper rule is any rule whose head is not `allow` or `deny`:

```
is_production if {
    input.review.object.metadata.namespace == "production"
}

is_production if {
    input.review.object.metadata.labels["env"] == "production"
}
```

Functions accept arguments and return values:

```
image_registry(image) := registry if {
    parts := split(image, "/")
    count(parts) >= 2
    registry := parts[0]
}
```

Use functions to centralise logic that appears in multiple rules, such as extracting the registry from an image reference or parsing a namespace name to infer the environment.

## Input document structure

The input document differs by integration type. The three main structures at Golem Trust are:

Kubernetes admission (OPA Gatekeeper):

```
{
  "review": {
    "kind": {"group": "", "kind": "Pod", "version": "v1"},
    "namespace": "production",
    "object": { ... },
    "userInfo": {"username": "carrot@golems.internal", "groups": [...]}
  }
}
```

Terraform plan (Conftest):

```
{
  "resource_changes": [...],
  "configuration": {...},
  "planned_values": {...}
}
```

StrongDM and API gateway (OPA REST API query):

```
{
  "requestor": "angua@golems.internal",
  "resource": {"name": "royalbank-prod-postgres", "environment": "production"},
  "approvals": [{"approver": "carrot@golems.internal", "status": "approved", "timestamp": "..."}]
}
```

## OPA playground and formatting

For policy development, use the OPA playground at `https://play.openpolicyagent.org`. Paste the policy, provide a sample input document, and evaluate to check the output before writing tests.

Before committing any Rego file, format it with the OPA formatter to ensure consistent style:

```
opa fmt --write policies/
```

The GitLab CI pipeline runs `opa fmt --diff policies/` and fails the pipeline if any files are unformatted. This avoids style debates in code review and keeps diffs clean.
