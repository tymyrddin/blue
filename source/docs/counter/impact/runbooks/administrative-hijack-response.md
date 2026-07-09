# Administrative hijack: response runbook

Response when the adversary brings no tools and turns an organisation's own trusted policies,
automation, and native utilities against it: a weaponised policy change, or a trusted job given one
more legitimate instruction. Pairs with the [administrative-hijack](../administrative-hijack.md)
family.

## Hunt the shape, not the act

Detection finds nothing because there is no intrusion: native tools, valid certificates, signed
policy, scheduled jobs. Pull the change history and look for what moved without a ticket:

- Entra audit log: `Update conditional access policy` or `Update policy`, with the actor and timestamp
- AWS CloudTrail: `PutUserPolicy`, `AttachRolePolicy`, `PutBucketReplication`, `CreatePolicyVersion`
- Backup and replication: diff the current job config against the last known-good export
- Scheduler: tasks created or edited in the window (`schtasks /query /v`, a cron diff)
- A privileged token or service principal used for a config change off-hours

Join each change against the change-management record. A change with no ticket is the lead.

## Contain the defensive squeeze (rules turned up)

- Identify the policy change that locked the estate down: actor, timestamp, and scope from the policy
  audit log.
- Revert it on a path the frozen controls do not gate, using break-glass if the normal change
  pipeline is itself frozen.
- Treat the lockdown as an incident even though every part of it is compliant; the absent alert is
  the point.

## Contain the housekeeping drain (tools turned outward)

- Identify the altered job and its added destination or widened scope. The change is usually one line:
  a second replication target, a broader collection filter, a new bucket in the policy.
- Choose between aborting mid-run (stops the leak, leaves data unprotected, tips off the adversary)
  and revoking the credential or certificate the job runs under (stops everything that uses it). Both
  cost; choose with the trade in view.
- Assume data already moved is compromised, and check whether the same hand rotated a key during the
  run, a new key version with no ticket behind it.

## After

- Baseline privileged automation, and alert on config changes to it. Schedulers, backup and
  replication utilities, and the policy pipeline are high-value targets, because a valid token on any
  of them needs no malware.
- Make a security-tightening change reviewable and reversible like any other change.
