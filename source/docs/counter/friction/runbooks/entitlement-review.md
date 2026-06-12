# Reviewing standing entitlements

Finds where least privilege has drifted into cumulative privilege, so unused and over-broad access can
be trimmed before it becomes the surface a credential thief or a hostile policy change exploits. Pairs
with [least privilege and the cost of asking](../least-privilege.md).

## Pull access against use

For each account (start with the privileged ones):

- entitlements held
- entitlements actually used in the window (from access logs, sign-in logs,
  privileged-session records)
- last-used date per entitlement

The gap between held and used is the drift. An account that holds the union of
every task its owner has ever done is the normal end state of unmanaged access,
not an anomaly.

## Flag the standing risks

- entitlements unused for the whole window
- standing elevated access that could be just-in-time instead
- shared elevated accounts (no individual attribution)
- service accounts with interactive-logon rights or broad scope
- break-glass accounts that are used routinely (they are not break-glass any more)

## Trim, and remove the reason it drifted

- Remove unused entitlements. The objection is always that someone might need it later; the answer is
  that re-granting is a request, and standing unused access is a permanent exposure.
- Move predictable elevation to just-in-time where the approval can be made fast enough that the
  workaround does not reappear. The drift returns wherever re-asking is slower than over-provisioning.
- Resource the access path itself. When granting is slow, the helpdesk grants broadly to stop the
  calls, and a helpdesk trained to grant broadly is the exact lever social engineering and a hostile
  policy change both pull.

## Make it standing

Recur the review, and attach a review date to every grant. Entitlements without an expiry are how least privilege 
quietly stops being least.
