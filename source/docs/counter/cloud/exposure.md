# Reduce cloud attack surface

Most cloud initial access exploits something that was knowable before the attack started: a public bucket,
an exposed credential, an enumerable tenant, or an integration that was granted more access than it needed.
Reducing the attack surface means systematically removing those known quantities.

## Object storage

### Audit public access settings

Every major cloud provider now offers account-level or project-level controls that block public access to
object storage regardless of per-bucket settings. Enabling these by default on every account that does not
explicitly need to serve public content is the appropriate baseline.

AWS: enable "Block Public Access" at the account level via the S3 console or:

```bash
aws s3control put-public-access-block \
  --account-id ACCOUNT-ID \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Azure: set the storage account's `allowBlobPublicAccess` property to `false` via policy or directly:

```bash
az storage account update \
  --name STORAGEACCOUNTNAME \
  --resource-group RESOURCEGROUP \
  --allow-blob-public-access false
```

GCP: enforce uniform bucket-level access and disable the legacy ACL system:

```bash
gsutil uniformbucketlevelaccess set on gs://BUCKET-NAME
```

### Audit existing buckets

Run a full audit of every storage account and bucket to confirm no unintended public access exists.
Many public buckets were made public deliberately for a specific use case and never reviewed again.

Use AWS Config rules, Azure Policy, and GCP Organization Policy to enforce access control standards
and alert on deviations. Treat any storage resource with public access that is not explicitly in
an approved register as a misconfiguration to be remediated.

### Secrets in repositories

Scan public GitHub and GitLab repositories belonging to an organisation and its employees for
committed credentials. Use a tool that searches commit history, not just the current branch:

```bash
trufflehog github --org=YourOrg --only-verified
```

Enable secret scanning in your GitHub organisation settings. GitHub secret scanning will alert
on known credential patterns pushed to any repository in an organisation, including private ones.

Rotate any credential that has been committed to a repository, regardless of when it was committed
and regardless of whether the repository was private at the time. Treat committed credentials as
compromised.

## Identity and access

### Disable legacy authentication

Legacy authentication protocols (Basic Auth against Exchange, IMAP, POP3, SMTP) bypass conditional
access policies and MFA. In Microsoft 365, block them via a conditional access policy:

Set condition: "Client apps: Exchange ActiveSync clients + Other clients (legacy auth)."
Set access control: "Block access."

Monitor for any legacy authentication attempts before blocking to identify affected users and
applications. Give a transition period for legitimate legacy clients (printers, scanners, old
email clients), then block unconditionally.

### Restrict OAuth user consent

By default, Microsoft 365 permits users to grant OAuth applications access to their data without
admin approval. This means any user can authorise a malicious application to read their email,
access their files, and act on their behalf.

In the Azure portal under Azure Active Directory > Enterprise Applications > Consent and permissions:
set "Users can consent to apps accessing company data on their behalf" to "No." Require admin
consent for all OAuth applications.

In Google Workspace under Security > API controls: configure which OAuth scopes users can consent
to themselves and which require admin approval. At minimum, restrict consent for sensitive scopes
including Gmail, Drive, and Admin SDK.

### Enforce MFA for all accounts

Enforcing MFA through conditional access policy is more reliable than user-level MFA registration
settings. A conditional access policy that requires MFA for all cloud access applies regardless
of whether the individual user has set up MFA in their profile.

Include service accounts and break-glass accounts in the MFA review. Service accounts that cannot
use interactive MFA are better protected with certificate-based authentication or managed
identity.

### Least privilege on IAM roles

Review IAM role assignments against what is actually needed. The most common finding is that roles
were assigned with a broad permission set during initial setup and never narrowed.

AWS: use IAM Access Analyzer and AWS CloudTrail to generate least-privilege policies based on
actual access patterns over the past 90 days.

Azure: use Azure AD Access Reviews to periodically recertify role assignments. Set up regular
review cycles for privileged roles including Global Administrator, User Administrator, and
application-specific owners.

GCP: use Policy Insights and recommender API to identify overly permissive bindings.

## Service principals and managed identities

Workload identities (managed identities, service principals, instance profiles, and cloud
service accounts) are non-interactive by design. They do not go through MFA, and
conditional access policies that require MFA or a compliant device do not apply to calls
made under them. They often carry broader permissions than any individual user, because
they were sized for a service function, and narrowing them after initial deployment is
rarely prioritised.

### Instance metadata service

Azure, AWS, and GCP VMs and containers retrieve their attached credential via the instance
metadata service (IMDS): a link-local HTTP endpoint at 169.254.169.254, accessible from
within the instance and from any process running on it. SSRF vulnerabilities in web
applications on cloud VMs are routinely escalated to cloud credential theft via this path.

The credential retrieved varies by provider:

- AWS: temporary STS credentials for the attached IAM role, at
  `/latest/meta-data/iam/security-credentials/<role-name>`
- Azure: an OAuth access token for the assigned managed identity, at
  `/metadata/identity/oauth2/token`
- GCP: an OAuth access token for the attached service account, at
  `/computeMetadata/v1/instance/service-accounts/default/token`

All three credentials are valid from any IP. An attacker who retrieves one via SSRF can
make authenticated API calls from their own infrastructure.

*A web application running on an EC2 instance has an SSRF vulnerability. The attacker
fetches `http://169.254.169.254/latest/meta-data/iam/security-credentials/webapp-role`
and receives valid temporary AWS credentials. From their own machine they run
`aws sts get-caller-identity` to confirm validity, then enumerate storage and IAM. The
attacker's IP has never appeared in the account before. CloudTrail logs all calls under
the instance role's identity, not the attacker's.*

AWS IMDSv2 mitigates this by requiring a PUT request to obtain a session token before any
GET request, defeating simple SSRF. Enforcing IMDSv2 on all instances and blocking
outbound requests from web application processes to 169.254.169.254 at the network level
are the primary controls.

### Service principal hardening

For Entra ID service principals, several hardening points rarely appear in default
configurations.

Prefer system-assigned managed identities over client secrets where the workload runs in
Azure. Managed identities rotate their own credentials automatically; client secrets do
not.

Where client secrets are unavoidable, certificate credentials are worth preferring. A
certificate is harder to exfiltrate as a plain string than a 40-character secret and
supports shorter validity periods.

Set expiry dates on all client secrets and audit them as they approach expiry. A secret
that has never been rotated since it was created is effectively
a long-term credential regardless of whether it was technically set to expire in two years.

Restricting which network locations a service principal can authenticate from, using named
locations in Conditional Access, reduces the window for credential abuse.

### Managed identity privilege scoping

Managed identities are often assigned roles at the subscription or resource group level
for convenience during initial deployment and never narrowed. An identity assigned
`Contributor` at the subscription level has write access to every resource in the
subscription, including other managed identities.

Auditing what managed identities exist and what roles they hold is a routine part of cloud
IAM review:

```bash
az role assignment list --all \
  --query "[?principalType=='ServicePrincipal'].{Principal:principalName,Role:roleDefinitionName,Scope:scope}" \
  --output table
```

The review question for each row: does this workload actually need this role at this
scope? `Storage Blob Data Reader` on a specific container is a different exposure from
`Contributor` at the subscription.

### Workload identity federation

Workload identity federation (Azure Federated Identity Credentials, GCP Workload Identity
Federation) allows external workloads such as GitHub Actions pipelines or Kubernetes pods
to exchange short-lived tokens for cloud credentials without storing a secret. Correctly
configured, it removes the long-lived credential entirely. Incorrectly configured, it
allows any principal that can obtain the expected external token to authenticate as the
cloud identity.

The common misconfiguration is a subject claim that does not constrain the authenticating
context precisely enough. A federation policy scoped to a repository without specifying a
branch or environment allows any pipeline trigger in that repository to authenticate as
the cloud identity. The difference between `repo:org/specific-repo:ref:refs/heads/main` and
`repo:org/specific-repo:environment:production`: one authenticates on a specific branch, the
other on a specific deployment environment. Auditing federation
policies against the principle of least privilege follows the same logic as auditing RBAC
role assignments: what specifically needs to authenticate, and does the subject claim
match that exactly?

## SaaS and integrations

### Audit OAuth applications

Review the OAuth applications that have been granted access to your Microsoft 365 and Google
Workspace tenants. Remove applications that:

- Are not in active use
- Belong to vendors whose relationship has ended
- Were authorised by users who have since left
- Request more permissions than their stated function requires

In Microsoft 365, review under Azure Active Directory > Enterprise Applications. In Google Workspace,
review under Security > API controls > Manage third-party app access.

### Restrict self-registration in SaaS tools

Review which SaaS platforms in use permit external self-registration or guest access. Slack, Notion,
Confluence, and similar collaboration tools sometimes have workspace settings that allow anyone with
a link to join, or allow users to invite external guests without approval.

Require approval for all new user invitations and guest access grants. Disable self-join links.
Audit existing guest and external accounts against the list of approved vendors and contractors.

## Related

- [OAuth scopes as blast radius](oauth-scopes.md)
- [Cloud detection signals](detection.md)
- [Serverless and cloud-native evasion](../evasion/serverless.md)