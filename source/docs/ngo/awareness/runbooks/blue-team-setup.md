# Set up the blue team machine

The blue team machine is the receiving end of the afternoon session. Participants sitting
at this machine see the phishing emails arrive in real time, decide how to respond to each
one, and use the built-in Outlook Report button to flag what they recognise as suspicious.
Their actions appear immediately on the display alongside the red team's campaign dashboard.

The machine is at the front of the room, visible to everyone, or connected to a second
projector. This is deliberate: the blue team's decisions are as visible as the red team's
campaigns. The session is not adversarial. Both sides learn from watching both sides.

## Prerequisites

- A sandbox Microsoft 365 account with an Exchange Online mailbox, distinct from any
  production account. Create it as a dedicated test account in the tenant:
  `sandbox-inbox@<yourdomain>` or similar.
- The built-in Outlook Report button configured for the tenant (see the Report button
  runbook). Confirm it is visible in this account before the session.
- A machine with a browser, or with the Outlook desktop client installed, that will
  remain at the front of the room for the duration of the session.

## Steps

1. Create the sandbox mailbox account in the Microsoft 365 admin centre if it does not
   already exist. Assign an Exchange Online licence. No other licences are required.
2. Log in to Outlook on the web at outlook.office.com using the sandbox account
   credentials. Do not use a personal or production account on this machine.
3. Confirm the built-in Report button is visible:
   - Open any email.
   - Check for the Report button in the top toolbar.
   - Right-click an email and confirm Report appears in the context menu.
   - If the button is absent, return to the Report button runbook and verify the
     User reported settings configuration in the Defender portal.
4. In Gophish, update the target group used for the session. Add the sandbox mailbox
   address as the sole recipient. All red team campaigns send to this address.
5. Open the sandbox inbox on the blue team machine and leave it visible in the browser.
   Do not minimise or close it during the session.
6. If a second projector is available, connect the blue team machine to it and project
   the inbox alongside the Gophish dashboard on the main display. If only one projector
   is available, the facilitator switches between the Gophish dashboard and the inbox
   during the debrief.

## During the session

One or two participants sit at the blue team machine at a time, rotating through the
role during the session. They are not told which emails are coming or when. Their only
task is to respond to each email that arrives: click the link, submit credentials, or
use the Report button.

The blue team participant should act as a real staff member would act, without performing
for the room. If they are unsure whether an email is suspicious, they should be unsure.
That hesitation is data.

When a blue team participant uses the Report button, the event appears on the Gophish
dashboard as a report rather than a click. The room sees it. The red team participant
who sent that email sees it. This is the feedback loop the session is built on.

## After the session

1. Delete all emails from the sandbox inbox.
2. Clear the browser history and log out of the sandbox account.
3. Do not reuse the sandbox account credentials for production purposes.
4. If the sandbox account was created specifically for this cohort, disable it in the
   admin centre after the session. Reactivate it for the next cohort.
