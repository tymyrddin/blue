# Researcher communication

Three researchers from the first cohort were later hired as security engineers at Golem Trust. This is not a coincidence; it is the direct result of how the communication was handled throughout the programme. Researchers who feel respected and taken seriously become advocates. Researchers who receive copy-paste non-responses go elsewhere. Angua's standard is: every communication should be specific to the finding, honest about the assessment, and grateful for the effort. This runbook covers communication tone, the standard templates, what not to share, and how the hiring process for researchers worked.

## Communication tone

Professional: treat researchers as the skilled peers they are. Avoid defensive or bureaucratic language.

Specific: reference the actual finding, the actual component, the actual reason for any decision. A duplicate notification that explains exactly what the earlier finding was (without disclosing details of other researchers' reports) is far more satisfying to receive than "we already know about this."

Grateful: finding security vulnerabilities requires skill and time. Researchers chose to report to Golem Trust rather than exploit or sell the finding. The communication should reflect that this is valued.

Timely: the 24-hour initial acknowledgement SLA is the most important single metric in the programme. Researchers notice when it slips.

## Template: initial acknowledgement (within 24 hours)

```
Subject: Re: [Report #<ID>] <Title>

Hello <Handle>,

Thank you for submitting this report to the Golem Trust bug bounty programme.

We have received your submission regarding <brief description of the finding> and
have begun our initial triage. We aim to provide a full assessment within
[3-5 business days / 48 hours for Critical submissions].

If we need any clarification on your reproduction steps, we will follow up
here on the platform.

We appreciate the time you put into this report.

Best regards,
Angua
Golem Trust Security Team
```

## Template: validation confirmed

```
Subject: Re: [Report #<ID>] <Title>

Hello <Handle>,

We have completed our triage of this report and are pleased to confirm that
we have validated the finding.

We have verified the issue in our bug bounty environment: [specific description
of what was reproduced and confirmed].

We have assigned this a severity of [Severity] based on CVSS v3.1 scoring of
[vector string]. [Brief explanation of the scoring rationale, specific to this finding.]

The finding has been assigned to the owning development team and is now in
remediation. We will notify you when a fix is deployed to the bug bounty
environment for your verification.

Thank you for this submission.

Best regards,
Angua
Golem Trust Security Team
```

## Template: duplicate notification

```
Subject: Re: [Report #<ID>] <Title>

Hello <Handle>,

Thank you for this submission. After review, we have determined that this
finding is a duplicate of an issue we are already tracking.

[If the earlier report is already fixed: The issue you reported was identified
previously and has been resolved. We are closing this report as a duplicate
of a resolved issue.]

[If the earlier report is still open: The issue you reported is known to us
and is currently in our remediation queue. We are closing this report as a
duplicate of an open issue.]

We are unable to share details of other researchers' reports, but we can confirm
that the issue you identified is the same vulnerability we have already recorded.

We are sorry we cannot offer a reward for duplicate findings, but we do appreciate
that you took the time to investigate and report it responsibly.

Best regards,
Angua
Golem Trust Security Team
```

## Template: out-of-scope notification

```
Subject: Re: [Report #<ID>] <Title>

Hello <Handle>,

Thank you for this submission. After review, we have determined that it falls
outside the current scope of the Golem Trust bug bounty programme.

The current scope is defined at [programme URL] and covers [brief restatement
of scope]. The component you tested, [component name], is [not included in scope
/ excluded by the programme rules] because [specific reason].

[If the finding is genuinely concerning: While this finding is out of scope for
the bug bounty programme, we take security seriously across all our systems.
Please contact security@golemtrust.am to discuss this finding directly.]

Thank you for your interest in the programme.

Best regards,
Angua
Golem Trust Security Team
```

## Template: fix deployed for verification

```
Subject: Re: [Report #<ID>] <Title> - Fix ready for verification

Hello <Handle>,

We have deployed a fix for the issue you reported to our bug bounty environment.

The fix is live at [affected endpoint in the bug bounty environment]. You can
verify it using the same test account and reproduction steps from your original
report.

Please let us know within 7 days whether you consider the fix to address the
reported issue. If you identify a bypass or incomplete remediation, please
describe it here and we will re-open the finding immediately.

If we do not hear from you within 7 days, we will close the finding as resolved
and proceed with production deployment.

Thank you again for this report.

Best regards,
Angua
Golem Trust Security Team
```

## Template: fix confirmed and closing

```
Subject: Re: [Report #<ID>] <Title> - Closing as resolved

Hello <Handle>,

Thank you for verifying the fix. We are closing this finding as resolved.

[If reward is being offered in the same communication:]
We are pleased to offer a reward of €[amount] for this finding. The reward
will be processed via the [HackerOne / Intigriti] platform within 14 days of
your acceptance.

We will be publishing a disclosure of this finding 90 days from today, on
[date], unless you request an earlier disclosure. Please let us know if you
would like to be credited in the disclosure, and whether you would like to be
included in our Hall of Fame.

Thank you for contributing to Golem Trust's security.

Best regards,
Angua
Golem Trust Security Team
```

## What not to share

Internal system details: do not describe internal architecture, internal tooling, other running services, or infrastructure details beyond what is necessary to confirm the finding.

Other researchers' reports: never share details of other researchers' findings, even to explain why a duplicate is a duplicate. "This is a known issue we are tracking" is sufficient.

Remediation approach before the fix is deployed: do not describe how the fix will work. A researcher who knows the intended fix may identify a bypass before the fix is deployed.

Timelines for specific deployments: do not share internal sprint schedules or release dates.

## Escalation procedures

Unresponsive researcher after fix verification request: after 7 days with no response, send a single follow-up. After a further 3 days with no response, close the finding as resolved per the remediation runbook. No further escalation is required.

Researcher disputes severity: escalate to Angua for review, then to Ludmilla if Angua and the researcher cannot agree. See the severity assessment runbook for the full dispute process.

Researcher is aggressive or abusive: escalate to Carrot and Angua for joint review. The platform (HackerOne or Intigriti) should be notified if a researcher's behaviour violates the programme terms of service.

## Hall of fame

Golem Trust maintains a public Hall of Fame at `https://golemtrust.am/security/hall-of-fame` for researchers who have had valid findings confirmed. Publication requires the researcher's explicit consent, which Angua requests during the closing communication. The Hall of Fame lists researcher handles, not real names, unless the researcher specifically requests otherwise.

## Researcher hiring

Three researchers from the initial cohort were later hired as security engineers. The pattern was consistent across all three: a researcher submitted multiple high-quality reports across several months, demonstrating both technical depth and communication that made Angua's job easier rather than harder. In each case, Angua raised the researcher's name in the security team's quarterly planning meeting as someone worth talking to.

The transition from researcher to employee was handled carefully. A researcher who is hired should not receive advance information about known vulnerabilities they did not discover, and the programme compensation they received as a researcher is separate from their employment compensation; it is not a signing bonus or an advance against salary. HR formalised this distinction in a brief guidance document that covers the programme-to-employment transition. In each case, the researcher was informed at the start of the hiring process that they would be recused from the bug bounty programme for any applications they had visibility into as an employee.
Last updated: 20 March 2026
