# Offboarding

Access does not stop automatically when someone leaves a team. Each credential type has its own persistence mechanism,
and none of them are revoked by removing someone from a Slack workspace or disabling their email account.

## Revocation

SSH keys. Every server the person had access to, every entry in `~/.ssh/authorized_keys`. This step is the most commonly
skipped: account deletion on one system does not propagate to SSH keys on others.

Sudo access. If sudo privileges were granted at the user level rather than through a group, the sudoers entry persists
after the account is removed from the login system.

Cloud credentials. IAM users, access keys, and role assumptions. A developer who had cloud access for a project retains
that access until explicitly revoked; leaving the organisation does not trigger it automatically.

API keys and service tokens. Keys generated under the person's account for third-party services: version control tokens,
deployment keys, webhook secrets, monitoring integrations.

Repository access. Permissions, deploy keys, and CI/CD integrations tied to the account.

SaaS accounts. Password manager membership, shared document systems, incident response tools, on-call rotations.

## The timing problem

There is a window between when a person stops being a team member and when access is fully revoked. In most cases,
offboarding happens during notice periods or after the fact, which extends the window.

A departing employee who knows they are leaving has time to act before access is removed. Immediate revocation of the
highest-privilege access on the day of departure, with lower-priority items following shortly after, reflects the
relative risk. The order of priority: production server SSH keys and cloud admin credentials first, everything else
within a short window.

## Shadow credentials

Credentials the team does not know about cannot be revoked. Common sources:

Keys generated on personal devices. A developer who set up server access from a personal laptop may have a key on that
device with no corresponding record in the team's inventory.

Forwarded SSH agents. An active agent forwarding session can be used to authenticate as the originating user even after
local access is revoked.

Locally stored credentials. API keys copied into a local environment file, passwords stored in a personal password
manager, screenshots of secrets taken for reference.

Rotating the credentials themselves closes the shadow credential
problem. A rotated credential renders unknown copies useless. This is more disruptive but is the only approach that
covers what is not on any list.

## After offboarding

Reviewing authentication logs for the 30 days following offboarding occasionally surfaces access attempts from the
departed person's usual source IPs. This sometimes reveals shadow credentials that were used after other access was
revoked. Not a common finding. Not a finding to skip.
Last updated: 10 July 2026
