# Security testing

Security testing finds vulnerabilities that code review and functional testing leave undetected, in part because neither tends to assume an adversarial user. The tooling has matured significantly: automated scanners, dependency auditors, and secret detectors can integrate into CI/CD pipelines and catch whole categories of issues without manual effort.

The shift-left framing (catching issues earlier in the development lifecycle) is accurate in principle. An injection vulnerability found by a SAST scanner during code review costs far less to fix than one found during a penetration test, which costs less than one found in production.

## Testing by stage

| Stage | Approach |
|---|---|
| Design | Threat modelling, architecture review |
| Development | SAST, code review, SCA |
| Pre-production | DAST, penetration testing |
| Production | RASP, continuous monitoring |

No single stage catches everything. SAST does not execute the application and misses runtime issues; DAST finds runtime issues but cannot trace them back to the source; penetration testing is comprehensive but slow and expensive relative to the automated alternatives.

## Automation in CI/CD

Integrating security tools into the build pipeline means scans happen on every commit rather than periodically. Most SAST and SCA tools provide CI integrations and can be configured to fail the build on findings above a defined severity threshold.

The practical challenge is signal-to-noise ratio. Tools configured with aggressive settings generate enough false positives to train developers to ignore them. Starting with high-confidence rules and expanding over time is more effective than enabling everything at once.
