# Create a Gophish landing page

The landing page is what a participant sees after clicking a link in a phishing email.
For the afternoon session, use a credential capture page based on a login page the
participants recognise: the Microsoft 365 login or the Covenant login.

## Prerequisites

- Gophish installed and running.

## Steps

1. Log in to the Gophish admin interface at `http://<VM-IP>:3333`.
2. Go to Landing Pages > New Page.
3. Click Import Site.
4. Enter the URL of the page to clone:
   - Microsoft 365 login: `https://login.microsoftonline.com`
   - Covenant login: the Covenant tenant URL for the Home
5. Click Import. Gophish fetches the HTML and inline assets.
6. Review the imported page in the HTML editor. Remove any external script references
   that would cause the page to load Microsoft's actual login logic. The form should
   submit to Gophish.
7. Enable "Capture Submitted Data".
8. Enable "Capture Passwords". Captured credentials are visible only in the Gophish
   admin interface on the display machine and are not stored externally.
9. Set the Redirect URL to a page that makes the simulation visible to the participant
   immediately after submission. A simple static page on the VM reading "This was a
   simulation. Your credentials were captured. Contact your session facilitator." is
   sufficient.
10. Name the page clearly, for example `M365-login-clone-2026-04`.
11. Save the page.

## QR code variant

For the QR code phishing demonstration, the landing page URL is embedded in a QR code.

1. Launch the campaign and copy the phishing URL from the campaign details page.
2. Generate a QR code pointing to that URL using any QR code generator.
3. Embed the QR code image in the email template HTML. No URL appears in the email text.
4. When a participant scans the QR code on a mobile device, they are taken to the same
   landing page and the event is recorded in the campaign dashboard.

## Notes

Participants will see the cloned page and may notice it is not the real Microsoft login.
This is intentional: the session is about recognition and the debrief. The redirect page confirming the simulation appears
immediately after credential submission, closing the loop while the participant is
still engaged.
Last updated: 10 July 2026
