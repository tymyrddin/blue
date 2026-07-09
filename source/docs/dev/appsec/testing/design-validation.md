# Architecture and design validation

Security review at the design stage catches structural problems before they are built. A system that routes unauthenticated requests through an authentication-bypassing path, or that places sensitive data on a message queue that multiple services consume without access control, has a vulnerability that cannot be fixed by adding input validation.

## Threat modelling

Threat modelling identifies what could go wrong in a system before building it. STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) provides a taxonomy for systematically enumerating threats against each component and data flow.

The process typically involves:

1. Drawing a data flow diagram (DFD) that shows system components, external entities, and data flows between them
2. Identifying trust boundaries: points where data crosses between components with different privilege levels
3. Applying STRIDE to each component and flow
4. Identifying mitigations for threats that pose unacceptable risk

The output is a list of threats with associated risk ratings and mitigations.

DREAD (Damage, Reproducibility, Exploitability, Affected users, Discoverability) is a risk scoring framework sometimes used alongside STRIDE. Its use has declined in favour of CVSS and more context-specific scoring, but it remains a useful prompt for structured discussion.

## Trust boundary analysis

Trust boundaries are where security controls are most important and where they are most often missing. Common patterns:

- An internal API assumed to be callable only by trusted services, exposed on a network segment also reachable by external-facing services
- A privileged background process that reads from a queue populated by a lower-privilege component, without validating that the queue contents have not been tampered with
- A multi-tenant application that uses shared infrastructure for tenant data with row-level filtering

## Fail-safe defaults

Design review is an opportunity to assess whether the default behaviour of a system is safe. A feature flag system that defaults to enabling features means a misconfiguration enables too much. An access control list that defaults to `Allow` on no match means misconfigured rules grant unintended access.

## Architectural Risk Analysis

ARA examines the architecture for known architectural risk patterns: unnecessary attack surface, privilege escalation paths, insecure defaults, reliance on a single security control. It is a more structured alternative to ad-hoc architecture review, with specific patterns to check.
Last updated: 10 July 2026
