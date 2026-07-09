# Remediation workflows

A bug bounty programme that finds vulnerabilities but fixes them slowly is worse than one that does not exist, because it creates a growing list of confirmed, researcher-known vulnerabilities sitting unpatched. Golem Trust's first-month average fix time of 3.7 days, against a 7-day SLA for High findings, was not an accident; it reflected how the remediation workflow was designed from the start. The researcher is a stakeholder in the fix: they are notified when the fix reaches the bug bounty environment, given 7 days to verify it, and treated as the final quality gate before the finding is closed. This runbook covers the remediation SLA schedule, the fix workflow, researcher verification, and coordinated disclosure.

## SLA schedule

Bug bounty findings follow the same remediation SLA as internally discovered vulnerabilities:

```
Critical: 24 hours to a mitigating control; 7 days to full remediation
High:     7 days to full remediation
Medium:   30 days to full remediation
Low:      90 days to full remediation
```

The clock starts when the finding is confirmed valid in DefectDojo, not when the researcher submitted it. SLA tracking is automated via DefectDojo's SLA configuration, and Angua receives a daily digest of findings approaching their SLA deadline.

Findings that breach SLA are escalated to Carrot, who decides whether to extend the SLA with a documented reason or to escalate further. SLA extensions must be communicated to the researcher.

## Assignment to the owning team

After severity confirmation, DefectDojo's workflow automation assigns the finding to the development team responsible for the affected component. The assignment creates a Jira ticket in the owning team's backlog, linked to the DefectDojo finding, with the severity, the reproduction steps, and the evidence gathered during triage.

The DefectDojo-to-Jira integration is configured in `golem-trust/platform/defectdojo/jira-config.yaml`. The mapping of application components to owning teams is maintained in the same file.

The Jira ticket uses the `[BB]` prefix to distinguish bug bounty findings from internally discovered ones, making the programme's contribution visible in sprint planning.

## Fix development and review

The fix is developed on a feature branch following the standard development process. The branch name should reference both the Jira ticket and the DefectDojo finding ID:

```
git checkout -b fix/BB-142-defectdojo-8731-idor-customer-metadata
```

The PR requires two engineer reviews. The reviewers must confirm that the fix addresses the root cause. A fix that patches the specific parameter manipulation without addressing the underlying authorisation model would pass a narrow review but not a root cause review.

Merging to main triggers the standard Tekton pipeline. The image is built, signed, attested, and pushed to Harbor. A separate deployment pipeline promotes the image to the bug bounty environment first.

## Deployment to the bug bounty environment

The deployment to the bug bounty environment is the trigger for researcher notification. This step happens before production deployment, and it is the environment the researcher will use for verification.

After deployment is confirmed healthy in the bug bounty environment:

```
kubectl rollout status deployment/customer-portal -n bugbounty-apps
```

Angua sends the "fix deployed for verification" notification to the researcher. See the researcher communication runbook for the template.

## Researcher verification

The researcher has 7 days from the "fix deployed for verification" notification to confirm that the fix resolves the reported issue. If the researcher confirms the fix, the finding is marked as Resolved in DefectDojo and the production deployment proceeds.

If the researcher reports that the fix is incomplete or that a bypass exists, the finding is re-opened in DefectDojo and the Jira ticket is updated. The development team is notified immediately. The SLA clock restarts from the re-open date.

If the researcher does not respond within 7 days, Angua sends a follow-up notification (see the researcher communication runbook). If there is still no response after a further 3 days, the finding is closed as Resolved with a note in DefectDojo: "Researcher did not respond to fix verification request within 10 days. Finding closed as resolved pending further researcher contact." The production deployment proceeds.

## Production deployment

After researcher verification (or the 7-day non-response closure), the fix is promoted to production via the standard deployment pipeline. The DefectDojo finding is updated to note the production deployment timestamp and the image digest deployed.

The 90-day coordinated disclosure embargo begins at the moment the finding is confirmed as verified and closed. The embargo end date is recorded in DefectDojo.

## What contributed to the 3.7-day first-month average

The first month's 3.7-day average fix time came from several factors that are worth preserving:

Finding volume was manageable. Twelve valid findings over the month meant individual findings received focused attention from owning teams.

Triage quality reduced rework. By the time a finding reached a development team's Jira backlog, the reproduction steps were confirmed, the environment was ready, and the evidence was complete. Developers could start on the fix immediately.

Team leads were engaged. Angua's practice of reviewing severity with the relevant team lead meant that when the Jira ticket arrived, the team lead had already heard about the finding and could prioritise it appropriately.

The IDOR finding was fixed in four hours. That single data point pulled the average down significantly. It also set a positive early example within the organisation that researcher reports could be resolved at speed when the team was motivated.

To maintain this average as volume grows, the key variables to protect are: triage quality (do not let findings reach developers with incomplete reproduction steps) and team lead engagement (keep the severity review process timely).
Last updated: 10 July 2026
