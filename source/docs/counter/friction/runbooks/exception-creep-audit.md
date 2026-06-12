# Auditing application-control exception creep

Finds where an application-control or allow-list policy has drifted toward permissiveness, so the
exceptions can be reviewed and trimmed before the effective policy is weaker than the intended one.
Pairs with [application control exclusion creep](../application-control-creep.md).

## Enumerate the exceptions

Export the current rule set and separate it into:

- the base allow-list (the intended policy)
- the exceptions added since (the drift)

Count both. When the exception list is larger than the base list, the effective
policy has already approximated "block unsigned from user-writable paths", which
is far weaker than the control was meant to be.

## Score each exception

For each exception, record:

- the binary or path it permits
- the use case it was granted for
- who granted it, and when
- a review date (most legacy exceptions have none)

Flag: exceptions with no use case, no owner, or no review date. Those are the
ones that accreted, not the ones that were decided.

## Trim

- Expire one-off exceptions (a diagnostic tool, a one-time installer) on sight; they were never meant
  to be permanent.
- Re-justify ongoing exceptions against whether the application is still in use. An exception for
  software that left the estate two years ago is pure attack surface.
- Give every surviving exception an owner and a review date. Exceptions without a review date
  accumulate indefinitely, which is the whole failure mode.

## Where universal is not affordable

If enforce mode cannot go everywhere, confirm it covers the targets that earn it: domain controllers, certificate 
authorities, backup infrastructure. Partial coverage there still raises lateral-movement cost for an attacker aiming 
at those systems.
