# Phishing

Phishing is the most common initial access vector against non-profit organisations, and it
is effective precisely because it targets people. A technically sound
M365 configuration with MFA enforced and Defender for Office 365 running still depends on
people making good decisions when a convincing email arrives. The goal of this module is
to build those instincts through the one approach that reliably works: making participants
try it themselves before asking them to defend against it.

## What the Home is targeted with

Donation and grant fraud is the most sector-specific variant. An email impersonating a major
donor, a grant-making body, or a government agency asks to change bank details, confirm a
grant application, or process an urgent transfer. The financial motive is direct and the
email context is entirely plausible. The Home receives legitimate communications about grants
and donations regularly, which means the question is not whether the email type is familiar
but whether this particular one is genuine.

Management impersonation targets finance staff and HR. An email appearing to come from the
director or a trustee asks for an urgent action that bypasses normal process: an exception
payment, a salary query, access to a personnel file. The urgency is the mechanism. The
request is framed as time-sensitive specifically to discourage the verification step.

Credential harvesting produces a convincing login page for Microsoft 365, Covenant, or
another system the recipient uses. Once credentials are submitted, the attacker has access
to whatever that account can reach, which at the Home includes 200,000 member records,
financial data, and resident case files depending on the account. Modern credential
harvesting via adversary-in-the-middle techniques captures session tokens as well as
passwords, which means MFA alone is not an adequate last line of defence against a
sufficiently current attack.

Supplier and partner impersonation uses the Home's known relationships. An email appearing
to come from Fabulist Systems, from the Consortium, or from one of the Home's regular
contractors asks to update payment details or to click a link to access a shared document.
The sender domain will be slightly wrong. The logo will be right.

## The afternoon session

The phishing module is delivered as a purple team exercise. The
programme overview covers the format; the specifics relevant to phishing are here.

The session has a red team and a blue team, with participants rotating through both roles.
Red team participants are given a workstation with access to Gophish and told the objective:
craft a convincing phishing email targeting the Home and send it to the sandbox inbox.
They are given the Home's name, its public-facing activities, and the names of relevant
suppliers. They are given access to the Home's public website and social media accounts.
This is the same research an external attacker would do, and it takes about ten minutes.

Blue team participants sit at the receiving machine at the front of the room. Emails arrive
in the sandbox inbox as red team participants launch their campaigns. The blue team decides
how to respond to each one: click the link, submit credentials, or use the Report button.
Their decisions appear on the Gophish dashboard on the main display alongside the red team's
campaign events.

The display is visible to everyone. The red team can see whether their email was clicked or
reported. The blue team can see what the attacker's view looks like. Neither side is
operating in the dark, which is the point: this is a learning exercise.

After the session, the debrief reviews the full campaign results on the display together.
The emails that were clicked are examined with their authors: what made this work? The
emails that were reported are examined with the blue team participants who reported them:
what was the signal? The emails that generated neither response are also worth discussing,
because hesitation under uncertainty is data about where recognition training needs to go.

## Recognising phishing

The signals worth training people to notice are urgency and pressure to act without following
normal process, requests that would be unusual from the supposed sender, links where the URL
visible in the email does not match what you would expect, requests for credentials or payment
outside normal channels, and sender domains that are plausible at a glance but wrong on
examination.

The most important behaviour to reinforce is not to click nothing but to verify through a
different channel. If an email from the director asks for an urgent transfer, call the
director. If an email from Microsoft asks for re-authentication, navigate to the Microsoft
website directly. The habit of independent verification disrupts
almost all phishing scenarios and most of the social engineering variants that follow the
same pattern.

Modern phishing increasingly avoids the signals that awareness training covers. A QR code
in an email body contains no URL for the recipient to examine and nothing for Defender to
scan. An email with a link to a legitimate OneDrive or SharePoint document looks clean until
the document is opened and the real payload link appears inside it. Awareness training needs
to include these variants.
The afternoon session produces them naturally: left to their own devices, participants
discover the techniques that actually work.

## The built-in Report button

The built-in Report button in Outlook is the response mechanism. It allows users to flag a
suspicious email directly from the inbox without forwarding it to anyone or clicking
anything within it. It is available in the Outlook toolbar and in the right-click context
menu across Outlook on the web, desktop, Mac, and mobile. No add-in installation is
required. The older Report Message and Report Phishing add-ins are deprecated and should
not be used.

Configure the button to route reports to the internal security mailbox so the IT team has
visibility of what staff are flagging. Real suspicious emails reported through the same
channel as simulation reports normalises the reporting behaviour and produces useful data
about what is reaching inboxes.

During the afternoon session, participants on the blue team use the Report button on the
sandbox machine. When they do, the event appears on the Gophish display as a report rather
than a click. The red team participant who sent that email sees it. The distinction between
click and report is visible to the whole room and is discussed in the debrief.

## When someone clicks

How the organisation responds when someone clicks a phishing link determines whether people
report incidents in future. If the response involves blame or embarrassment, the next person
will not report. If the response is immediate practical action followed by a genuine
thank-you for flagging, the organisation learns from the incident.

The practical response to a click: check immediately whether credentials were entered, reset
the account password and revoke all active sessions, review sign-in logs for anomalous
access, check for inbox rules that may have been created, and assess whether any data was
accessed or exfiltrated in the window between the click and the remediation. The incident
response section covers this in full.

The cultural response: say thank you, make the remediation collaborative, and if the phishing
email was genuinely convincing, say so, because it usually was.
Last updated: 10 July 2026
