# Compromised AWS credentials playbook (development environment)

## Trigger

Any of these indicates potentially compromised AWS credentials:
- AWS GuardDuty alert for unusual API activity or anomalous behaviour
- CloudTrail shows API calls from unexpected IP addresses or locations
- Unexpected resource creation (EC2 instances, S3 buckets, Lambda functions)
- User reports unexpected MFA prompts or password reset requests
- Unusual data transfer volumes or patterns
- Cryptocurrency mining alerts or performance degradation
- AWS sends notification about compromised credentials
- Credentials found in public GitHub repository or paste site
- Billing spike from unexpected resource usage

Single unusual API call: Investigate but might be legitimate (VPN, remote work).

Multiple indicators or confirmed exposure: Follow this playbook immediately.

## Immediate actions (first 10 minutes)

### 1. Identify what is compromised

Determine credential type:

IAM user access keys?
- Check: AWS Console → IAM → Users → Security credentials
- Look for: Access key ID that's compromised
- Note: Creation date and last used information

IAM user console password?
- Check: CloudTrail for console sign-in events
- Look for: Unusual console login locations or times
- Note: IP addresses and user agent

IAM role credentials (temporary)?
- Check: CloudTrail for AssumeRole calls
- Look for: Unusual role assumptions from unexpected sources
- Note: Which role and what instance/service assumed it

Root account?
- If root account compromised: This is critical. Escalate immediately to senior leadership.
- Follow this playbook but with extra urgency and thorough investigation.

### 2. Contain immediately

For compromised IAM user access keys:

```bash
# Disable the access key immediately (don't delete yet - need it for investigation)
aws iam update-access-key \
  --access-key-id AKIA... \
  --status Inactive \
  --user-name <username>
```

For compromised console password:

```bash
# Disable console access
aws iam delete-login-profile --user-name <username>

# Or via Console: IAM → Users → [username] → Security credentials → 
# Console password → Disable
```

For compromised IAM role:
- Attach an explicit `Deny all` policy to the role temporarily
- Or delete the role if it's not actively needed (check first!)

Document what you did and when: You'll need this for investigation.

### 3. Alert the response team

Notify immediately:
- Security team lead
- AWS account owner
- Development team lead (if dev credentials)
- CTO/senior management (if production or high-privilege account)

Initial status update:
```
AWS credential compromise detected at [time]
Account: [account ID / alias]
User/Role: [name]
Credential type: [access key / console / role]
Actions taken: [disabled key / blocked console]
Investigating: [unusual activity, resource creation]
```

---

## Investigation (Next 30 Minutes)

### 4. Assess the damage

Check CloudTrail for unauthorized activity:

```bash
# Get all events from compromised credentials in last 24 hours
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=<username> \
  --start-time <24h-ago> \
  --max-results 50

# Or via Console: CloudTrail → Event history → Filter by username
```

Look for suspicious API calls:
- Resource creation: RunInstances, CreateStack, CreateFunction, CreateBucket
- Privilege escalation: CreateUser, AttachUserPolicy, PutUserPolicy, CreateAccessKey
- Data access: GetObject, ListBucket, DescribeInstances, GetParameter
- Persistence: CreateUser, CreateRole, CreateAccessKey, UpdateAssumeRolePolicy
- Cryptocurrency mining: RunInstances with large instance types, unusual regions

Check what resources were created:

```bash
# List EC2 instances created recently
aws ec2 describe-instances \
  --filters "Name=launch-time,Values=2024-*" \
  --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,LaunchTime,State.Name]'

# List S3 buckets
aws s3 ls

# List Lambda functions
aws lambda list-functions

# Check for new IAM users or keys
aws iam list-users
aws iam list-access-keys --user-name <username>
```

Check for data exfiltration:

```bash
# Check S3 access logs (if enabled)
# Check CloudTrail for GetObject, ListBucket calls to sensitive buckets
# Check VPC Flow Logs for unusual outbound traffic

# Look for objects uploaded to S3 from unusual sources
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=PutObject
```

Review billing and usage:
- AWS Console → Billing Dashboard → Bill Details
- Look for: Unexpected resource usage, unusual regions, large instance types
- Note: Crypto mining often spikes EC2 costs dramatically

### 5. Identify persistence mechanisms

Check if attacker created backdoors:

```bash
# List all access keys for all users
aws iam list-users --query 'Users[*].UserName' --output text | \
  xargs -I {} aws iam list-access-keys --user-name {}

# Check for new IAM users created in timeframe
aws iam list-users --query 'Users[?CreateDate>=`2024-11-17`]'

# Check for policy changes
aws iam list-policies --scope Local --max-items 20

# Check assume role policy modifications
aws iam list-roles --query 'Roles[*].[RoleName,CreateDate]'
```

Look for:
- New IAM users or access keys created
- Modified IAM policies granting broader permissions
- New roles with trust relationships to external accounts
- Modified S3 bucket policies allowing public access
- Lambda functions with backdoor code
- EC2 instances with SSH keys or user data scripts

### 6. Determine blast radius

Answer these questions:

What access did the compromised credentials have?
- Check: IAM policies attached to user/role
- Note: Effective permissions (inline, attached, group membership)

What resources were accessible?
- S3 buckets (especially with sensitive data)
- EC2 instances and their data
- RDS databases
- Secrets in Secrets Manager or Parameter Store
- Code in CodeCommit repositories

What AWS accounts were accessible?
- Check: If credentials had cross-account access via AssumeRole
- Review: Trust relationships and role chaining

What data may have been exposed?
- Customer data in S3 or databases
- Source code in repositories
- Secrets, API keys, database credentials
- Configuration data revealing infrastructure

## Response actions (next 1-2 hours)

### 7. Terminate malicious resources

Delete unauthorised resources immediately:

```bash
# Terminate EC2 instances
aws ec2 terminate-instances --instance-ids i-xxxxx i-yyyyy

# Delete S3 buckets (be careful - verify they're malicious first)
aws s3 rb s3://suspicious-bucket-name --force

# Delete Lambda functions
aws lambda delete-function --function-name suspicious-function

# Delete CloudFormation stacks
aws cloudformation delete-stack --stack-name suspicious-stack
```

Before deleting, preserve evidence:
- Take snapshots of suspicious EC2 instances
- Copy logs from suspicious resources
- Document what you found and why you're deleting it

### 8. Revoke all attacker access

Delete attacker-created backdoors:

```bash
# Delete unauthorized IAM users
aws iam delete-user --user-name attacker-created-user

# Delete unauthorized access keys
aws iam delete-access-key \
  --access-key-id AKIA... \
  --user-name <username>

# Remove malicious IAM policies
aws iam delete-policy --policy-arn arn:aws:iam::...

# Revert policy changes to original state
```

Reset compromised account:

```bash
# Generate new access key for legitimate user
aws iam create-access-key --user-name <username>

# Create new console password
aws iam create-login-profile \
  --user-name <username> \
  --password <temporary-password> \
  --password-reset-required
```

Rotate related credentials:
- Any secrets the compromised credentials could access
- Database passwords
- API keys stored in Parameter Store or Secrets Manager
- SSH keys on accessible EC2 instances

### 9. Close security gaps

Fix what allowed the compromise:

If credentials were exposed in code:
- Remove credentials from GitHub/GitLab history (use git-filter-branch or BFG)
- Scan all repositories for other hardcoded credentials
- Implement pre-commit hooks to prevent credential commits
- Use AWS Secrets Manager or Parameter Store instead

If credentials were phished or stolen:
- Force password reset for the affected user
- Enforce MFA on all IAM users
- Review and strengthen password policies
- Implement IP allowlisting if feasible

If credentials had excessive permissions:
- Apply principle of least privilege
- Remove unnecessary permissions from the user/role
- Implement SCPs (Service Control Policies) to limit blast radius
- Use permission boundaries for IAM roles

If credentials were long-lived and unused:
- Audit all access keys: when created, when last used
- Delete unused keys older than 90 days
- Implement key rotation policy
- Use temporary credentials (IAM roles) where possible

## Communication

### To development team (within 1 hour)

```
Subject: Security Incident - AWS Credentials Compromised

AWS credentials for [user/role] were compromised and used by 
unauthorized parties.

What happened:
Credentials exposed [how - code leak/phishing/unknown], used to 
[create resources/access data/escalate privileges].

Current status:
- Compromised credentials disabled
- Unauthorized resources terminated
- Access revoked

Impact to development:
- [Specific resources affected]
- [Any downtime or service disruption]
- [Data access or exposure]

Actions you must take:
- Rotate any credentials you have access to
- Review recent deployments for unexpected changes
- Check your code for any hardcoded credentials
- Report anything suspicious

Next update: [timeframe]
```

### To management (within 2 hours)

Executive briefing should include:

What happened:
- AWS credentials for \[user/role] were compromised on \[date/time]
- Attacker \[created resources/accessed data/escalated privileges]

Business impact:
- Unauthorized AWS costs: $\[amount] (estimated)
- Data accessed: \[customer data/source code/none confirmed]
- Service disruption: \[yes/no - duration if applicable]
- Regulatory implications: \[data breach notification requirements if applicable]

Actions taken:
- Disabled compromised credentials immediately
- Terminated unauthorized resources
- Revoked attacker access and removed backdoors
- Investigating full scope of access

Current status:
- Contained: \[yes/no]
- Ongoing investigation: \[yes/no]
- Additional risks identified: \[yes/no - detail if yes]

Costs:
- Unauthorized resource usage: $\[amount]
- Investigation/remediation: $\[estimate]
- Total estimated impact: $\[total]

Prevention measures:
- \[Key fixes implemented or planned]
- Timeline for full remediation: \[date]

### To AWS (if needed)

Contact AWS Support (especially if root account compromised):
- AWS Console → Support → Create case
- Select: Account and billing support
- Category: Security
- Describe the incident and actions taken

AWS will help with:
- Identifying malicious activity in CloudTrail
- Recommendations for containment
- Assistance terminating resources
- Potentially waiving costs from unauthorized usage (case by case)

## Recovery (24-48 hours)

### 10. Validate containment

Confirm attacker is completely out:

Monitor for 48 hours:
- Watch CloudTrail for any suspicious activity resuming
- Check for new resource creation in unusual regions
- Monitor billing for unexpected charges
- Review IAM changes daily

Verify no reinfection:
- Attacker hasn't regained access via other credentials
- No backdoors remain (new users, keys, policies, roles)
- No compromised instances still running

Check for lateral movement:
- Review other AWS accounts if you have multiple
- Check on-premise systems if they had AWS access
- Verify other cloud services if credentials allowed access

### 11. Full security review

Within one week, complete:

IAM audit:
- Review all IAM users (who needs access?)
- Check all access keys (when created? last used?)
- Verify MFA is enabled on all users
- Apply least privilege to all roles and users
- Delete unused users and keys

Policy review:
- Check for overly permissive policies
- Remove unnecessary wildcard permissions
- Implement permission boundaries
- Review cross-account trust relationships

Logging and monitoring:
- Verify CloudTrail is enabled in all regions
- Ensure CloudTrail logs are going to separate account
- Set up GuardDuty if not already enabled
- Create CloudWatch alarms for suspicious activities
- Enable S3 access logging on sensitive buckets

Resource inventory:
- Document all legitimate resources
- Tag resources by owner/project/environment
- Identify and remove orphaned resources
- Implement resource tagging policy

### 12. Document lessons learned

Within two weeks, review:
- How were credentials compromised?
- How was compromise detected?
- What was the response time at each stage?
- What worked well in the response?
- What slowed down or failed?
- What damage could have been prevented?
- What would we do differently?

Update this playbook based on findings.

## Prevention (ongoing)

### Critical fixes (implement immediately):

Eliminate hardcoded credentials:
- Never commit credentials to code repositories
- Use AWS Secrets Manager or Parameter Store
- Use IAM roles for EC2, Lambda, and ECS instead of access keys
- Implement pre-commit hooks to catch credentials

Enforce MFA:
```bash
# Create policy requiring MFA for all actions
# Attach to all users
```

Implement least privilege:
- Start with minimal permissions
- Add only what's needed
- Use managed policies where appropriate
- Regular access reviews (quarterly)

Enable detection:
- GuardDuty in all regions
- CloudTrail in all regions, logs in separate account
- CloudWatch alarms for suspicious activities:
  - Root account usage
  - Console sign-in failures
  - IAM policy changes
  - Access key creation
  - Unusual API calls

### Important fixes (implement this month):

Key rotation:
```bash
# Audit all access keys
aws iam generate-credential-report
aws iam get-credential-report --query 'Content' --output text | base64 -d

# Script to rotate keys older than 90 days
# Automate rotation where possible
```

Service Control Policies:
- Restrict regions (e.g., only allow eu-west-1, us-east-1)
- Block specific services not used in development
- Prevent disabling of security services
- Require MFA for sensitive actions

Implement IAM Access Analyzer:
- Identify resources shared with external entities
- Review findings weekly
- Resolve overly permissive access

Separation of environments:
- Use separate AWS accounts for dev/staging/production
- Implement AWS Organizations with SCPs
- No production data in development accounts
- Limited cross-account access

### Measure effectiveness:

Track these metrics monthly:
- Number of access keys per user (goal: ≤1 active)
- Age of oldest access key (goal: <90 days)
- Percentage of users with MFA enabled (goal: 100%)
- GuardDuty findings (goal: decreasing over time)
- Time to detect credential compromise (goal: <1 hour)
- Time to contain after detection (goal: <15 minutes)

## Decision points

### Do we need forensics?

Yes, if:
- Root account was compromised
- Production environment affected
- Customer data confirmed accessed
- Attacker had access for extended period (days/weeks)
- Sophisticated attack with persistence mechanisms
- Regulatory requirements mandate investigation

Probably not if:
- Development environment only
- Quick detection and containment
- Limited access and minimal damage
- Clear understanding of what happened

If yes: Preserve CloudTrail logs, EC2 snapshots, and all evidence before cleanup.

### Do we report this?

Contact AWS Support if:
- Root account compromised (always report this)
- Need help identifying unauthorized resources
- Want to request cost forgiveness for unauthorized usage
- Sophisticated attack and need AWS security team assistance

Report to authorities if:
- Customer data was accessed (GDPR, NIS2 reporting requirements)
- Production systems affected (sector-specific regulations)
- Attack originated from your infrastructure affecting others

Internal reporting:
- Security team (always)
- Management (always)
- Legal (if data breach or regulatory implications)
- Finance (for unexpected costs)
- Customers (if their data affected)

## Key contacts

| Role                  | Name | Email | Mobile | Backup |
|-----------------------|------|-------|--------|--------|
| AWS Account Owner     |      |       |        |        |
| Security Lead         |      |       |        |        |
| Development Lead      |      |       |        |        |
| CTO/Senior Tech       |      |       |        |        |
| Finance (for billing) |      |       |        |        |
| Legal (for breaches)  |      |       |        |        |
| External IR Firm      |      |       |        |        |

AWS Support: https://console.aws.amazon.com/support/  
AWS Account ID: \[your account ID]  
Cyber Insurance: \[Provider] - \[Policy #] - \[Contact]

## Tools & commands

Quick reference for common investigation tasks:

```bash
# Check recent console sign-ins
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin \
  --max-results 20

# List all IAM users and when they were created
aws iam list-users --query 'Users[*].[UserName,CreateDate]' --output table

# Find all access keys and when last used
aws iam list-users --query 'Users[*].UserName' --output text | \
  xargs -I {} bash -c 'echo "User: {}"; aws iam list-access-keys --user-name {} --query "AccessKeyMetadata[*].[AccessKeyId,Status,CreateDate]" --output table'

# Check for public S3 buckets
aws s3api list-buckets --query 'Buckets[*].Name' --output text | \
  xargs -I {} aws s3api get-bucket-acl --bucket {} --query 'Grants[?Grantee.URI==`http://acs.amazonaws.com/groups/global/AllUsers`]' --output text

# List all EC2 instances across all regions
for region in $(aws ec2 describe-regions --query 'Regions[*].RegionName' --output text); do
  echo "Region: $region"
  aws ec2 describe-instances --region $region --query 'Reservations[*].Instances[*].[InstanceId,State.Name,LaunchTime]' --output table
done
```

AWS tools:
- CloudTrail: Event history and API call logs
- GuardDuty: Threat detection service
- IAM Access Analyzer: Identifies resources shared externally
- Config: Resource configuration tracking
- Security Hub: Centralized security findings

External tools:
- git-secrets: Prevent committing credentials
- TruffleHog: Find credentials in git history
- AWS Vault: Secure credential storage
- Prowler: AWS security assessment

## Version Control

Current Version: 1.0  
Last Updated: \[Date]  
Next Review: \[Date in 6 months]  
Owner: \[Name]

Update after:
- Any AWS credential compromise incident (within 1 week)
- Changes to AWS account structure or security tools
- New AWS services adopted
- Quarterly minimum

## Appendix: Common attack patterns

Cryptocurrency mining:
- Large EC2 instances in unusual regions (often Asia-Pacific)
- Sudden billing spike
- CPU-intensive instances running continuously
- Network traffic to known mining pools

Data exfiltration:
- Large S3 GetObject API calls
- Data transferred to external buckets
- Database dumps to attacker-controlled storage
- Snapshots shared with external AWS accounts

Persistence mechanisms:
- New IAM users created with admin access
- Additional access keys created for existing users
- IAM roles with trust to external accounts
- Lambda functions with backdoor code
- Modified S3 bucket policies allowing public write

Privilege escalation:
- AttachUserPolicy calls granting admin rights
- CreateAccessKey for privileged users
- AssumeRole calls to escalate permissions
- Modified IAM policies expanding access

Resource hijacking:
- EC2 instances for crypto mining or botnet
- S3 buckets for hosting malicious content
- Lambda functions for attack infrastructure
- Compromised instances attacking other targets

Know your development team's typical patterns. Anomalies are easier to spot when you know what's normal.

```{raw} html
<div class="page-post-card__link">
    <a href="https://tymyrddin.dev/contact/">
      See something you like? Let’s create your custom playbook.
    </a>
</div>
```
