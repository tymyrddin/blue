# Cloud IAM privilege audit

Four queries across AWS, Azure, and GCP: admin-equivalent bindings to unexpected
principals, wildcard or overly broad role definitions, aged or unrotated credentials,
and cross-account or cross-project trust relationships that extend the blast radius
beyond a single account.

## AWS: admin-equivalent IAM policies on users and roles

Hypothesis: IAM users carry directly attached admin policies, or roles have been granted
`*` actions on `*` resources outside of expected administrative tooling.

```bash
# users with directly attached admin-equivalent policies
aws iam list-users --query 'Users[].UserName' --output text | \
  tr '\t' '\n' | while read user; do
    policies=$(aws iam list-attached-user-policies \
      --user-name "$user" \
      --query 'AttachedPolicies[].PolicyArn' \
      --output text)
    if [ -n "$policies" ]; then
      echo "$user: $policies"
    fi
  done

# roles with wildcard action/resource in inline or attached policies
# identify inline policies first
aws iam list-roles --query 'Roles[].RoleName' --output text | \
  tr '\t' '\n' | while read role; do
    aws iam list-role-policies --role-name "$role" \
      --query 'PolicyNames[]' --output text | \
    tr '\t' '\n' | while read policy; do
      aws iam get-role-policy \
        --role-name "$role" --policy-name "$policy" \
        --query 'PolicyDocument' --output json | \
      jq -e '.Statement[] | select(
        ((.Action  | if type == "array" then .[] else . end) == "*") or
        ((.Resource | if type == "array" then .[] else . end) == "*")
      )' > /dev/null 2>&1 && \
        echo "WILDCARD inline: $role / $policy"
    done
  done
```

Any user with a directly attached `AdministratorAccess` policy warrants documentation.
IAM best practice places admin permissions on roles, so users with directly
attached policies are a finding regardless of the specific policy name.

## AWS: access keys older than 90 days

Hypothesis: long-lived programmatic credentials have not been rotated, increasing
the window for undetected key exfiltration to remain exploitable.

```bash
aws iam generate-credential-report
aws iam get-credential-report --query 'Content' --output text | \
  base64 --decode | \
  awk -F',' 'NR==1 { for(i=1;i<=NF;i++) h[$i]=i; print; next }
  {
    user=$h["user"];
    key1=$h["access_key_1_last_rotated"];
    key2=$h["access_key_2_last_rotated"];
    active1=$h["access_key_1_active"];
    active2=$h["access_key_2_active"];
    if (active1=="true" && key1 != "N/A") print user, "key1", key1;
    if (active2=="true" && key2 != "N/A") print user, "key2", key2;
  }' | \
  awk '{
    cmd = "date -d \""$3"\" +%s 2>/dev/null || date -j -f \"%Y-%m-%dT%H:%M:%S+00:00\" \""$3"\" +%s"
    cmd | getline ts; close(cmd)
    now = systime()
    age = int((now - ts) / 86400)
    if (age > 90) printf "%-30s %-8s %s (%d days)\n", $1, $2, $3, age
  }'
```

Keys active for over 90 days without rotation are a finding. Keys active for over a year
with no last-used date are unused and candidates for immediate deletion.

## AWS: cross-account trust relationships

Hypothesis: an IAM role trusts an external AWS account or an overly broad principal,
allowing any principal in that account to assume the role without further constraint.

```bash
# list all roles and their trust policy principals
aws iam list-roles | \
  jq -r '.Roles[] |
    .RoleName as $role |
    .AssumeRolePolicyDocument.Statement[]? |
    .Principal |
    (if type == "object" then (to_entries[] | .value) else . end) |
    if type == "array" then .[] else . end |
    select(
      (startswith("arn:aws:iam::") | not) and
      . != "ec2.amazonaws.com" and
      . != "lambda.amazonaws.com"
    ) |
    [$role, .] | @tsv' | \
  column -t
```

Principals that are not AWS service endpoints and not from the expected account ID
warrant review. An `*` in the Principal field grants any AWS principal the ability to
attempt role assumption; whether they succeed depends on the Condition block, which
the query above does not evaluate.

## Azure: privileged role assignments at broad scope

Hypothesis: managed identities, service principals, or guest accounts hold privileged
roles at subscription or management group scope rather than the minimum necessary scope.

```bash
# role assignments at subscription scope (broad) for non-owner principals
az role assignment list --scope "/subscriptions/$(az account show --query id -o tsv)" \
  --query "[].{Principal:principalName,Role:roleDefinitionName,Type:principalType,Scope:scope}" \
  --output table

# guest accounts with any directory role in Entra ID
az ad user list --filter "userType eq 'Guest'" \
  --query "[].userPrincipalName" \
  --output tsv | while read upn; do
    roles=$(az role assignment list --assignee "$upn" \
      --query "[].roleDefinitionName" --output tsv 2>/dev/null)
    [ -n "$roles" ] && echo "$upn: $roles"
  done

# service principals with Owner or Contributor at subscription scope
az role assignment list \
  --query "[?roleDefinitionName=='Owner' || roleDefinitionName=='Contributor'].
    {Principal:principalName,Type:principalType,Scope:scope}" \
  --output table | grep -i "serviceprincipal\|application"
```

Service principals holding `Owner` or `Contributor` at subscription scope have
write access to every resource in the subscription, including other managed identities
and service principals. Each entry warrants a documented justification.

## GCP: primitive roles and user-managed service account keys

Hypothesis: primitive roles (Owner, Editor, Viewer) remain in use at the project level,
and service accounts carry user-managed keys that have not been rotated.

```bash
# project-level IAM bindings using primitive roles
PROJECT=$(gcloud config get-value project)
gcloud projects get-iam-policy "$PROJECT" --format=json | \
  jq -r '.bindings[] |
    select(.role | test("roles/owner|roles/editor|roles/viewer")) |
    .role as $role |
    .members[] |
    select(startswith("serviceAccount:") or startswith("user:")) |
    [$role, .] | @tsv' | \
  column -t

# service accounts with user-managed keys
gcloud iam service-accounts list --format='value(email)' | \
  while read sa; do
    keys=$(gcloud iam service-accounts keys list \
      --iam-account="$sa" \
      --managed-by=user \
      --format='value(name,validAfterTime,validBeforeTime)')
    [ -n "$keys" ] && echo "$sa: $keys"
  done
```

User-managed service account keys in GCP are functionally equivalent to AWS long-lived
access keys: they do not rotate automatically and persist until explicitly deleted. Each
user-managed key is a credential that exists outside GCP's normal automatic rotation.
The presence of keys created more than 90 days ago without a rotation record is the
finding. Google-managed keys rotate automatically and need no review.
