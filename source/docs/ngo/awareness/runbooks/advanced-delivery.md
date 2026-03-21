# Test payload delivery against Defender

Before deploying any simulation campaign to the staff population, verify that the email
lands in the primary inbox of a test account with Defender running normally. Do not modify
Defender settings. Do not add bypass rules. If the email does not land cleanly, the
technique needs to be refined until it does, or replaced with one that works.

This is the gate before every campaign. An email that gets caught by Defender is not a
usable simulation payload. It is also, usefully, evidence that the current technique has
been addressed by the filters, which is information the security team needs.

## Prerequisites

- A dedicated test account in the tenant with an Exchange Online mailbox and no special
  permissions or policy exceptions. A normal staff-equivalent account.
- Defender for Office 365 running at the tenant's standard configuration. No changes.
- Gophish configured with the sending profile and campaign for the planned simulation.

## Steps

1. Create a test campaign in Gophish targeting only the test account. Use the same
   sending profile, email template, and landing page as the planned simulation.
2. Launch the test campaign.
3. Wait five minutes, then check the test account inbox:
   - If the email is in the primary inbox with no warning banner: the payload passes.
     Proceed to the full simulation campaign.
   - If the email is in the junk folder: the sending domain or email content triggered
     spam classification. See the refinement notes below.
   - If the email did not arrive: it was blocked at the gateway. Check the message trace
     in the Exchange admin centre to identify the filter rule that caught it.
   - If the email arrived with a phishing warning banner: the URL or content matched a
     Defender detection. The technique needs to be updated.
4. For a payload that passes, also verify the link behaviour:
   - Click the tracking link from the test account.
   - Confirm it is not intercepted by Safe Links with a warning page.
   - Confirm the landing page loads.
   - Confirm the Gophish dashboard records the click.
5. If all checks pass, delete the test campaign results and proceed with the full
   simulation. The test results are not representative and should not be included in
   programme metrics.

## Refinement notes

If the email lands in junk, the most common causes are sender reputation and content
signals. Check that the sending domain has SPF and DKIM configured. Reduce the number
of links in the email body. Remove HTML that closely matches known spam patterns.

If the link is caught by Safe Links, the URL has been flagged. Techniques that avoid
direct URL inclusion in the email body, such as QR codes, legitimate service redirects,
or links embedded inside an attached document, bypass Safe Links scanning because there
is no URL in the email for Safe Links to process at delivery time.

If the payload cannot be made to land cleanly without modifying Defender configuration,
the technique is not suitable for this simulation cycle. Select a different technique
from the [threat intelligence runbook](threat-intel.md) and begin the test process again. The goal is a
simulation that reflects what a real attacker would send today. A payload that Defender
catches is not that.
