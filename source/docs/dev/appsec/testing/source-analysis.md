# Source code analysis

Static analysis (SAST) examines source code without executing it, looking for patterns associated with known vulnerability classes: injection sinks, hardcoded credentials, insecure API usage, missing input validation. Because it operates on source, it can identify the exact file and line of a potential issue and sometimes suggest a fix.

Dynamic analysis (DAST) tests a running application by sending requests and observing responses. It finds vulnerabilities that manifest at runtime, including some that static analysis misses because they depend on the interaction between components. The trade-off is that DAST cannot trace a finding back to the responsible source line without additional instrumentation.

Interactive analysis (IAST) instruments the running application to trace data flows at runtime. It combines some of the coverage advantages of dynamic testing with the source-level traceability of static analysis, at the cost of deployment complexity.

## Tools

SAST:

- Semgrep: open-source, rule-based, runs locally and in CI; community rule sets cover common vulnerability patterns across Python, JavaScript, Java, Go, and others
- Bandit: Python-specific; identifies common Python security anti-patterns including `eval()`, `subprocess.run(shell=True)`, and `yaml.load()`
- Checkmarx, Veracode, Snyk Code: commercial options with broader language coverage and managed rule sets

DAST:

- OWASP ZAP: open-source; active scanner for web applications; scriptable via API
- Burp Suite: the standard for manual and semi-automated web application testing

IAST:

- Contrast Security, Seeker: commercial; agent-based deployment alongside the application

## Integration

SAST tools are suited to CI integration: they run against the source tree on each commit, fail on findings above a configured severity, and produce results in formats that integrate with code review tooling (GitHub, GitLab). DAST tools typically run against a staging or test environment rather than the CI build, since they require a running application.

The practical challenge with both is false positive management. Tools configured with aggressive settings generate enough noise to train developers to ignore results. Starting with a focused, high-confidence rule set and expanding over time tends to produce better outcomes than enabling every check at once.
