# Code review

Security-focused code review looks at code from the perspective of an attacker rather than a functional reviewer. The question is not whether the code does what it is supposed to do, but whether it can be made to do something it is not supposed to do.

Automated tools (linters, SAST scanners) catch repeatable patterns reliably. Manual review catches logic errors, access control assumptions, and trust boundary violations that pattern matching misses.

## Focus areas

Authentication and session management are worth close attention because errors here affect every user. Specific things to look for: session tokens generated with insufficient entropy; authentication checks that can be bypassed by omitting a parameter; privilege checks that happen once and are not re-evaluated when context changes; password reset flows that do not invalidate the old token after use.

Data validation at trust boundaries: entry points (HTTP request handlers, message queue consumers, webhook receivers) that pass data to internal functions without validating type, range, or format. Internal functions that assume their inputs are safe when the caller has not validated them.

Error handling that reveals internal state: stack traces in HTTP responses, database error messages that include table names or query fragments, error responses that distinguish between "user not found" and "wrong password" (which allows username enumeration).

Cryptographic implementation: custom hash functions or encryption schemes; use of deprecated algorithms (MD5, SHA-1 for integrity, RC4, DES); hardcoded keys or IVs; keys stored in code or config files that are checked into version control.

## Tools for automated review

- Semgrep: rule-based pattern matching; community security rules for most languages
- Bandit: Python-specific security patterns
- ESLint with security plugins (`eslint-plugin-security`): JavaScript/TypeScript
- SonarQube: multi-language; integrates with GitHub and GitLab; provides a quality gate mechanism

Checklists based on the OWASP Top 10 provide a consistent structure for review when a more systematic approach is needed than ad-hoc inspection.
