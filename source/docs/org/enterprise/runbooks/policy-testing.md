# Policy testing

Policies are code, and code that is not tested is code that will surprise you. Otto Chriek established the rule early in the OPA deployment: no policy reaches production without passing tests, and no test suite achieves deployment without 80% coverage. He is not unreasonable about the threshold; he simply points out that a policy with no test suite is evidence in an ISO 27001 audit that controls may not be working, and he would rather not explain that to an auditor. This runbook covers the OPA test framework, test patterns, coverage reporting, GitLab CI integration, Conftest for Terraform testing, and the Gatekeeper CLI for constraint template testing.

## OPA built-in test framework

OPA's test runner discovers any rule whose name begins with `test_` in a package. Tests are placed in files alongside the policies they test, conventionally named `<policy>_test.rego`:

```
package golem_trust.terraform.rds_test

import rego.v1

import data.golem_trust.terraform.rds

test_deny_unencrypted_rds if {
    result := rds.violations with input as {
        "resource_changes": [{
            "address": "aws_db_instance.payments",
            "type": "aws_db_instance",
            "change": {
                "actions": ["create"],
                "after": {
                    "storage_encrypted": false,
                    "engine": "postgres",
                    "parameter_group_name": "default.postgres15"
                }
            }
        }]
    }
    count(result) == 1
    result[_] == "RDS instance 'aws_db_instance.payments' must have storage_encrypted = true (Royal Bank requirement GTF-DB-001)"
}

test_allow_encrypted_rds if {
    result := rds.violations with input as {
        "resource_changes": [{
            "address": "aws_db_instance.payments",
            "type": "aws_db_instance",
            "change": {
                "actions": ["create"],
                "after": {
                    "storage_encrypted": true,
                    "engine": "postgres",
                    "parameter_group_name": "TLS.postgres15"
                }
            }
        }]
    }
    count(result) == 0
}
```

Run the tests from the policies directory:

```
opa test policies/ --verbose
```

A passing suite looks like:

```
PASS: 14/14
```

A failing test reports the rule name and the reason:

```
FAIL: test_deny_unencrypted_rds (policies/rds_test.rego:5)
```

## Test naming and structure conventions

At Golem Trust, the convention is:

- `test_allow_<scenario>`: asserts that a compliant input is permitted
- `test_deny_<scenario>`: asserts that a non-compliant input is rejected, and checks the violation message text
- `test_allow_edge_<scenario>`: covers edge cases where a less careful policy might incorrectly deny

Every `test_deny_` test must assert both that violations are non-empty and that at least one violation message matches the expected text. Checking only the count is insufficient; a policy with a typo in the message string will still pass a count-only test.

## Coverage reporting

Run tests with coverage to identify untested branches:

```
opa test policies/ --coverage --format=json | python3 -m json.tool > coverage.json
opa test policies/ --coverage
```

The coverage output shows per-file and per-rule coverage percentages. Rules with 0% coverage are flagged in the GitLab CI pipeline as a blocking issue. The 80% threshold is enforced by a small Python script in the pipeline that parses the JSON coverage output:

```
import json, sys

with open("coverage.json") as f:
    data = json.load(f)

overall = data["coverage"]
if overall < 80.0:
    print(f"Policy test coverage {overall:.1f}% is below the required 80%")
    sys.exit(1)

print(f"Coverage: {overall:.1f}%  OK")
```

## GitLab CI integration

The policy testing pipeline stage runs on every merge request and every push to `main`. The `.gitlab-ci.yml` stage:

```
policy-tests:
  stage: test
  image: harbor.golems.internal/openpolicyagent/opa:0.68.0
  script:
    - opa fmt --diff policies/
    - opa test policies/ --verbose
    - opa test policies/ --coverage --format=json > coverage.json
    - python3 ci/check-coverage.py
  artifacts:
    paths:
      - coverage.json
    when: always
```

Otto Chriek receives a weekly summary from GitLab showing the policy coverage trend. A drop below 80% on `main` triggers a Slack notification to the security team channel.

## Conftest for Terraform plan testing

Conftest wraps OPA and provides a friendlier interface for testing Terraform plans in CI:

```
terraform plan -out=tfplan.binary
terraform show -json tfplan.binary > tfplan.json
conftest test tfplan.json --policy policies/terraform/
```

Conftest discovers all `.rego` files in the policy directory. The pipeline step in the Terraform CI stage:

```
terraform-policy-check:
  stage: validate
  image: harbor.golems.internal/instrumenta/conftest:0.50.0
  script:
    - terraform init -backend=false
    - terraform plan -out=tfplan.binary
    - terraform show -json tfplan.binary > tfplan.json
    - conftest test tfplan.json --policy policies/terraform/ --output table
```

A failing check looks like:

```
FAIL - tfplan.json - golem_trust.terraform.rds - RDS instance 'aws_db_instance.payments'
       must have storage_encrypted = true (Royal Bank requirement GTF-DB-001)
```

The Terraform developer sees this message in the merge request pipeline log and knows precisely what to fix.

## Testing Gatekeeper ConstraintTemplates with gator

The `gator` CLI tests ConstraintTemplates without a running Kubernetes cluster. Install it from the internal mirror:

```
curl -fsSL https://artifacts.golems.internal/gator/v3.17.1/gator_linux_amd64 \
  -o /usr/local/bin/gator
chmod 755 /usr/local/bin/gator
```

Organise test suites under `gatekeeper/tests/`. A test suite file defines the template, constraint, and test cases:

```
kind: Suite
apiVersion: test.gatekeeper.sh/v1alpha1
metadata:
  name: no-root-containers
tests:
  - name: pod-running-as-root-denied
    template: ../../templates/golemtrustnoroot-template.yaml
    constraint: ../../constraints/no-root-containers.yaml
    cases:
      - name: root-pod-denied
        object: cases/root-pod.yaml
        assertions:
          - violations: yes
      - name: nonroot-pod-allowed
        object: cases/nonroot-pod.yaml
        assertions:
          - violations: no
```

Run the test suite:

```
gator verify gatekeeper/tests/
```

The `gator` tests run in the GitLab CI pipeline alongside the OPA unit tests. Otto Chriek's requirement is clear: all three test types (OPA unit tests, Conftest plan tests, gator constraint tests) must pass before any policy change is merged.
Last updated: 20 March 2026
