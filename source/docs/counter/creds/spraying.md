# Password spraying, stuffing, and brute force

Three patterns of authentication abuse produce distinguishable signatures in event logs.
They differ in volume, spread, and success rate, and the detection logic differs accordingly.

## Spray, stuffing, and brute force distinguished

Password spraying tries one password (or a very small set) against many accounts. The goal
is to stay below the per-account lockout threshold while covering enough accounts to find
at least one match. The pattern in logs: a single source generating many Event 4625 failures
with distinct TargetUserName values, each account appearing only a few times.

Credential stuffing uses username/password pairs sourced from previous breaches. The
volume is higher than spray and the success rate is often higher because the pairs are
real credentials from other services. The log pattern resembles spray structurally (one
source, many accounts) but the success rate distinguishes it: a spray may succeed once in
hundreds of attempts; stuffing may succeed several times in the same window.

Brute force concentrates many attempts against a single account. It is noisier, usually
triggers lockout quickly, and is less common in mature attacks against domain environments
where lockout policies are in place. The pattern: a high failure count for one TargetUserName,
often triggering Event 4740 (account lockout).

## Event sources

Domain account authentication produces events on domain controllers:

- Event 4625: failed logon. The Status and SubStatus fields carry the failure reason.
  `0xC000006A` is the wrong password; `0xC0000064` is an unknown username; `0xC0000234`
  is an account already locked. The IpAddress field captures the source; for Kerberos
  preauthentication failures the source appears in Event 4771 instead.
- Event 4771: Kerberos preauthentication failure. Common for domain account spray over
  Kerberos (port 88). The eType field shows the encryption type requested.
- Event 4624: successful logon. LogonType 3 is network logon; LogonType 10 is remote
  interactive (RDP). A success from a source that generated recent failures is the primary
  indicator of a spray that found a valid credential.
- Event 4740: account lockout. Clustering of lockout events across multiple accounts in
  a short window confirms an automated spray; the tool exceeded the lockout threshold
  before it could tune its pacing.

Local account authentication and RDP failures produce Event 4625 on the targeted
machine rather than the domain controller. Remote Desktop brute force is a common initial
access technique and appears as a high volume of Event 4625 with LogonType 10 from external
IP ranges.

Web application and API authentication abuse appears in application access logs rather
than Windows Security events. The detection logic is the same but the field names differ;
the app/ and api/ sections cover those patterns.

## Timing and pacing

Automated spray tools operate at a characteristic pace: requests arrive at regular intervals
with low variance, spread evenly across the target account list. Human logins cluster around
working hours, vary in interval, and do not follow alphabetical or sequential account name
order.

A spray that is tuned to be slow enough to avoid lockout may be hard to distinguish from
normal failure noise in a short window. Looking across a longer window (eight to twenty-four
hours) and grouping by source IP exposes the spread even when the per-hour volume is low.
The Protected Users security group removes NTLM fallback and shortens Kerberos ticket
lifetimes, which forces Kerberos preauthentication failures to appear in Event 4771 and
makes spray attempts against those accounts more visible.

## Closing the door

Detection catches a spray in progress; it does not stop one succeeding. The controls that do
that are identity-side: multi-factor authentication, lockout thresholds tuned to slow an
attacker without locking out the workforce, and federated sign-in that keeps a domain
authentication endpoint off the open road. Golem Trust Computing's build of that layer is in
[Keycloak deployment](../../org/startup/runbooks/keycloak-deployment.md).
