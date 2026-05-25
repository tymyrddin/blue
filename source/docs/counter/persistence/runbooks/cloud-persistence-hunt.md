# Cloud persistence hunting

Enumerating and investigating persistence mechanisms implanted at the cloud
control-plane level: IAM entities, compute backdoors, storage manipulation,
CI/CD pipeline modification, and cloud function abuse.

## AWS: enumerate unexpected IAM state

```bash
# generate a credential report (includes all users and their credential state)
aws iam generate-credential-report
aws iam get-credential-report --query 'Content' --output text | base64 -d | column -t -s ','

# look for users with no console access but active access keys
# (common pattern for backdoor service accounts)
aws iam list-users --output json | python3 -c "
import json, sys
from datetime import datetime, timezone

users = json.load(sys.stdin)['Users']
for u in users:
    last_used = u.get('PasswordLastUsed', 'never')
    print(f\"{u['UserName']:40} created: {u['CreateDate']}  last_password: {last_used}\")
"
```

```bash
# check for recently attached policies (unusual privilege escalation)
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AttachRolePolicy \
  --start-time "$(date -d '30 days ago' --iso-8601=seconds)" \
  --output json | python3 -c "
import json, sys
events = json.load(sys.stdin)['Events']
for e in events:
    detail = json.loads(e['CloudTrailEvent'])
    params = detail.get('requestParameters', {})
    print(e['EventTime'], e.get('Username','?'),
          params.get('roleName','?'), params.get('policyArn','?'))
"
```

## AWS: Lambda and cloud functions

Lambda functions can be used as persistent execution platforms. They run on
AWS infrastructure rather than a host you control, survive host reimaging, and
can be triggered by many event sources.

```bash
# list all Lambda functions
aws lambda list-functions \
  --query 'Functions[*].[FunctionName,Runtime,LastModified,Role]' \
  --output table

# look for functions modified outside deployment windows
aws lambda list-functions --output json | python3 -c "
import json, sys
from datetime import datetime
funcs = json.load(sys.stdin)['Functions']
for f in funcs:
    print(f['LastModified'], f['FunctionName'], f['Runtime'])
" | sort

# review the execution role of any suspicious function
aws lambda get-function-configuration --function-name FUNCTION_NAME \
  --query '[Role, Environment.Variables]'
```

A Lambda function with an execution role that has broad IAM permissions, or one
with environment variables containing credentials, warrants careful review.

## AWS: SSM Parameter Store and Secrets Manager

Parameters modified outside the change management process can be a persistence
vector if applications read them on startup.

```bash
# list all parameters with their last-modified date
aws ssm describe-parameters \
  --query 'Parameters[*].[Name,LastModifiedDate,LastModifiedUser,Type]' \
  --output table | sort -k2

# check CloudTrail for PutParameter events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=PutParameter \
  --start-time "$(date -d '7 days ago' --iso-8601=seconds)" \
  --query 'Events[*].[EventTime,Username,Resources[0].ResourceName]' \
  --output table
```

## AWS: S3 bucket policy changes

Bucket policies modified to allow public access or cross-account access can be
used to stage payloads or exfiltrate data persistently.

```bash
# check for buckets with public access
aws s3api list-buckets --query 'Buckets[*].Name' --output text |
  tr '\t' '\n' | while read bucket; do
    result=$(aws s3api get-bucket-acl --bucket "$bucket" \
      --query 'Grants[?Grantee.URI==`http://acs.amazonaws.com/groups/global/AllUsers`]' \
      --output text 2>/dev/null)
    [[ -n "$result" ]] && echo "PUBLIC ACL: $bucket -- $result"
  done

# check CloudTrail for bucket policy changes
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=PutBucketPolicy \
  --start-time "$(date -d '30 days ago' --iso-8601=seconds)" \
  --output table
```

## Azure: function apps and logic apps

```bash
# list all function apps
az functionapp list --query '[*].[name,resourceGroup,state,lastModifiedTimeUtc]' -o table

# check for function apps with recently modified code
# (use deployment history rather than az cli for code content)
az functionapp deployment list-publishing-profiles --name FUNCNAME \
  --resource-group RG --query '[*].[publishMethod,lastModified]'
```

## CI/CD: GitHub Actions

Pipeline definitions are a persistence vector when the pipeline carries cloud
credentials. A step added to an existing workflow will execute with those
credentials on every pipeline run.

```bash
# list recent workflow file changes (git-based approach on the repo)
git log --all --name-only --format='%H %ae %ad' -- '.github/workflows/**'

# or via GitHub API
gh api repos/ORG/REPO/commits \
  --jq '.[] | select(.files[]?.filename | startswith(".github/workflows/")) |
        {sha: .sha, author: .commit.author.email, date: .commit.author.date,
         message: .commit.message}'

# show the diff of a specific workflow change
gh api repos/ORG/REPO/commits/COMMIT_SHA \
  --jq '.files[] | select(.filename | startswith(".github/workflows/")) | .patch'
```

When reviewing a modified workflow, look for:
- New steps with unusual names (`Cache dependency validation`, `Environment setup`)
- Steps that run shell commands referencing `$AWS_*`, `$AZURE_*`, `$TOKEN`, or
  similar environment variables
- Steps that use `|| true` to suppress error output
- Steps calling external URLs not matching known CDN or tool providers

## CI/CD: secrets access audit

```bash
# GitHub: list secrets and their last-updated date
gh api repos/ORG/REPO/actions/secrets \
  --jq '.secrets[] | {name: .name, updated_at: .updated_at}'

# check Actions audit log for secret access (requires org audit log API)
gh api orgs/ORG/audit-log \
  --paginate \
  --jq '.[] | select(.action | startswith("secret")) | {action, actor, repo, created_at}'
```

## Cloud detection correlation

Effective cloud persistence hunting requires correlating multiple signals:

| Signal                                                                    | What it indicates              |
|---------------------------------------------------------------------------|--------------------------------|
| IAM user created, no corresponding Jira/ServiceNow ticket                 | Potential backdoor account     |
| Lambda function modified outside deployment window                        | Code injection or new function |
| SSM parameter modified, application restarts spike shortly after          | Startup-hook persistence       |
| GitHub workflow modified, new external URL contacted in next pipeline run | CI/CD injection                |
| Service principal added to privileged group, no change request            | Identity persistence           |
| Bucket policy changed, new GetObject requests from external IP            | Data staging or exfiltration   |

Build detections around these correlations rather than individual events.
A single IAM user creation may be legitimate; an IAM user creation followed
within 24 hours by an access key creation and an `AssumeRole` call from an
external IP is a pattern worth escalating.
