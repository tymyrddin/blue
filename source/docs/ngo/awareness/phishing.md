# Phishing recognition

Phishing remains the most common initial access vector against non-profit organisations, and
it is effective precisely because it targets people rather than systems. A technically sound
M365 configuration with MFA enforced and Defender for Office 365 running still depends on
people making good decisions when a convincing email lands in their inbox.

## What non-profits are targeted with

Donation and grant fraud: emails impersonating a major donor, a grant-making body, or a
government agency asking to change bank details, confirm a grant application, or process an
urgent transfer. The financial motive is direct.

CEO or management impersonation: an email appearing to come from the director or a senior
manager, asking for an urgent action that bypasses normal process. Common targets are finance
staff and HR.

Credential harvesting: a convincing login page for Microsoft 365, the CRM, or another system
the recipient uses, asking them to sign in. Once credentials are captured, the attacker has
access to whatever that account can reach.

Malware delivery: an attachment or link that installs malware. Less common than credential
harvesting for this sector but still present.

## Recognising phishing: the practical version

Training on phishing recognition is most effective when it is concrete and specific to what
people actually see. Abstract lists of warning signs are less useful than examples from your
own sector.

The things that are worth training people to notice: urgency or pressure to act immediately
without following normal process, requests that are unusual for the supposed sender, links
where the URL does not match what you would expect, requests for credentials or payment
outside normal channels, and sender addresses that look plausible but are slightly wrong.

The most important behaviour to reinforce is not click nothing but verify through a different
channel. If an email from the director asks for an urgent transfer, call the director.
If an email from Microsoft asks you to re-authenticate, go directly to the Microsoft website
rather than clicking the link. The habit of verifying unusual requests through a separate
channel disrupts almost all phishing scenarios.

## What to do when you suspect phishing

People need a clear, simple answer to this question. If there is no clear answer, people will
do nothing, or close the email, or click the link to see what happens.

The answer should be: report it, do not click anything, do not forward it to colleagues to
ask their opinion. In [M365, the Report Message add-in](https://td.usnh.edu/TDClient/60/Portal/KB/ArticleDet?ID=2237) 
allows users to report suspicious email directly to Microsoft and/or to your security mailbox. Install it and make sure 
people know it exists.

You can configure it so reports only go to your internal security mailbox and not to Microsoft.

## The response to someone who clicked

How you respond when someone reports that they clicked a phishing link determines whether
people report incidents in future. If the response is blame, the next person will not report.
If the response is thank you, now let us deal with it together, the organisation learns.

The technical response to a click: immediately check whether credentials were entered, reset
the account password and revoke sessions, check for suspicious activity in the sign-in logs,
look for inbox rules that may have been created by the attacker, and assess whether any data
was accessed.

## Related

- [Security awareness programme](programme.md)
- [Exchange security](../m365/exchange.md)
- [Incident response](../data/incident-response.md)
