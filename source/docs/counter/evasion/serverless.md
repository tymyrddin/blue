# Serverless and cloud-native evasion

Serverless functions remove the host from the attacker's perspective and from the defender's. There is no
persistent machine to compromise, no process tree to record, and no EDR agent monitoring execution.
Everything the function does is observable only through cloud provider audit logs. If those logs are not
collected and monitored, nothing else is.

## The missing telemetry layer

On a traditional host, an attacker contends with EDR telemetry: process creation, file access, network
connections, registry modifications, memory scanning. The BYOVD and fileless evasion techniques covered
elsewhere in this section assume that telemetry layer exists and attempt to disable or avoid it.

In a Lambda function, a Cloud Run job, or an Azure Function, that layer never existed. The execution
environment is a container lasting seconds to minutes, destroyed after completion, leaving no persistent
artefact on any host. No kernel hooks, no memory scanner, no process auditing.

What remains is the cloud control plane. AWS CloudTrail, Azure Monitor Activity Log, and GCP Cloud Audit
Logs record every API call made by and against the function. This is the only detection surface.

## Attack patterns specific to serverless

IAM role abuse: every function executes with an attached execution role. If that role is overprivileged,
the function becomes an API gateway into the cloud environment. An attacker who can execute arbitrary code
in the function can call any service the role permits (S3, DynamoDB, Secrets Manager, STS) without
triggering any endpoint detection.

```bash
# within a Lambda execution context, role credentials are environment variables
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
# any service the execution role permits is accessible from here
curl "http://169.254.170.2$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI"
```

Exfiltration through function outputs: functions are expected to make outbound network connections.
An attacker who can influence function code or its input can exfiltrate data to an attacker-controlled
endpoint through what appears to be a legitimate-looking outbound call. VPC-based functions with
restrictive egress limit this; functions with direct internet access do not.

Persistence via code modification: CloudTrail records `UpdateFunctionCode` events. An attacker with
sufficient IAM permissions can modify function code to add a backdoor. The modified function is then
invoked by normal triggers, with no visible change to monitoring systems unless they watch for update
events specifically.

Event injection: functions are triggered by events: HTTP requests, queue messages, S3 notifications,
scheduled invocations. If the function processes untrusted input without validation, the event payload
is the injection surface. There is no persistent filesystem to write to, but the function can still
exfiltrate from memory, call other services, and modify cloud resources within its IAM boundary.

Credential harvesting from environment variables: Lambda environment variables frequently contain
secrets placed there at deployment time. An attacker with code execution reads all environment variables
in a single call. Secrets Manager and Parameter Store are the safer alternatives, but adoption is uneven.

## Cloud audit log signals

Unusual IAM calls are the primary signal. If a function's execution role normally only accesses a
specific S3 bucket and DynamoDB table, a call to Secrets Manager, `sts:AssumeRole`, or
`ec2:DescribeInstances` is immediately anomalous. Baselining what each function's role is expected
to call and alerting on deviations is the most reliable detection available.

```bash
# identify what API calls a Lambda function's execution role has actually made over 90 days
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=AROA-FUNCTION-ROLE-ID \
  --start-time "$(date -d '90 days ago' --iso-8601=seconds)" \
  --query 'Events[*].[EventTime,EventName,EventSource]' \
  --output table
```

Code modification events indicate the function was changed. `UpdateFunctionCode` (AWS),
`projects.locations.functions.patch` (GCP), and function deployment events in Azure are detectable
and worth alerting on when the principal is not the CI/CD service account.

Invocation anomalies: unusual invocation times, unusual sources, unusually long execution duration,
or error spikes from malformed inputs indicate exploitation attempts or compromised triggers. Functions
that run significantly longer than their baseline duration may be staging data or mining.

New outbound destinations: for functions running in a VPC with VPC Flow Logs enabled, connections to
IPs outside the expected range are detectable. Functions without VPC networking offer less signal here.

## The honest gaps

In-memory operations during function execution are invisible. An attacker who reads and exfiltrates data
within a single function invocation, without making unusual IAM calls and without touching unexpected
services, leaves no signal beyond the invocation record. The content of execution is not logged by any
cloud provider.

Short-lived STS credentials tied to the execution role, once exfiltrated, generate CloudTrail events
only when they are used, and only in the account where the function runs. A sophisticated attacker
may use them sparingly or from an intermediary account to lengthen the trail.

Functions with unrestricted internet egress are a persistent blind spot. If the execution role permits
the function to make HTTP requests to arbitrary external endpoints, data exfiltration through an
outbound call is structurally indistinguishable from a legitimate API call. There is no equivalent to
endpoint DLP in the serverless execution environment.

## Hardening the execution environment

The execution role is the primary control surface. Scope it to exactly the resources the function touches:
resource ARNs rather than `*` wildcards, specific actions. A function
that reads from one S3 bucket and writes to one DynamoDB table needs exactly those two permissions.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::specific-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem"],
      "Resource": "arn:aws:dynamodb:eu-west-1:123456789:table/specific-table"
    }
  ]
}
```

Avoid granting functions the ability to update their own code, to call `sts:AssumeRole`, or to modify
IAM policies. A function with `sts:AssumeRole` can step outside its own permission boundary. A function
with `lambda:UpdateFunctionCode` on itself can replace its own logic after deployment.

Enable CloudTrail in every region, including those not actively used. Alert on `UpdateFunctionCode`
events from principals other than the CI/CD service account. Alert on function invocations by unusual
principals or at unusual times relative to the function's normal invocation pattern.

Place functions in a VPC with restrictive security groups and specific egress rules where the function's
external dependencies are known. For functions that do not need internet access at all, the VPC boundary
with no internet gateway is the strongest egress control available.

## Related

- [Serverless pipeline security](../../dev/devsecops/notes/functions.md)
- [Cloud defence: IAM hardening and OAuth controls](../cloud/exposure.md)
- [Cloud detection signals](../cloud/detection.md)
- [BYOVD detection](runbooks/byovd-detection.md)
