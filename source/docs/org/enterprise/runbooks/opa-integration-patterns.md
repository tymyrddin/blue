# Integration patterns

OPA at Golem Trust is not a single point of enforcement; it is a policy fabric woven through every system that makes consequential decisions. Dr. Crucible identified four integration patterns during the initial design, and each has distinct input structures, error surfaces, and operational characteristics. This runbook documents all four patterns: Kubernetes admission via Gatekeeper, Terraform plan validation via Conftest, StrongDM database access control via the OPA REST API, and API gateway request authorisation via an OPA sidecar. It also covers the bundle distribution mechanism that keeps policy consistent across all OPA instances.

## Pattern 1: Kubernetes admission via Gatekeeper

Gatekeeper intercepts every `CREATE` and `UPDATE` request to the Kubernetes API server via a validating admission webhook. OPA evaluates the resource against all applicable constraints.

Input structure (provided automatically by Gatekeeper):

```
{
  "review": {
    "kind": {"group": "apps", "kind": "Deployment", "version": "v1"},
    "namespace": "production",
    "operation": "CREATE",
    "userInfo": {
      "username": "carrot@golems.internal",
      "groups": ["system:authenticated", "golem-trust:developers"]
    },
    "object": {
      "metadata": {"name": "payments-api", "namespace": "production"},
      "spec": {
        "template": {
          "spec": {
            "containers": [{"name": "app", "image": "harbor.golems.internal/...", ...}]
          }
        }
      }
    }
  }
}
```

Policy output expected by Gatekeeper:

```
violation contains {"msg": msg} if { ... }
```

How errors reach users: the `kubectl apply` command returns a non-zero exit code with the violation messages in the error body. In the GitLab CI deployment pipeline, this causes the deployment stage to fail with the policy messages printed in the pipeline log. The developer sees, for example: "Container 'app' must have securityContext.runAsNonRoot: true."

## Pattern 2: Terraform plan validation via Conftest

The GitLab CI Terraform pipeline generates a plan in JSON format and passes it to Conftest, which calls OPA against the `policies/terraform/` directory.

Input structure (Terraform plan JSON, passed by Conftest):

```
{
  "resource_changes": [
    {
      "address": "aws_db_instance.royalbank_prod",
      "type": "aws_db_instance",
      "change": {
        "actions": ["create"],
        "after": {
          "storage_encrypted": false,
          "engine": "postgres"
        }
      }
    }
  ]
}
```

Policy output expected by Conftest:

```
deny contains msg if { ... }
```

How errors reach users: Conftest prints a table of all violations to stdout and exits with a non-zero code. The pipeline stage fails, the merge request is blocked, and the engineer reads the violation message in the CI log. There are no silent failures; Conftest does not produce partial results.

## Pattern 3: StrongDM database access via OPA REST API

When a developer requests access to a production database through StrongDM, the StrongDM gateway calls the OPA REST API synchronously before granting the connection. The latency budget is 500 ms; OPA consistently answers within 5 ms for this policy.

The StrongDM integration calls:

```
POST http://opa.golems.internal:8181/v1/data/golem_trust/strongdm/access
Content-Type: application/json

{
  "input": {
    "requestor": "angua@golems.internal",
    "resource": {
      "name": "royalbank-prod-postgres",
      "environment": "production",
      "classification": "restricted"
    },
    "approvals": [
      {
        "approver": "carrot@golems.internal",
        "status": "approved",
        "timestamp": "2025-11-14T08:55:00Z"
      },
      {
        "approver": "sam.vimes.jr@golems.internal",
        "status": "approved",
        "timestamp": "2025-11-14T08:56:42Z"
      }
    ]
  }
}
```

OPA response:

```
{
  "result": true
}
```

How errors reach users: if `result` is `false`, StrongDM returns an access denied message to the requesting user. The OPA decision log records the full input so that Otto Chriek can see exactly why the access was denied.

## Pattern 4: API gateway request authorisation via OPA sidecar

The API gateway (Kong) running in the `gateway` namespace uses an OPA sidecar for per-request authorisation. The sidecar runs as a container in the same pod as the Kong proxy. Kong calls the sidecar via the OPA REST API before forwarding requests upstream.

OPA sidecar configuration in the Kong deployment pod spec:

```
containers:
  - name: opa
    image: harbor.golems.internal/openpolicyagent/opa:0.68.0
    args:
      - run
      - --server
      - --addr=127.0.0.1:8181
      - --config-file=/etc/opa/config.yaml
      - --log-format=json
    ports:
      - containerPort: 8181
        name: opa-http
```

Input structure (sent by Kong's OPA plugin):

```
{
  "input": {
    "method": "POST",
    "path": "/v1/payments/transfer",
    "headers": {
      "Authorization": "Bearer eyJ...",
      "X-Forwarded-For": "10.0.1.45"
    },
    "parsed_path": ["v1", "payments", "transfer"],
    "parsed_body": {"amount": 50000, "currency": "AM$"}
  }
}
```

How errors reach users: Kong returns HTTP 403 with a JSON error body if OPA returns `false`. The error body includes the policy path that denied the request, to help API clients understand what is needed to gain access.

## Bundle distribution

All OPA instances receive policy updates via the OPA bundle API. Bundles are built and signed in the GitLab CI pipeline on every merge to `main` in the `golem-trust/opa-policies` repository.

Building and signing a bundle:

```
opa build policies/ data/ \
  --bundle \
  --signing-key /etc/ci/bundle-signing-key.pem \
  --signing-alg RS256 \
  --claims-file bundle-claims.json \
  --output bundle.tar.gz
```

The `bundle-claims.json` contains the bundle metadata:

```
{
  "iat": 1731578400,
  "iss": "gitlab-ci.golems.internal",
  "scope": "golem-trust-policies"
}
```

The signed bundle is uploaded to Hetzner Object Storage at `https://bundles.golems.internal/golem-trust-bundle.tar.gz`. All OPA instances poll this URL at the interval configured in `config.yaml` (minimum 60 seconds, maximum 120 seconds). OPA verifies the bundle signature against the public key configured under `keys` before activating it.

To verify that an OPA instance has activated the latest bundle, check the health endpoint's bundle status:

```
curl -s http://opa.golems.internal:8181/health?bundles=true | python3 -m json.tool
```

A successful activation shows a recent `last_successful_activation` timestamp. If the timestamp is stale by more than 5 minutes, check the OPA logs for bundle fetch errors and verify that the Hetzner Object Storage bucket is reachable from the OPA host.
Last updated: 20 March 2026
