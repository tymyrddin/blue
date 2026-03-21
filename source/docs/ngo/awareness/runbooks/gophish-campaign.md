# Create and launch a Gophish campaign

A campaign ties together a sending profile, an email template, a landing page, and a
target group. During the afternoon session, participants each create and launch a campaign
against the shared sandbox inbox.

## Prerequisites

- Gophish installed and running.
- A sending profile configured.
- A landing page created.
- The sandbox inbox address available.

## Create the target group

1. Go to Users and Groups > New Group.
2. Name the group `Sandbox-inbox`.
3. Add a single entry: the sandbox inbox address. First name, last name, and position
   fields can be filled with placeholder values. The `{{.FirstName}}` template variable
   in email templates pulls from the First Name field, so enter something plausible if
   the template uses personalisation.
4. Save the group.

## Create the email template

1. Go to Email Templates > New Template.
2. Enter a name for the template.
3. Write the phishing email in the HTML editor or import an existing email as a starting
   point using the Import Email function.
4. Use `{{.URL}}` in the email body wherever the phishing link should appear. Gophish
   substitutes the campaign tracking URL automatically.
5. For a QR code email, do not use `{{.URL}}` as a link. Generate the QR code separately
   after the campaign is created (see the landing page runbook) and embed the image in
   the template HTML.
6. Set the Subject and From fields. The From field in the template overrides the sending
   profile display name if filled in.
7. Enable tracking: check "Add Tracking Image" to record email opens.
8. Save the template.

## Create and launch the campaign

1. Go to Campaigns > New Campaign.
2. Enter a name for the campaign, for example `Finance-session-2026-04-credential-harvest`.
3. Select the email template.
4. Set the URL to `http://<VM-IP>`. This is the base URL Gophish uses to generate tracking
   links. It must be reachable from participant workstations.
5. Set the Launch Date to immediately or to a specific time if coordinating multiple
   participant campaigns.
6. Select the sending profile.
7. Select the `Sandbox-inbox` target group.
8. Select the landing page.
9. Click Launch Campaign.

## Monitor on the display machine

1. On the display machine, open the Gophish admin interface at `http://<VM-IP>:3333`.
2. Navigate to the active campaign and open the Results tab.
3. Events appear in real time: Email Sent, Email Opened, Clicked Link, Submitted Data,
   Email Reported.
4. Project the Results tab in full screen.

Each participant's campaign appears as a separate entry. Results from all campaigns
are visible simultaneously if multiple campaigns are active, which is the normal state
during the session: each participant launches independently and results accumulate on
the display as they arrive.
