# Application control exclusion creep

Application control starts with a policy: only approved binaries run. Over time, the exceptions
accumulate. Each exception reflects a binary that needed to run and was not in the approved list.
Legitimate exceptions include vendor tooling, custom line-of-business applications, diagnostics
utilities, and update installers.

After two or three years, the exception list in many deployments is larger than the original
approved list. The effective policy at that point approximates "block unsigned binaries from
user-writable paths", which provides some protection but is substantially weaker than the
intended control.

A more durable approach manages exceptions through a review process where each exception includes
the binary, the use case, and a review date. Exceptions granted for a one-off diagnostic tool
have an expiry; exceptions for ongoing line-of-business applications are reviewed annually against
whether the application is still in use. Exceptions without review dates accumulate indefinitely.

The partial deployment case: enforce mode on domain controllers, certificate authorities, backup
infrastructure, and other high-value targets still provides meaningful protection. The deployment
does not need to be universal to raise lateral movement cost significantly for an attacker
targeting those specific systems.
