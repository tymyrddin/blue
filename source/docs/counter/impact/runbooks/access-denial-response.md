# Access removal and lockout: response runbook

Response when the infrastructure works perfectly and declines to admit the legitimate owner: a
revoked account, a deplatformed tenant, or a self-inflicted lockout from a control change. Pairs with
the [access-denial](../access-denial.md) family.

## Tell denial from outage

An outage fails for everyone; a denial fails for one, with everything around it healthy. Confirm the
scope, then find the cause of the block.

```powershell
# AD: is the account locked, disabled, or expired, and where did it come from?
Get-ADUser <user> -Properties LockedOut,Enabled,AccountExpirationDate,LastBadPasswordAttempt
Search-ADAccount -LockedOut
# the lock source is in the DC security log (Event ID 4740); disable/change/reset are 4725/4738/4724
```

On the cloud side, read the sign-in log for the failure reason: a `53003` is a Conditional Access
block (the entry names the policy), a `50057` is a disabled account. On AWS, check CloudTrail for
`DeleteLoginProfile`, `DeactivateMFADevice`, or `DetachUserPolicy` against the principal.

The cost of proving the negative falls on the locked-out party. Move that burden onto the system: get
the provider to show the instruction behind the block.

## Recover access

- Break-glass: use the emergency account the normal controls cannot revoke (held offline, scoped,
  tested, alarmed on use), and from it restore the locked account (`Enable-ADAccount`, unlock, reset
  the session, or re-enable the cloud principal).
- Provider-side block: open the highest-priority support path and demand the provenance, who issued
  it, under what instruction, when.
- Self-inflicted by a policy change: pull the change and its author from the policy audit log, then
  revert it on a path that does not run through the frozen pipeline.

## Insulate the exposed

If the denial targets a person or partner, insulate them before exposing the block. The hour the
platform stops being trusted is the hour it turns toxic for whoever stands on it.

## Decide on disclosure

Confirming, denying, or declining to discuss who issued a block are three different messages to every
other account holder. Choose deliberately.

## After

- Place break-glass and escrowed-access paths the central controls cannot themselves revoke, and
  alarm on their use.
- Review a control change that tightens security with the same discipline as one that loosens it.
  Either can lock out the garrison.
Last updated: 12 June 2026
