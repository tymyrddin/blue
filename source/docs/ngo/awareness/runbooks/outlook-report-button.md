# Configure the built-in Outlook Report button

The [built-in Report button](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/built-in-report-button-is-available-in-microsoft-outlook-across-platforms/4388434) is the current Microsoft standard for user-reported phishing.
The older Report Message and Report Phishing add-ins are in maintenance mode and will be
deprecated. Do not deploy or extend those add-ins.

## Prerequisites

- Global Administrator or Security Administrator role in the tenant.

## Steps

1. Go to the Microsoft Defender portal at security.microsoft.com.
2. Navigate to Settings > Email and collaboration > User reported settings.
3. Under "Monitor reported messages in Outlook", confirm the toggle is set to On.
4. Under "Send reported messages to", select "My reporting mailbox only" and enter the
   address of the internal security mailbox. This routes all reports to the IT team
   without sending them to Microsoft. Adjust to "My reporting mailbox and Microsoft"
   if you also want Microsoft analysis.
5. Under "User reporting experience", configure the pre-reporting popup to ask the user
   to confirm before submitting.
6. Set the post-reporting message to acknowledge the report and give a brief instruction,
   for example: "Thank you. If you clicked any links, contact IT immediately."
7. Save changes.

## Verify

1. Open a test message in Outlook on the web.
2. Confirm the Report button is visible in the ribbon and in the right-click context menu.
3. Repeat in the Outlook desktop client.
4. Submit a test report from a user account.
5. Confirm the report arrives in the security mailbox with sender, recipient, subject,
   and submission time intact.

## Notes

The button appears automatically across Outlook on the web, Outlook for Windows (new
Outlook), Outlook for Mac, and Outlook mobile. No add-in deployment is required. It works
in shared mailboxes, which the deprecated add-ins did not support reliably.
Last updated: 21 March 2026
